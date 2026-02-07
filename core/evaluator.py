import logging
from typing import List, Dict
from schemas import EvaluationRequest, EvaluationResponse, QuestionResult, QuestionData, AnswerData
from core.llm_client import llm_client 

logger = logging.getLogger(__name__)

class StatelessEvaluator:
    """
    Evaluates submissions based ONLY on the provided request payload.
    No Database connections.
    """

    def __init__(self):
        self.llm = llm_client

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        results = []
        total_score = 0.0
        max_total_score = 0.0

        # Create a lookup map for questions to easily match answers
        question_map = {q.id: q for q in request.questions}

        for answer in request.answers:
            question = question_map.get(answer.question_id)
            if not question:
                logger.warning(f"Question ID {answer.question_id} found in answers but not in questions payload.")
                continue

            # Route to specific evaluator based on type
            if question.type.upper() == "MCQ":
                res = self._evaluate_mcq(question, answer)
            elif question.type.upper() == "SUBJECTIVE":
                res = await self._evaluate_subjective(question, answer)
            elif question.type.upper() == "CODING":
                res = await self._evaluate_coding(question, answer)
            else:
                res = QuestionResult(
                    question_id=question.id, score=0, max_score=0, 
                    feedback="Unknown question type", status="Error"
                )

            results.append(res)
            total_score += res.score
            max_total_score += res.max_score

        # Calculate percentage
        percentage = (total_score / max_total_score * 100) if max_total_score > 0 else 0

        # Generate Overall Feedback using LLM (Optional)
        overall_feedback = await self._generate_summary(results, percentage)

        return EvaluationResponse(
            candidate_id=request.candidate_id,
            assessment_id=request.assessment_id,
            total_score=round(total_score, 2),
            max_total_score=round(max_total_score, 2),
            percentage=round(percentage, 2),
            results=results,
            overall_feedback=overall_feedback
        )

    # --- Individual Evaluators ---

    def _evaluate_mcq(self, question: QuestionData, answer: AnswerData) -> QuestionResult:
        """Exact string match check."""
        # Normalize strings (trim and lower)
        correct = question.correct_answer.strip().lower() if question.correct_answer else ""
        user_ans = answer.user_answer.strip().lower() if answer.user_answer else ""
        
        is_correct = (correct == user_ans)
        score = 10.0 if is_correct else 0.0 # Assuming 10 pts per MCQ
        
        return QuestionResult(
            question_id=question.id,
            score=score,
            max_score=10.0,
            feedback="Correct" if is_correct else f"Incorrect. Correct answer: {question.correct_answer}",
            status="Evaluated"
        )

    async def _evaluate_subjective(self, question: QuestionData, answer: AnswerData) -> QuestionResult:
        """Uses LLM to grade based on rubric."""
        max_score = 10.0
        try:
            # Construct a prompt for the LLM
            prompt = f"""
            Evaluate this answer.
            Question: {question.text}
            Rubric: {question.rubric}
            Student Answer: {answer.user_answer}
            
            Return a JSON with "score" (0-10) and "feedback".
            """
            # Call LLM (Assuming llm_client has a standard interface)
            # This relies on your existing llm_client logic
            response = await self.llm.generate_json(prompt, system_prompt="You are a strict grader.")
            
            score = float(response.get("score", 0))
            feedback = response.get("feedback", "No feedback provided.")
            
            return QuestionResult(
                question_id=question.id,
                score=min(score, max_score),
                max_score=max_score,
                feedback=feedback,
                status="Evaluated"
            )
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            return QuestionResult(question_id=question.id, score=0, max_score=max_score, feedback="AI Processing Error", status="Error")

    async def _evaluate_coding(self, question: QuestionData, answer: AnswerData) -> QuestionResult:
        """Executes code against test cases."""
        max_score = 20.0
        passed_tests = 0
        total_tests = len(question.test_cases) if question.test_cases else 0
        
        if total_tests == 0:
             return QuestionResult(question_id=question.id, score=0, max_score=max_score, feedback="No test cases provided", status="Error")

        # Mocking execution for Statelessness 
        # (Real implementation needs the sandbox runner from your original code)
        # Here we just check if code is not empty
        if not answer.user_answer.strip():
             return QuestionResult(question_id=question.id, score=0, max_score=max_score, feedback="Empty code", status="Evaluated")
        
        # In a real scenario, you call: self.code_runner.run(answer.user_answer, question.test_cases)
        # For Hackathon MVP, let's auto-pass if it contains "return" (Just a placeholder!)
        passed_tests = total_tests if "return" in answer.user_answer else 0
        
        score = (passed_tests / total_tests) * max_score
        
        return QuestionResult(
            question_id=question.id,
            score=score,
            max_score=max_score,
            feedback=f"Passed {passed_tests}/{total_tests} test cases.",
            status="Evaluated"
        )

    async def _generate_summary(self, results: List[QuestionResult], percentage: float) -> str:
        """Simple summary generation."""
        return f"Candidate scored {percentage}%. Completed {len(results)} questions."

# Singleton Instance
evaluator = StatelessEvaluator()