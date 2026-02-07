"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

# ─── Common Models ─────────────────────────────────────────────

# This represents a Question sent FROM Spring Boot TO Python
class QuestionContext(BaseModel):
    id: str
    type: str  # "MCQ", "SUBJECTIVE", "CODING"
    text: str
    # MCQ Fields
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    points: float = 10.0
    # Subjective Fields
    rubric: Optional[Dict] = None
    expected_answer_points: Optional[List[str]] = None
    # Coding Fields
    test_cases: Optional[List[Dict]] = None # [{"input": "...", "expected_output": "..."}]

# This represents the Candidate's Answer sent FROM Spring Boot
class CandidateAnswer(BaseModel):
    question_id: str
    user_answer: str
    language: Optional[str] = "python" # For coding

# The Full Request Payload
class EvaluationRequest(BaseModel):
    candidate_id: str
    assessment_id: str
    questions: List[QuestionContext]
    answers: List[CandidateAnswer]

# ─── Response Models ───────────────────────────────────────────

class QuestionResult(BaseModel):
    question_id: str
    score: float
    max_score: float
    feedback: str
    status: str  # "Evaluated", "Error"

class EvaluationResponse(BaseModel):
    candidate_id: str
    assessment_id: str
    total_score: float
    max_total_score: float
    percentage: float
    results: List[QuestionResult]
    overall_feedback: str