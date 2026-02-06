"""
AI Evaluation Engine
=====================
Evaluates candidate responses using AI:
- MCQ: Direct comparison grading
- Subjective: AI rubric-based evaluation with explanation
- Coding: Code execution + AI quality analysis
- Generates detailed per-question feedback
"""
import logging
import json
import subprocess
import tempfile
import os
import time
from typing import Optional
from pydantic import BaseModel, Field

from core.llm_client import llm_client
from core.question_generator import (
    MCQQuestion, SubjectiveQuestion, CodingQuestion, Assessment
)
from config import settings

logger = logging.getLogger(__name__)


# ─── Evaluation Result Models ──────────────────────────────────

class MCQResult(BaseModel):
    question_id: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    points_earned: float
    max_points: float
    time_taken_seconds: int = 0


class SubjectiveResult(BaseModel):
    question_id: str
    answer_text: str
    scores: dict  # {"completeness": 2, "accuracy": 3, ...}
    total_score: float
    max_score: float
    feedback: str
    key_points_covered: list[str]
    key_points_missed: list[str]
    confidence: float = Field(ge=0, le=1.0, description="AI confidence in evaluation")


class CodeTestResult(BaseModel):
    test_case_index: int
    passed: bool
    input_data: str
    expected_output: str
    actual_output: str
    error: Optional[str] = None


class CodingResult(BaseModel):
    question_id: str
    submitted_code: str
    language: str
    test_results: list[CodeTestResult]
    tests_passed: int
    total_tests: int
    execution_score: float  # Based on test cases
    quality_score: float  # AI-evaluated code quality
    total_score: float
    max_score: float
    feedback: str
    code_quality_analysis: dict  # {"readability": 8, "efficiency": 7, ...}
    execution_time_ms: Optional[float] = None


class CandidateEvaluation(BaseModel):
    candidate_id: str
    assessment_id: str
    mcq_results: list[MCQResult]
    subjective_results: list[SubjectiveResult]
    coding_results: list[CodingResult]
    total_score: float
    max_total_score: float
    percentage: float
    section_scores: dict  # {"mcq": 8, "subjective": 35, "coding": 50}
    skill_scores: dict[str, float]  # {"Python": 85.0, "SQL": 70.0}
    time_taken_seconds: int
    strengths: list[str]
    weaknesses: list[str]
    overall_feedback: str
    flag_reasons: list[str] = []  # Anti-cheat flags


# ─── Prompt Templates ─────────────────────────────────────────

SUBJECTIVE_EVAL_SYSTEM = """You are an expert technical evaluator. Evaluate candidate answers against the rubric 
and expected answer points. Be fair but rigorous. Always respond in valid JSON."""

SUBJECTIVE_EVAL_PROMPT = """Evaluate this candidate's answer to a {difficulty} level {skill} question.

QUESTION: {question}

EXPECTED KEY POINTS:
{expected_points}

RUBRIC:
{rubric}

CANDIDATE'S ANSWER:
---
{candidate_answer}
---

Return JSON:
{{
    "scores": {{
        "completeness": <int 0 to {completeness_max}>,
        "accuracy": <int 0 to {accuracy_max}>,
        "clarity": <int 0 to {clarity_max}>,
        "depth": <int 0 to {depth_max}>
    }},
    "total_score": <float>,
    "max_score": {max_score},
    "feedback": "Detailed constructive feedback for the candidate",
    "key_points_covered": ["point 1", "point 2"],
    "key_points_missed": ["missed point 1"],
    "confidence": 0.85
}}

EVALUATION RULES:
1. Score ONLY based on the rubric criteria
2. An empty or irrelevant answer gets 0 across all criteria
3. Partial credit is allowed and encouraged
4. Feedback should be specific and actionable
5. Confidence reflects how certain you are about the score (0.0-1.0)
"""

CODE_QUALITY_SYSTEM = """You are an expert code reviewer evaluating submitted code for a technical assessment.
Analyze code quality, efficiency, and correctness. Always respond in valid JSON."""

CODE_QUALITY_PROMPT = """Evaluate this code submission for the following problem.

PROBLEM: {problem_statement}
LANGUAGE: {language}
DIFFICULTY: {difficulty}

SUBMITTED CODE:
```{language}
{code}
```

TEST RESULTS: {tests_passed}/{total_tests} passed

Return JSON:
{{
    "quality_score": <float 0-10>,
    "analysis": {{
        "readability": <int 1-10>,
        "efficiency": <int 1-10>,
        "correctness_approach": <int 1-10>,
        "error_handling": <int 1-10>,
        "code_style": <int 1-10>
    }},
    "feedback": "Detailed code review feedback",
    "issues": ["issue 1", "issue 2"],
    "suggestions": ["suggestion 1"]
}}
"""

OVERALL_EVAL_SYSTEM = """You are a senior technical hiring manager summarizing a candidate's assessment performance.
Provide actionable insights. Always respond in valid JSON."""

OVERALL_EVAL_PROMPT = """Summarize this candidate's assessment performance.

JOB TITLE: {job_title}
TOTAL SCORE: {total_score}/{max_score} ({percentage}%)

SECTION BREAKDOWN:
- MCQ: {mcq_score}/{mcq_max} ({mcq_pct}%)
- Subjective: {subj_score}/{subj_max} ({subj_pct}%)
- Coding: {code_score}/{code_max} ({code_pct}%)

SKILL-WISE PERFORMANCE:
{skill_breakdown}

Return JSON:
{{
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "overall_feedback": "2-3 paragraph summary of candidate's performance and recommendation",
    "hire_recommendation": "strong_yes|yes|maybe|no|strong_no",
    "skill_gaps": ["gap 1", "gap 2"]
}}
"""


# ─── Evaluator Class ──────────────────────────────────────────

class Evaluator:
    """Evaluates candidate responses across all question types."""

    def __init__(self):
        self.llm = llm_client

    # ── MCQ Evaluation (deterministic) ──

    def evaluate_mcqs(
        self, questions: list[MCQQuestion], answers: list[dict]
    ) -> list[MCQResult]:
        """Evaluate MCQ answers. Deterministic - no AI needed."""
        results = []
        answer_map = {a["question_id"]: a for a in answers}

        for q in questions:
            ans = answer_map.get(q.id, {})
            selected = ans.get("selected_answer", "")
            is_correct = selected.upper() == q.correct_answer.upper()

            results.append(MCQResult(
                question_id=q.id,
                selected_answer=selected,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
                points_earned=q.points if is_correct else 0,
                max_points=q.points,
                time_taken_seconds=ans.get("time_taken_seconds", 0),
            ))
        return results

    # ── Subjective Evaluation (AI-powered) ──

    async def evaluate_subjective(
        self, question: SubjectiveQuestion, candidate_answer: str
    ) -> SubjectiveResult:
        """Evaluate a subjective answer using AI rubric-based scoring."""
        rubric = question.rubric
        prompt = SUBJECTIVE_EVAL_PROMPT.format(
            difficulty=question.difficulty,
            skill=question.skill,
            question=question.question,
            expected_points=json.dumps(question.expected_answer_points, indent=2),
            rubric=json.dumps(rubric, indent=2),
            candidate_answer=candidate_answer or "(No answer provided)",
            completeness_max=rubric.get("completeness", {}).get("max", 3),
            accuracy_max=rubric.get("accuracy", {}).get("max", 3),
            clarity_max=rubric.get("clarity", {}).get("max", 2),
            depth_max=rubric.get("depth", {}).get("max", 2),
            max_score=question.max_points,
        )

        result = await self.llm.generate_json(
            prompt=prompt,
            system_prompt=SUBJECTIVE_EVAL_SYSTEM,
            temperature=0.2,
        )

        return SubjectiveResult(
            question_id=question.id,
            answer_text=candidate_answer or "",
            scores=result.get("scores", {}),
            total_score=float(result.get("total_score", 0)),
            max_score=question.max_points,
            feedback=result.get("feedback", "Evaluation failed"),
            key_points_covered=result.get("key_points_covered", []),
            key_points_missed=result.get("key_points_missed", []),
            confidence=float(result.get("confidence", 0.5)),
        )

    # ── Coding Evaluation (Execution + AI) ──

    async def evaluate_coding(
        self, question: CodingQuestion, submitted_code: str, language: str
    ) -> CodingResult:
        """Evaluate coding submission: run tests + AI quality analysis."""
        # Step 1: Execute test cases
        test_results = await self._run_test_cases(
            submitted_code, language, question.test_cases
        )
        tests_passed = sum(1 for t in test_results if t.passed)
        total_tests = len(test_results)

        # Execution score (60% of coding score)
        exec_ratio = tests_passed / total_tests if total_tests > 0 else 0
        execution_score = exec_ratio * question.max_points * 0.6

        # Step 2: AI code quality analysis (40% of coding score)
        quality_result = await self._evaluate_code_quality(
            question, submitted_code, language, tests_passed, total_tests
        )
        quality_score = (quality_result.get("quality_score", 0) / 10) * question.max_points * 0.4

        total_score = round(execution_score + quality_score, 2)

        return CodingResult(
            question_id=question.id,
            submitted_code=submitted_code,
            language=language,
            test_results=test_results,
            tests_passed=tests_passed,
            total_tests=total_tests,
            execution_score=round(execution_score, 2),
            quality_score=round(quality_score, 2),
            total_score=total_score,
            max_score=question.max_points,
            feedback=quality_result.get("feedback", ""),
            code_quality_analysis=quality_result.get("analysis", {}),
        )

    async def _run_test_cases(
        self, code: str, language: str, test_cases: list[dict]
    ) -> list[CodeTestResult]:
        """Execute code against test cases in a sandboxed environment."""
        results = []
        for i, tc in enumerate(test_cases):
            try:
                actual_output = await self._execute_code(
                    code, language, tc.get("input", "")
                )
                expected = str(tc.get("expected_output", "")).strip()
                actual = str(actual_output).strip()
                passed = actual == expected

                results.append(CodeTestResult(
                    test_case_index=i,
                    passed=passed,
                    input_data=str(tc.get("input", "")),
                    expected_output=expected,
                    actual_output=actual,
                ))
            except Exception as e:
                results.append(CodeTestResult(
                    test_case_index=i,
                    passed=False,
                    input_data=str(tc.get("input", "")),
                    expected_output=str(tc.get("expected_output", "")),
                    actual_output="",
                    error=str(e)[:500],
                ))
        return results

    async def _execute_code(
        self, code: str, language: str, input_data: str
    ) -> str:
        """Execute code in a sandboxed subprocess with timeout."""
        ext_map = {"python": ".py", "java": ".java", "javascript": ".js"}
        cmd_map = {
            "python": lambda f: ["python3", f],
            "javascript": lambda f: ["node", f],
        }

        ext = ext_map.get(language, ".py")
        if language not in cmd_map:
            return f"Language {language} not supported for execution"

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=ext, delete=False, dir="/tmp"
        ) as f:
            f.write(code)
            f.flush()
            filepath = f.name

        try:
            result = subprocess.run(
                cmd_map[language](filepath),
                input=input_data,
                capture_output=True,
                text=True,
                timeout=settings.MAX_CODE_EXEC_TIME,
                cwd="/tmp",
            )
            if result.returncode != 0:
                return f"ERROR: {result.stderr[:500]}"
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            return "ERROR: Time Limit Exceeded"
        except Exception as e:
            return f"ERROR: {str(e)[:500]}"
        finally:
            os.unlink(filepath)

    async def _evaluate_code_quality(
        self,
        question: CodingQuestion,
        code: str,
        language: str,
        tests_passed: int,
        total_tests: int,
    ) -> dict:
        """AI-powered code quality evaluation."""
        prompt = CODE_QUALITY_PROMPT.format(
            problem_statement=question.problem_statement,
            language=language,
            difficulty=question.difficulty,
            code=code or "(No code submitted)",
            tests_passed=tests_passed,
            total_tests=total_tests,
        )
        result = await self.llm.generate_json(
            prompt=prompt,
            system_prompt=CODE_QUALITY_SYSTEM,
            temperature=0.2,
        )
        return result

    # ── Full Candidate Evaluation ──

    async def evaluate_candidate(
        self,
        candidate_id: str,
        assessment: Assessment,
        responses: dict,
        time_taken_seconds: int = 0,
    ) -> CandidateEvaluation:
        """Run complete evaluation for a candidate."""
        # 1. Evaluate MCQs
        mcq_results = self.evaluate_mcqs(
            assessment.mcq_questions,
            responses.get("mcq_answers", []),
        )

        # 2. Evaluate Subjective answers
        subj_results = []
        for q in assessment.subjective_questions:
            ans = responses.get("subjective_answers", {}).get(q.id, "")
            result = await self.evaluate_subjective(q, ans)
            subj_results.append(result)

        # 3. Evaluate Coding submissions
        code_results = []
        for q in assessment.coding_questions:
            submission = responses.get("coding_answers", {}).get(q.id, {})
            code = submission.get("code", "")
            lang = submission.get("language", "python")
            result = await self.evaluate_coding(q, code, lang)
            code_results.append(result)

        # 4. Calculate scores
        mcq_score = sum(r.points_earned for r in mcq_results)
        mcq_max = sum(r.max_points for r in mcq_results)
        subj_score = sum(r.total_score for r in subj_results)
        subj_max = sum(r.max_score for r in subj_results)
        code_score = sum(r.total_score for r in code_results)
        code_max = sum(r.max_score for r in code_results)

        total_score = mcq_score + subj_score + code_score
        max_total = mcq_max + subj_max + code_max
        percentage = round((total_score / max_total * 100) if max_total > 0 else 0, 2)

        # 5. Calculate skill-wise scores
        skill_scores = self._calculate_skill_scores(
            mcq_results, subj_results, code_results,
            assessment.mcq_questions, assessment.subjective_questions, assessment.coding_questions
        )

        # 6. Generate overall feedback
        overall = await self._generate_overall_feedback(
            assessment.job_title, total_score, max_total, percentage,
            mcq_score, mcq_max, subj_score, subj_max,
            code_score, code_max, skill_scores,
        )

        return CandidateEvaluation(
            candidate_id=candidate_id,
            assessment_id=assessment.id,
            mcq_results=mcq_results,
            subjective_results=subj_results,
            coding_results=code_results,
            total_score=round(total_score, 2),
            max_total_score=round(max_total, 2),
            percentage=percentage,
            section_scores={
                "mcq": round(mcq_score, 2),
                "mcq_max": round(mcq_max, 2),
                "subjective": round(subj_score, 2),
                "subjective_max": round(subj_max, 2),
                "coding": round(code_score, 2),
                "coding_max": round(code_max, 2),
            },
            skill_scores=skill_scores,
            time_taken_seconds=time_taken_seconds,
            strengths=overall.get("strengths", []),
            weaknesses=overall.get("weaknesses", []),
            overall_feedback=overall.get("overall_feedback", ""),
        )

    def _calculate_skill_scores(
        self, mcq_results, subj_results, code_results,
        mcq_questions, subj_questions, code_questions,
    ) -> dict[str, float]:
        """Calculate per-skill percentage scores."""
        skill_earned = {}
        skill_max = {}

        # MCQ skills
        for q, r in zip(mcq_questions, mcq_results):
            skill_earned[q.skill] = skill_earned.get(q.skill, 0) + r.points_earned
            skill_max[q.skill] = skill_max.get(q.skill, 0) + r.max_points

        # Subjective skills
        for q, r in zip(subj_questions, subj_results):
            skill_earned[q.skill] = skill_earned.get(q.skill, 0) + r.total_score
            skill_max[q.skill] = skill_max.get(q.skill, 0) + r.max_score

        # Coding skills
        for q, r in zip(code_questions, code_results):
            skill_earned[q.skill] = skill_earned.get(q.skill, 0) + r.total_score
            skill_max[q.skill] = skill_max.get(q.skill, 0) + r.max_score

        return {
            skill: round((skill_earned[skill] / skill_max[skill]) * 100, 1)
            if skill_max[skill] > 0 else 0
            for skill in skill_max
        }

    async def _generate_overall_feedback(
        self, job_title, total, max_score, pct,
        mcq_s, mcq_m, subj_s, subj_m, code_s, code_m, skill_scores,
    ) -> dict:
        """Generate overall evaluation feedback using AI."""
        mcq_pct = round(mcq_s / mcq_m * 100, 1) if mcq_m > 0 else 0
        subj_pct = round(subj_s / subj_m * 100, 1) if subj_m > 0 else 0
        code_pct = round(code_s / code_m * 100, 1) if code_m > 0 else 0

        skill_breakdown = "\n".join(
            f"  - {skill}: {score}%" for skill, score in skill_scores.items()
        )

        prompt = OVERALL_EVAL_PROMPT.format(
            job_title=job_title,
            total_score=round(total, 1), max_score=round(max_score, 1),
            percentage=pct,
            mcq_score=round(mcq_s, 1), mcq_max=round(mcq_m, 1), mcq_pct=mcq_pct,
            subj_score=round(subj_s, 1), subj_max=round(subj_m, 1), subj_pct=subj_pct,
            code_score=round(code_s, 1), code_max=round(code_m, 1), code_pct=code_pct,
            skill_breakdown=skill_breakdown,
        )

        return await self.llm.generate_json(
            prompt=prompt,
            system_prompt=OVERALL_EVAL_SYSTEM,
            temperature=0.3,
        )


# Singleton
evaluator = Evaluator()
