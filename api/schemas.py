"""
Pydantic schemas for API request/response validation.
=====================================================
Single source of truth for all request/response models.
Used by: main.py, evaluator.py, anti_cheat.py, analytics.py
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ─── Request Models ───────────────────────────────────────────

class JdParseRequest(BaseModel):
    """Request to parse a job description."""
    raw_text: str


class AssessmentGenerateRequest(BaseModel):
    """Request to generate an assessment from JD text."""
    jd_text: str
    mcq_count: int = 5
    subjective_count: int = 2
    coding_count: int = 1


class ResumeParseRequest(BaseModel):
    """Request to parse a resume."""
    resume_text: str


class ResumeMatchRequest(BaseModel):
    """Request to match resume against JD skills."""
    resume_text: str
    jd_skills: List[Dict]  # [{"name": "Python", "priority": "must_have", "weight": 0.9}]


class SkillGapRequest(BaseModel):
    """Request for skill gap analysis."""
    candidate_id: str
    evaluation: Dict  # The EvaluationResponse as dict
    required_skills: Dict[str, float]  # {"Python": 80.0, "SQL": 70.0}
    all_evaluations: Optional[List[Dict]] = None  # Other candidates for benchmarking


# ─── Question & Answer Models ─────────────────────────────────

class QuestionContext(BaseModel):
    """A question sent from Spring Boot to Python."""
    id: str
    type: str  # "MCQ", "SUBJECTIVE", "CODING"
    text: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    points: float = 10.0
    skill: str = ""  # Which skill this question tests
    rubric: Optional[Dict] = None
    expected_answer_points: Optional[List[str]] = None
    test_cases: Optional[List[Dict]] = None  # [{"input": "...", "expected_output": "..."}]


class CandidateAnswer(BaseModel):
    """A candidate's answer sent from Spring Boot."""
    question_id: str
    user_answer: str
    language: Optional[str] = "python"


# Aliases for backward compatibility
QuestionData = QuestionContext
AnswerData = CandidateAnswer


# ─── Evaluation Request (includes anti-cheat data) ───────────

class EvaluationRequest(BaseModel):
    """Full evaluation request with optional anti-cheat data."""
    candidate_id: str
    assessment_id: str
    questions: List[QuestionContext]
    answers: List[CandidateAnswer]
    # Anti-cheat fields (optional - sent by Spring Boot if available)
    resume_text: Optional[str] = None
    response_timings: Optional[List[Dict]] = None  # [{"question_id": "q1", "time_seconds": 45}]
    browser_events: Optional[List[Dict]] = None  # Copy-paste logs, tab switches


# ─── Response Models ──────────────────────────────────────────

class QuestionResult(BaseModel):
    """Result for a single question evaluation."""
    question_id: str
    question_type: str = ""  # "MCQ", "SUBJECTIVE", "CODING"
    skill: str = ""
    score: float
    max_score: float
    feedback: str
    status: str  # "Evaluated", "Error", "Skipped"


class EvaluationResponse(BaseModel):
    """Full evaluation response returned to Spring Boot."""
    candidate_id: str
    assessment_id: str
    total_score: float
    max_total_score: float
    percentage: float
    results: List[QuestionResult]
    overall_feedback: str
    # Skill-level breakdown
    skill_scores: Dict[str, float] = {}  # {"Python": 80.0, "SQL": 60.0}
    section_scores: Dict[str, float] = {}  # {"mcq": 70, "subjective": 50, "coding": 80}
    strengths: List[str] = []
    weaknesses: List[str] = []
    # Anti-cheat results
    integrity_score: Optional[float] = None
    integrity_flags: Optional[List[str]] = None
    integrity_recommendation: Optional[str] = None  # "clear", "review", "reject"


# ─── Anti-Cheat Request (standalone endpoint) ────────────────

class AntiCheatRequest(BaseModel):
    """Standalone anti-cheat check request."""
    candidate_id: str
    assessment_id: str
    resume_text: Optional[str] = None
    evaluation: Dict  # The EvaluationResponse as dict
    response_timings: Optional[List[Dict]] = None
    all_candidate_codes: Optional[Dict[str, List[str]]] = None  # For plagiarism cross-check
