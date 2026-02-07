"""
Stateless Evaluator
====================
Evaluates candidate answers using:
- Exact match for MCQ
- LLM-based rubric scoring for Subjective
- Code execution + test cases for Coding
- Integrated anti-cheat when resume_text/timings are provided
"""
import sys
import io
import logging
import contextlib

from api.schemas import (
    EvaluationRequest, EvaluationResponse, QuestionResult,
    QuestionContext, CandidateAnswer,
)
from core.llm_client import llm_client

logger = logging.getLogger(__name__)

# Aliases for backward compatibility
QuestionData = QuestionContext
AnswerData = CandidateAnswer
CandidateEvaluation = EvaluationResponse


class StatelessEvaluator:
    """Evaluates candidate submissions with LLM-powered grading."""

    def __init__(self):
        self.llm = llm_client

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        """Full evaluation pipeline: grade all answers + optional anti-cheat."""
        results = []
        total_score = 0.0
        max_total_score = 0.0

        # Build answer lookup
        answers_map = {a.question_id: a for a in request.answers}

        # Track per-skill and per-section scores
        skill_scores_sum = {}   # {"Python": [80, 90], ...}
        section_scores = {"mcq": [], "subjective": [], "coding": []}

        for question in request.questions:
            answer = answers_map.get(question.id)
            max_score = question.points
            q_type = question.type.upper()

            if not answer:
                result = QuestionResult(
                    question_id=question.id, question_type=q_type,
                    skill=question.skill, score=0.0, max_score=max_score,
                    feedback="No answer provided", status="Skipped",
                )
            elif q_type == "MCQ":
                result = self._evaluate_mcq(question, answer)
            elif q_type == "SUBJECTIVE":
                result = await self._evaluate_subjective(question, answer)
            elif q_type == "CODING":
                result = await self._evaluate_coding(question, answer)
            else:
                result = QuestionResult(
                    question_id=question.id, question_type=q_type,
                    skill=question.skill, score=0.0, max_score=max_score,
                    feedback=f"Unknown question type: {question.type}", status="Error",
                )

            results.append(result)
            total_score += result.score
            max_total_score += result.max_score

            # Track skill scores
            if question.skill:
                pct = (result.score / result.max_score * 100) if result.max_score > 0 else 0
                skill_scores_sum.setdefault(question.skill, []).append(pct)

            # Track section scores
            section_key = q_type.lower()
            if section_key in section_scores:
                section_scores[section_key].append(
                    (result.score / result.max_score * 100) if result.max_score > 0 else 0
                )

        percentage = (total_score / max_total_score * 100) if max_total_score > 0 else 0.0

        # Compute averages
        skill_scores = {k: round(sum(v) / len(v), 1) for k, v in skill_scores_sum.items()}
        section_avgs = {k: round(sum(v) / len(v), 1) for k, v in section_scores.items() if v}

        # Determine strengths and weaknesses
        strengths = [f"{k}: {v}%" for k, v in skill_scores.items() if v >= 70]
        weaknesses = [f"{k}: {v}%" for k, v in skill_scores.items() if v < 50]

        # Generate summary
        overall_feedback = await self._generate_summary(results, percentage, strengths, weaknesses)

        # Anti-cheat integration (if data provided)
        integrity_score = None
        integrity_flags = None
        integrity_recommendation = None

        if request.resume_text or request.response_timings:
            try:
                from core.anti_cheat import anti_cheat
                eval_data = {
                    "percentage": percentage,
                    "skill_scores": skill_scores,
                    "results": [r.model_dump() for r in results],
                }
                report = await anti_cheat.full_integrity_check(
                    candidate_id=request.candidate_id,
                    assessment_id=request.assessment_id,
                    evaluation_data=eval_data,
                    resume_text=request.resume_text,
                    response_timings=request.response_timings,
                )
                integrity_score = report.overall_integrity_score
                integrity_flags = [f.description for f in report.flags]
                integrity_recommendation = report.recommendation
            except Exception as e:
                logger.warning(f"Anti-cheat check failed (non-fatal): {e}")
                integrity_flags = [f"Anti-cheat error: {str(e)}"]

        return EvaluationResponse(
            candidate_id=request.candidate_id,
            assessment_id=request.assessment_id,
            total_score=round(total_score, 2),
            max_total_score=round(max_total_score, 2),
            percentage=round(percentage, 2),
            results=results,
            overall_feedback=overall_feedback,
            skill_scores=skill_scores,
            section_scores=section_avgs,
            strengths=strengths,
            weaknesses=weaknesses,
            integrity_score=integrity_score,
            integrity_flags=integrity_flags,
            integrity_recommendation=integrity_recommendation,
        )

    # ─── MCQ Evaluation ───────────────────────────────────────

    def _evaluate_mcq(self, question: QuestionContext, answer: CandidateAnswer) -> QuestionResult:
        """Exact string match for MCQ."""
        correct = (question.correct_answer or "").strip().lower()
        user_ans = (answer.user_answer or "").strip().lower()
        is_correct = correct == user_ans
        score = question.points if is_correct else 0.0

        return QuestionResult(
            question_id=question.id, question_type="MCQ",
            skill=question.skill, score=score, max_score=question.points,
            feedback="Correct" if is_correct else f"Incorrect. Expected: {question.correct_answer}",
            status="Evaluated",
        )

    # ─── Subjective Evaluation (LLM-powered) ─────────────────

    async def _evaluate_subjective(self, question: QuestionContext, answer: CandidateAnswer) -> QuestionResult:
        """LLM-based rubric evaluation for subjective answers."""
        max_score = question.points
        try:
            rubric_str = str(question.rubric) if question.rubric else "Evaluate on completeness, accuracy, and clarity"
            expected_str = ", ".join(question.expected_answer_points) if question.expected_answer_points else "N/A"

            prompt = f"""Evaluate this answer strictly.

Question: {question.text}
Rubric: {rubric_str}
Expected key points: {expected_str}
Student's Answer: {answer.user_answer}

Return JSON with:
- "score": float from 0 to {max_score}
- "feedback": detailed feedback explaining the score
"""
            response = await self.llm.generate_json(
                prompt=prompt,
                system_prompt="You are a strict but fair grader. Score based on the rubric. Respond in JSON only.",
                temperature=0.2,
            )

            score = min(float(response.get("score", 0)), max_score)
            feedback = response.get("feedback", "No feedback provided.")

            return QuestionResult(
                question_id=question.id, question_type="SUBJECTIVE",
                skill=question.skill, score=round(score, 1), max_score=max_score,
                feedback=feedback, status="Evaluated",
            )
        except Exception as e:
            logger.error(f"Subjective eval error for {question.id}: {e}")
            return QuestionResult(
                question_id=question.id, question_type="SUBJECTIVE",
                skill=question.skill, score=0.0, max_score=max_score,
                feedback=f"AI evaluation error: {str(e)}", status="Error",
            )

    # ─── Coding Evaluation ────────────────────────────────────

    async def _evaluate_coding(self, question: QuestionContext, answer: CandidateAnswer) -> QuestionResult:
        """Execute code against test cases. WARNING: Uses exec() - hackathon only."""
        max_score = question.points
        total_tests = len(question.test_cases) if question.test_cases else 0

        if total_tests == 0:
            return QuestionResult(
                question_id=question.id, question_type="CODING",
                skill=question.skill, score=0, max_score=max_score,
                feedback="No test cases provided", status="Error",
            )

        user_code = answer.user_answer
        if not user_code or not user_code.strip():
            return QuestionResult(
                question_id=question.id, question_type="CODING",
                skill=question.skill, score=0, max_score=max_score,
                feedback="Empty code submission", status="Evaluated",
            )

        passed_tests = 0
        feedback_lines = []

        for case in question.test_cases:
            inp = case.get("input")
            exp = case.get("expected_output")

            output_capture = io.StringIO()
            try:
                with contextlib.redirect_stdout(output_capture):
                    local_scope = {}
                    exec(user_code, {}, local_scope)

                    if 'solution' in local_scope:
                        result = local_scope['solution'](inp)
                        actual_output = str(result)
                        if result is None:
                            actual_output = output_capture.getvalue().strip()
                    else:
                        actual_output = "Error: Function 'solution' not found"

            except Exception as e:
                feedback_lines.append(f"Test '{inp}': Runtime Error ({str(e)})")
                continue

            if str(actual_output).strip() == str(exp).strip():
                passed_tests += 1
            else:
                feedback_lines.append(f"Test '{inp}': Expected '{exp}', got '{actual_output}'")

        score = (passed_tests / total_tests) * max_score

        return QuestionResult(
            question_id=question.id, question_type="CODING",
            skill=question.skill, score=round(score, 1), max_score=max_score,
            feedback=f"Passed {passed_tests}/{total_tests} tests. " + " | ".join(feedback_lines[:3]),
            status="Evaluated",
        )

    # ─── Summary Generation ───────────────────────────────────

    async def _generate_summary(self, results, percentage, strengths, weaknesses) -> str:
        """Generate human-readable evaluation summary."""
        total = len(results)
        evaluated = sum(1 for r in results if r.status == "Evaluated")
        strength_str = ", ".join(strengths[:3]) if strengths else "None identified"
        weakness_str = ", ".join(weaknesses[:3]) if weaknesses else "None identified"

        return (
            f"Candidate scored {percentage:.1f}% ({evaluated}/{total} questions evaluated). "
            f"Strengths: {strength_str}. "
            f"Areas to improve: {weakness_str}."
        )


evaluator = StatelessEvaluator()
