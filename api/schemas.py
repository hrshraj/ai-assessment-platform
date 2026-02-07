# FILE: schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Existing Models (Keep these as they were) ---
class QuestionContext(BaseModel):
    id: str
    type: str 
    text: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    points: float = 10.0
    rubric: Optional[Dict] = None
    expected_answer_points: Optional[List[str]] = None
    test_cases: Optional[List[Dict]] = None

class CandidateAnswer(BaseModel):
    question_id: str
    user_answer: str
    language: Optional[str] = "python"

# --- NEW: Resume Parsing Request ---
class ResumeParseRequest(BaseModel):
    resume_text: str
    job_description_skills: Optional[List[Dict]] = None # Optional: to match against JD immediately

class AssessmentGenerateRequest(BaseModel):
    job_description_text: str
    mcq_count: int = 5
    subjective_count: int = 2
    coding_count: int = 1

# --- UPDATED: Evaluation Request (Now includes Anti-Cheat Data) ---
class EvaluationRequest(BaseModel):
    candidate_id: str
    assessment_id: str
    questions: List[QuestionContext]
    answers: List[CandidateAnswer]
    # NEW FIELDS FOR ANTI-CHEAT
    resume_text: Optional[str] = None
    response_timings: Optional[List[Dict]] = None  # [{"question_id": "q1", "time_seconds": 45}]
    browser_events: Optional[List[Dict]] = None    # Copy-paste logs, tab switches
    webcam_snapshots: Optional[List[str]] = None   # Base64 strings (if you are sending them)

# --- Response Models (Keep existing) ---
class QuestionResult(BaseModel):
    question_id: str
    score: float
    max_score: float
    feedback: str
    status: str

class EvaluationResponse(BaseModel):
    candidate_id: str
    assessment_id: str
    total_score: float
    max_total_score: float
    percentage: float
    results: List[QuestionResult]
    overall_feedback: str
    integrity_score: Optional[float] = None # NEW: Return integrity score to Java
    integrity_flags: Optional[List[str]] = None # NEW: Return flags