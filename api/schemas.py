"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Auth ──────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "candidate"  # "candidate" or "recruiter"


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


# ─── Job Description ──────────────────────────────────────────

class JDCreateRequest(BaseModel):
    title: str
    raw_text: str


class JDResponse(BaseModel):
    id: str
    title: str
    parsed_data: dict
    status: str


# ─── Assessment ────────────────────────────────────────────────

class AssessmentCreateRequest(BaseModel):
    jd_id: str
    mcq_count: Optional[int] = None
    subjective_count: Optional[int] = None
    coding_count: Optional[int] = None
    duration_minutes: Optional[int] = None
    cutoff_percentage: float = 50.0
    custom_difficulty: Optional[dict] = None


class AssessmentResponse(BaseModel):
    id: str
    title: str
    duration_minutes: int
    total_points: float
    mcq_count: int
    subjective_count: int
    coding_count: int
    skill_coverage: dict
    difficulty_distribution: dict


# ─── Candidate Submission ──────────────────────────────────────

class StartAssessmentRequest(BaseModel):
    assessment_id: str
    candidate_id: str


class SubmitAnswersRequest(BaseModel):
    submission_id: str
    candidate_id: str
    mcq_answers: list[dict] = []
    # [{"question_id": "mcq_1", "selected_answer": "B", "time_taken_seconds": 45}]
    subjective_answers: dict = {}
    # {"subj_1": "My answer text...", "subj_2": "..."}
    coding_answers: dict = {}
    # {"code_1": {"code": "def solution()...", "language": "python"}}
    response_timings: list[dict] = []
    # [{"question_id": "mcq_1", "time_seconds": 45}]


class EvaluationResponse(BaseModel):
    candidate_id: str
    assessment_id: str
    total_score: float
    max_total_score: float
    percentage: float
    section_scores: dict
    skill_scores: dict
    strengths: list[str]
    weaknesses: list[str]
    overall_feedback: str
    integrity_score: Optional[float] = None
    integrity_flags: list[str] = []


# ─── Resume ────────────────────────────────────────────────────

class ResumeUploadResponse(BaseModel):
    candidate_id: str
    parsed_skills: list[dict]
    total_experience_years: float
    summary: str


class ResumeMatchResponse(BaseModel):
    match_percentage: float
    matched_skills: list[dict]
    missing_skills: list[dict]
    overall_fit: str
    recommendation: str


# ─── Leaderboard & Analytics ──────────────────────────────────

class LeaderboardRequest(BaseModel):
    assessment_id: str
    cutoff_percentage: float = 0.0


class RecruiterDashboard(BaseModel):
    total_jds: int
    total_assessments: int
    total_candidates: int
    active_assessments: list[dict]
    recent_completions: list[dict]
