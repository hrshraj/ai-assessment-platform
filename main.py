"""
AI Assessment Platform - Main API
===================================
Complete REST API with all endpoints for:
- Auth (register, login)
- JD Management (create, parse)
- Assessment Generation
- Candidate Assessment Flow
- Evaluation & Scoring
- Anti-Cheat Analysis
- Leaderboard & Analytics
- Resume Management
"""
import logging
import json
import uuid
import traceback
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from config import settings
from models.database import (
    init_db, get_db, User, JobDescription, AssessmentRecord,
    CandidateSubmission, CandidateResume,
)
from api.schemas import *
from api.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_recruiter,
)
from core.jd_parser import jd_parser
from core.question_generator import question_generator
from core.evaluator import evaluator
from core.anti_cheat import anti_cheat
from core.resume_parser import resume_parser
from core.analytics import analytics
from core.llm_client import llm_client

# ─── App Setup ─────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    init_db()
    logger.info("🚀 AI Assessment Platform started!")
    healthy = await llm_client.check_health()
    if healthy:
        logger.info(f"✅ LLM ({settings.OLLAMA_MODEL}) is available")
    else:
        logger.warning(f"⚠️ LLM ({settings.OLLAMA_MODEL}) not available. Run: ollama pull {settings.OLLAMA_MODEL}")
    yield
    logger.info("👋 Shutting down...")


app = FastAPI(
    title="AI Assessment Platform",
    description="AI-powered assessment & evaluation to eliminate fake applications",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and return proper JSON errors."""
    logger.error(f"Unhandled error: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


# ═══════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=TokenResponse, tags=["Auth"])
async def register(req: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (candidate or recruiter)."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
    )
    db.add(user)
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role)


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(req: UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role)


# ═══════════════════════════════════════════════════════════════
# JOB DESCRIPTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/jd/create", tags=["Job Description"])
async def create_jd(
    req: JDCreateRequest,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Upload & parse a job description (recruiter only)."""
    # Parse with AI
    parsed = await jd_parser.parse(req.raw_text)

    jd = JobDescription(
        id=str(uuid.uuid4()),
        recruiter_id=user.id,
        title=req.title or parsed.job_title,
        raw_text=req.raw_text,
        parsed_data=parsed.model_dump(),
        status="active",
    )
    db.add(jd)
    db.commit()

    return {
        "id": jd.id,
        "title": jd.title,
        "parsed_data": parsed.model_dump(),
        "message": f"JD parsed: {len(parsed.skills)} skills extracted, {parsed.experience_level} level",
    }


@app.get("/api/jd/{jd_id}", tags=["Job Description"])
async def get_jd(jd_id: str, db: Session = Depends(get_db)):
    """Get a parsed job description."""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(404, "JD not found")
    return {"id": jd.id, "title": jd.title, "parsed_data": jd.parsed_data, "status": jd.status}


@app.get("/api/jd/list/all", tags=["Job Description"])
async def list_jds(
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """List all JDs for this recruiter."""
    jds = db.query(JobDescription).filter(JobDescription.recruiter_id == user.id).all()
    return [{"id": j.id, "title": j.title, "status": j.status, "created_at": str(j.created_at)} for j in jds]


# ═══════════════════════════════════════════════════════════════
# ASSESSMENT GENERATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/assessment/generate", tags=["Assessment"])
async def generate_assessment(
    req: AssessmentCreateRequest,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Generate a complete assessment from a JD (recruiter only)."""
    jd = db.query(JobDescription).filter(JobDescription.id == req.jd_id).first()
    if not jd:
        raise HTTPException(404, "JD not found")

    from core.jd_parser import ParsedJD
    parsed_jd = ParsedJD(**jd.parsed_data)

    # Generate assessment using AI
    assessment = await question_generator.generate_full_assessment(
        parsed_jd=parsed_jd,
        mcq_count=req.mcq_count,
        subjective_count=req.subjective_count,
        coding_count=req.coding_count,
        duration_minutes=req.duration_minutes,
        custom_difficulty=req.custom_difficulty,
    )

    # Save to DB
    record = AssessmentRecord(
        id=assessment.id,
        jd_id=req.jd_id,
        title=f"Assessment - {jd.title}",
        questions_data=assessment.model_dump(),
        duration_minutes=assessment.total_duration_minutes,
        cutoff_percentage=req.cutoff_percentage,
        total_points=assessment.total_points,
        status="active",
    )
    db.add(record)
    db.commit()

    return {
        "id": assessment.id,
        "title": record.title,
        "duration_minutes": assessment.total_duration_minutes,
        "total_points": assessment.total_points,
        "mcq_count": len(assessment.mcq_questions),
        "subjective_count": len(assessment.subjective_questions),
        "coding_count": len(assessment.coding_questions),
        "skill_coverage": assessment.skill_coverage,
        "difficulty_distribution": assessment.difficulty_distribution,
        "message": "Assessment generated successfully!",
    }


@app.get("/api/assessment/{assessment_id}", tags=["Assessment"])
async def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    """Get assessment details (questions for candidates, full data for recruiters)."""
    record = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment_id).first()
    if not record:
        raise HTTPException(404, "Assessment not found")
    return record.questions_data


@app.get("/api/assessment/{assessment_id}/questions", tags=["Assessment"])
async def get_candidate_questions(assessment_id: str, db: Session = Depends(get_db)):
    """Get questions for a candidate (without answers/correct options hidden)."""
    record = db.query(AssessmentRecord).filter(AssessmentRecord.id == assessment_id).first()
    if not record:
        raise HTTPException(404, "Assessment not found")

    data = record.questions_data

    # Strip answers from MCQs
    safe_mcqs = []
    for q in data.get("mcq_questions", []):
        safe_q = {**q}
        safe_q.pop("correct_answer", None)
        safe_q.pop("explanation", None)
        for opt in safe_q.get("options", []):
            opt.pop("is_correct", None)
        safe_mcqs.append(safe_q)

    # Strip expected answers from subjective
    safe_subj = []
    for q in data.get("subjective_questions", []):
        safe_q = {**q}
        safe_q.pop("expected_answer_points", None)
        safe_q.pop("rubric", None)
        safe_subj.append(safe_q)

    # Strip hidden test cases from coding
    safe_coding = []
    for q in data.get("coding_questions", []):
        safe_q = {**q}
        safe_q["test_cases"] = [tc for tc in q.get("test_cases", []) if not tc.get("is_hidden")]
        safe_q.pop("evaluation_criteria", None)
        safe_coding.append(safe_q)

    return {
        "id": data.get("id"),
        "job_title": data.get("job_title"),
        "total_duration_minutes": data.get("total_duration_minutes"),
        "mcq_questions": safe_mcqs,
        "subjective_questions": safe_subj,
        "coding_questions": safe_coding,
    }


# ═══════════════════════════════════════════════════════════════
# CANDIDATE ASSESSMENT FLOW
# ═══════════════════════════════════════════════════════════════

@app.post("/api/candidate/start", tags=["Candidate"])
async def start_assessment(
    req: StartAssessmentRequest,
    db: Session = Depends(get_db),
):
    """Start an assessment session for a candidate."""
    assessment = db.query(AssessmentRecord).filter(AssessmentRecord.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(404, "Assessment not found")
    if assessment.status != "active":
        raise HTTPException(400, "Assessment is not active")

    # Check for existing submission
    existing = db.query(CandidateSubmission).filter(
        CandidateSubmission.candidate_id == req.candidate_id,
        CandidateSubmission.assessment_id == req.assessment_id,
    ).first()
    if existing and existing.status == "submitted":
        raise HTTPException(400, "Already submitted this assessment")

    submission = CandidateSubmission(
        id=str(uuid.uuid4()),
        candidate_id=req.candidate_id,
        assessment_id=req.assessment_id,
        status="in_progress",
    )
    db.add(submission)
    db.commit()

    return {
        "submission_id": submission.id,
        "assessment_id": req.assessment_id,
        "duration_minutes": assessment.duration_minutes,
        "started_at": str(submission.started_at),
    }


@app.post("/api/candidate/submit", tags=["Candidate"])
async def submit_answers(
    req: SubmitAnswersRequest,
    db: Session = Depends(get_db),
):
    """Submit answers for evaluation."""
    submission = db.query(CandidateSubmission).filter(
        CandidateSubmission.id == req.submission_id
    ).first()
    if not submission:
        raise HTTPException(404, "Submission not found")
    if submission.status == "submitted":
        raise HTTPException(400, "Already submitted")

    submission.responses = {
        "mcq_answers": req.mcq_answers,
        "subjective_answers": req.subjective_answers,
        "coding_answers": req.coding_answers,
    }
    submission.response_timings = req.response_timings
    submission.status = "submitted"
    submission.submitted_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Answers submitted successfully", "submission_id": submission.id}


@app.post("/api/candidate/evaluate/{submission_id}", tags=["Evaluation"])
async def evaluate_submission(
    submission_id: str,
    db: Session = Depends(get_db),
):
    """Evaluate a candidate's submission (can be triggered by recruiter or auto)."""
    submission = db.query(CandidateSubmission).filter(
        CandidateSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(404, "Submission not found")
    if submission.status not in ("submitted", "evaluated"):
        raise HTTPException(400, f"Cannot evaluate submission in status: {submission.status}")

    # Load assessment
    assessment_record = db.query(AssessmentRecord).filter(
        AssessmentRecord.id == submission.assessment_id
    ).first()
    from core.question_generator import Assessment
    assessment = Assessment(**assessment_record.questions_data)

    # Calculate time taken
    time_taken = 0
    if submission.started_at and submission.submitted_at:
        time_taken = int((submission.submitted_at - submission.started_at).total_seconds())

    # Run AI evaluation
    evaluation = await evaluator.evaluate_candidate(
        candidate_id=submission.candidate_id,
        assessment=assessment,
        responses=submission.responses or {},
        time_taken_seconds=time_taken,
    )

    # Run anti-cheat checks
    resume_record = db.query(CandidateResume).filter(
        CandidateResume.candidate_id == submission.candidate_id
    ).first()
    resume_text = resume_record.raw_text if resume_record else None

    integrity = await anti_cheat.full_integrity_check(
        candidate_id=submission.candidate_id,
        assessment_id=submission.assessment_id,
        evaluation=evaluation,
        resume_text=resume_text,
        response_timings=submission.response_timings,
    )

    # Save results
    submission.evaluation_data = evaluation.model_dump()
    submission.anti_cheat_data = integrity.model_dump()
    submission.total_score = evaluation.total_score
    submission.percentage = evaluation.percentage
    submission.status = "evaluated"
    submission.evaluated_at = datetime.now(timezone.utc)
    db.commit()

    return EvaluationResponse(
        candidate_id=submission.candidate_id,
        assessment_id=submission.assessment_id,
        total_score=evaluation.total_score,
        max_total_score=evaluation.max_total_score,
        percentage=evaluation.percentage,
        section_scores=evaluation.section_scores,
        skill_scores=evaluation.skill_scores,
        strengths=evaluation.strengths,
        weaknesses=evaluation.weaknesses,
        overall_feedback=evaluation.overall_feedback,
        integrity_score=integrity.overall_integrity_score,
        integrity_flags=[f.description for f in integrity.flags],
    )


@app.get("/api/candidate/result/{submission_id}", tags=["Evaluation"])
async def get_result(submission_id: str, db: Session = Depends(get_db)):
    """Get detailed evaluation results for a submission."""
    submission = db.query(CandidateSubmission).filter(
        CandidateSubmission.id == submission_id
    ).first()
    if not submission:
        raise HTTPException(404, "Submission not found")
    if submission.status != "evaluated":
        raise HTTPException(400, "Submission not yet evaluated")

    return {
        "evaluation": submission.evaluation_data,
        "integrity": submission.anti_cheat_data,
        "submitted_at": str(submission.submitted_at),
        "evaluated_at": str(submission.evaluated_at),
    }


# ═══════════════════════════════════════════════════════════════
# RESUME ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/resume/upload", tags=["Resume"])
async def upload_resume(
    candidate_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload and parse a candidate's resume."""
    content = await file.read()
    filename = file.filename or "resume"

    if filename.lower().endswith(".pdf"):
        parsed = await resume_parser.parse_pdf(content)
    elif filename.lower().endswith(".docx"):
        parsed = await resume_parser.parse_docx(content)
    else:
        # Assume plain text
        parsed = await resume_parser.parse_text(content.decode("utf-8", errors="ignore"))

    # Save to DB
    record = CandidateResume(
        id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        raw_text=parsed.raw_text,
        parsed_data=parsed.model_dump(),
        file_name=filename,
    )
    db.add(record)
    db.commit()

    return ResumeUploadResponse(
        candidate_id=candidate_id,
        parsed_skills=parsed.skills,
        total_experience_years=parsed.total_experience_years,
        summary=parsed.summary,
    )


@app.post("/api/resume/match/{candidate_id}/{jd_id}", tags=["Resume"])
async def match_resume_to_jd(
    candidate_id: str,
    jd_id: str,
    db: Session = Depends(get_db),
):
    """Compare a candidate's resume with a JD."""
    resume = db.query(CandidateResume).filter(
        CandidateResume.candidate_id == candidate_id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found")

    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(404, "JD not found")

    from core.resume_parser import ParsedResume
    parsed_resume = ParsedResume(**resume.parsed_data)
    jd_skills = jd.parsed_data.get("skills", [])

    match_result = await resume_parser.match_with_jd(parsed_resume, jd_skills)

    return ResumeMatchResponse(
        match_percentage=match_result.get("match_percentage", 0),
        matched_skills=match_result.get("matched_skills", []),
        missing_skills=match_result.get("missing_skills", []),
        overall_fit=match_result.get("overall_fit", "unknown"),
        recommendation=match_result.get("recommendation", ""),
    )


# ═══════════════════════════════════════════════════════════════
# LEADERBOARD & ANALYTICS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/leaderboard/generate", tags=["Analytics"])
async def generate_leaderboard(
    req: LeaderboardRequest,
    db: Session = Depends(get_db),
):
    """Generate leaderboard for an assessment."""
    submissions = db.query(CandidateSubmission).filter(
        CandidateSubmission.assessment_id == req.assessment_id,
        CandidateSubmission.status == "evaluated",
    ).all()

    if not submissions:
        raise HTTPException(404, "No evaluated submissions found")

    from core.evaluator import CandidateEvaluation
    from core.anti_cheat import AntiCheatReport

    evaluations = []
    anti_cheat_reports = {}
    for sub in submissions:
        if sub.evaluation_data:
            evaluations.append(CandidateEvaluation(**sub.evaluation_data))
        if sub.anti_cheat_data:
            anti_cheat_reports[sub.candidate_id] = AntiCheatReport(**sub.anti_cheat_data)

    assessment = db.query(AssessmentRecord).filter(
        AssessmentRecord.id == req.assessment_id
    ).first()

    leaderboard = analytics.generate_leaderboard(
        assessment_id=req.assessment_id,
        job_title=assessment.title if assessment else "Unknown",
        evaluations=evaluations,
        anti_cheat_reports=anti_cheat_reports,
        cutoff_percentage=req.cutoff_percentage,
    )

    return leaderboard.model_dump()


@app.get("/api/analytics/report/{assessment_id}", tags=["Analytics"])
async def get_recruiter_report(
    assessment_id: str,
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Generate a comprehensive recruiter report."""
    assessment = db.query(AssessmentRecord).filter(
        AssessmentRecord.id == assessment_id
    ).first()
    if not assessment:
        raise HTTPException(404, "Assessment not found")

    submissions = db.query(CandidateSubmission).filter(
        CandidateSubmission.assessment_id == assessment_id,
        CandidateSubmission.status == "evaluated",
    ).all()

    from core.evaluator import CandidateEvaluation
    from core.anti_cheat import AntiCheatReport

    evaluations = [CandidateEvaluation(**s.evaluation_data) for s in submissions if s.evaluation_data]
    acr = {s.candidate_id: AntiCheatReport(**s.anti_cheat_data) for s in submissions if s.anti_cheat_data}

    total_registered = db.query(CandidateSubmission).filter(
        CandidateSubmission.assessment_id == assessment_id
    ).count()

    report = analytics.generate_recruiter_report(
        assessment_id=assessment_id,
        job_title=assessment.title,
        evaluations=evaluations,
        anti_cheat_reports=acr,
        total_registered=total_registered,
        cutoff_percentage=assessment.cutoff_percentage or 50.0,
    )

    return report.model_dump()


@app.get("/api/analytics/skill-gap/{submission_id}", tags=["Analytics"])
async def get_skill_gap(submission_id: str, db: Session = Depends(get_db)):
    """Get skill gap analysis for a candidate."""
    submission = db.query(CandidateSubmission).filter(
        CandidateSubmission.id == submission_id
    ).first()
    if not submission or not submission.evaluation_data:
        raise HTTPException(404, "Evaluation not found")

    assessment = db.query(AssessmentRecord).filter(
        AssessmentRecord.id == submission.assessment_id
    ).first()

    from core.evaluator import CandidateEvaluation
    evaluation = CandidateEvaluation(**submission.evaluation_data)

    # Get required skill levels from JD
    jd = db.query(JobDescription).filter(
        JobDescription.id == assessment.jd_id
    ).first()
    required_skills = {}
    if jd and jd.parsed_data:
        for skill in jd.parsed_data.get("skills", []):
            level_map = {"beginner": 40, "intermediate": 60, "advanced": 75, "expert": 90}
            required_skills[skill["name"]] = level_map.get(skill.get("proficiency_level", "intermediate"), 60)

    report = analytics.generate_skill_gap_report(evaluation, required_skills)
    return report.model_dump()


# ═══════════════════════════════════════════════════════════════
# RECRUITER DASHBOARD
# ═══════════════════════════════════════════════════════════════

@app.get("/api/dashboard", tags=["Dashboard"])
async def recruiter_dashboard(
    user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    """Get recruiter dashboard overview."""
    jd_count = db.query(JobDescription).filter(JobDescription.recruiter_id == user.id).count()
    jd_ids = [j.id for j in db.query(JobDescription).filter(JobDescription.recruiter_id == user.id).all()]

    assessments = db.query(AssessmentRecord).filter(AssessmentRecord.jd_id.in_(jd_ids)).all() if jd_ids else []
    assessment_ids = [a.id for a in assessments]

    total_candidates = db.query(CandidateSubmission).filter(
        CandidateSubmission.assessment_id.in_(assessment_ids)
    ).count() if assessment_ids else 0

    active = [
        {
            "id": a.id,
            "title": a.title,
            "candidates": db.query(CandidateSubmission).filter(
                CandidateSubmission.assessment_id == a.id
            ).count(),
            "evaluated": db.query(CandidateSubmission).filter(
                CandidateSubmission.assessment_id == a.id,
                CandidateSubmission.status == "evaluated",
            ).count(),
        }
        for a in assessments if a.status == "active"
    ]

    return {
        "total_jds": jd_count,
        "total_assessments": len(assessments),
        "total_candidates": total_candidates,
        "active_assessments": active,
    }


# ═══════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════

@app.get("/health", tags=["System"])
async def health_check():
    llm_ok = await llm_client.check_health()
    return {
        "status": "healthy",
        "llm_available": llm_ok,
        "llm_model": settings.OLLAMA_MODEL,
    }


# ─── Init files ────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
