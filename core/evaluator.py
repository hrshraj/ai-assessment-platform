import sys
import io
import contextlib
from api.schemas import (
    EvaluationRequest, EvaluationResponse, QuestionResult,
    QuestionContext, CandidateAnswer
)

# Aliases to match existing usage hints
QuestionData = QuestionContext
AnswerData = CandidateAnswer
CandidateEvaluation = EvaluationResponse

class StatelessEvaluator:
    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        results = []
        total_score = 0.0
        max_total_score = 0.0
        
        # Create a map of answers for fast lookup
        answers_map = {a.question_id: a for a in request.answers}
        
        for question in request.questions:
            answer = answers_map.get(question.id)
            max_score = question.points
            
            if not answer:
                result = QuestionResult(
                    question_id=question.id,
                    score=0.0,
                    max_score=max_score,
                    feedback="No answer provided",
                    status="Skipped"
                )
            else:
                if question.type == "CODING" or question.type == "coding":
                    result = await self._evaluate_coding(question, answer)
                else:
                    # Simple mock evaluation for non-coding questions for now
                    # In a real system, this would use LLM or strict matching
                    # For MCQ, checking 'correct_answer' vs 'user_answer'
                    score = 0.0
                    feedback = "Evaluated"
                    
                    if question.type == "MCQ" or question.type == "mcq":
                         if question.correct_answer and answer.user_answer == question.correct_answer:
                             score = max_score
                             feedback = "Correct"
                         else:
                             feedback = f"Incorrect. Expected {question.correct_answer}"
                    else:
                        # Subjective - give full marks for now or 0? 
                        # Let's give 0 to be safe, or full?
                        # Let's give full to avoid blocking success paths in tests?
                        # Actually getting 0 is safer.
                        score = 0.0
                        feedback = "Subjective evaluation not implemented in this mock."

                    result = QuestionResult(
                        question_id=question.id,
                        score=score,
                        max_score=max_score,
                        feedback=feedback,
                        status="Evaluated"
                    )
            
            results.append(result)
            total_score += result.score
            max_total_score += result.max_score
            
        percentage = (total_score / max_total_score * 100) if max_total_score > 0 else 0.0
        
        return EvaluationResponse(
            candidate_id=request.candidate_id,
            assessment_id=request.assessment_id,
            total_score=total_score,
            max_total_score=max_total_score,
            percentage=percentage,
            results=results,
            overall_feedback="Evaluation complete."
        )

    async def _evaluate_coding(self, question: QuestionData, answer: AnswerData) -> QuestionResult:
        """
        Executes code against test cases.
        WARNING: Uses exec(). UNSAFE for production. Okay for Hackathon demo only.
        """
        max_score = question.points
        passed_tests = 0
        total_tests = len(question.test_cases) if question.test_cases else 0
        
        if total_tests == 0:
             return QuestionResult(question_id=question.id, score=0, max_score=max_score, feedback="No test cases", status="Error")

        user_code = answer.user_answer
        if not user_code or not user_code.strip():
             return QuestionResult(question_id=question.id, score=0, max_score=max_score, feedback="Empty code", status="Evaluated")

        feedback_lines = []

        for case in question.test_cases:
            inp = case.get("input")
            exp = case.get("expected_output")
            
            # Prepare the execution environment
            # We assume the user wrote a function named 'solution(arg)' or similar.
            # Only works if the user code defines the function expected by the test runner.
            
            # Capture Stdout
            output_capture = io.StringIO()
            try:
                with contextlib.redirect_stdout(output_capture):
                    # Create a safe-ish dictionary for locals
                    local_scope = {}
                    exec(user_code, {}, local_scope)
                    
                    # Assume the function name is 'solution'
                    if 'solution' in local_scope:
                        result = local_scope['solution'](inp)
                        # If result is not None, print it to capture? 
                        # Or just use result.
                        actual_output = str(result)
                        # If result is None, maybe it printed?
                        if result is None:
                             actual_output = output_capture.getvalue().strip()
                    else:
                        actual_output = "Error: Function 'solution' not found"
                        
            except Exception as e:
                feedback_lines.append(f"Test case '{inp}': Runtime Error ({str(e)})")
                continue

            # Check Output
            # Basic string comparison (normalize types if needed)
            if str(actual_output).strip() == str(exp).strip():
                passed_tests += 1
            else:
                feedback_lines.append(f"Test case '{inp}': Failed. Expected '{exp}', got '{actual_output}'")

        score = (passed_tests / total_tests) * max_score
        
        return QuestionResult(
            question_id=question.id,
            score=score,
            max_score=max_score,
            feedback=f"Passed {passed_tests}/{total_tests} tests.\n" + "\n".join(feedback_lines[:3]),
            status="Evaluated"
        )

evaluator = StatelessEvaluator()