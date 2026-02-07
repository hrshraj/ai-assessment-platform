"""
AI Hiring Intelligence Engine - Stateless API
==============================================
Endpoints:
  1. POST /api/jd/parse              - Parse job description
  2. POST /api/assessment/generate    - Generate assessment questions
  3. POST /api/candidate/evaluate     - Evaluate answers (+ anti-cheat)
  4. POST /api/resume/parse           - Parse resume text
  5. POST /api/resume/match           - Match resume against JD skills
  6. POST /api/anticheat/check        - Standalone anti-cheat check
  7. POST /api/anticheat/fingerprint  - Code fingerprint for plagiarism
  8. POST /api/analytics/skill-gap    - Skill gap analysis
  9. GET  /health                     - Health check
"""
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    JdParseRequest, AssessmentGenerateRequest,
    EvaluationRequest, EvaluationResponse,
    ResumeParseRequest, ResumeMatchRequest,
    SkillGapRequest, AntiCheatRequest,
)
from core.evaluator import evaluator
from core.jd_parser import jd_parser
from core.question_generator import question_generator
from core.resume_parser import resume_parser
from core.anti_cheat import anti_cheat
from core.analytics import analytics

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-engine")


app = FastAPI(
    title="AI Hiring Intelligence Engine",
    description="Parses JDs, generates assessments, evaluates candidates, detects fraud, and analyzes skill gaps.",
    version="2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 1. JD Parsing ───────────────────────────────────────────

@app.post("/api/jd/parse")
async def parse_jd(request: JdParseRequest):
    """Parse a job description and extract skills, experience level, etc."""
    try:
        logger.info("Parsing job description...")
        result = await jd_parser.parse(request.raw_text)
        logger.info(f"JD parsed: {result.job_title} | {len(result.skills)} skills")
        return result
    except Exception as e:
        logger.error(f"JD Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. Assessment Generation ────────────────────────────────

@app.post("/api/assessment/generate")
async def generate_assessment(request: AssessmentGenerateRequest):
    """Generate MCQ, subjective, and coding questions from JD text."""
    try:
        logger.info("Generating assessment...")
        parsed_jd = await jd_parser.parse(request.jd_text)
        assessment = await question_generator.generate_full_assessment(
            parsed_jd=parsed_jd,
            mcq_count=request.mcq_count,
            subjective_count=request.subjective_count,
            coding_count=request.coding_count,
        )
        logger.info(f"Assessment generated: {assessment.total_points} points")
        return assessment
    except Exception as e:
        logger.error(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 3. Candidate Evaluation (with integrated anti-cheat) ────

@app.post("/api/candidate/evaluate", response_model=EvaluationResponse)
async def evaluate_candidate(request: EvaluationRequest):
    """
    Evaluate candidate answers. Optionally include resume_text and
    response_timings for automatic anti-cheat analysis.
    """
    try:
        logger.info(f"Evaluating candidate: {request.candidate_id}")
        result = await evaluator.evaluate(request)
        logger.info(f"Evaluation complete: {result.percentage}% | integrity: {result.integrity_score}")
        return result
    except Exception as e:
        logger.error(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 4. Resume Parsing ───────────────────────────────────────

@app.post("/api/resume/parse")
async def parse_resume(request: ResumeParseRequest):
    """Parse resume text and extract skills, experience, education, etc."""
    try:
        logger.info("Parsing resume...")
        result = await resume_parser.parse_text(request.resume_text)
        logger.info(f"Resume parsed: {result.candidate_name} | {len(result.skills)} skills")
        return result
    except Exception as e:
        logger.error(f"Resume Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 5. Resume-JD Matching ───────────────────────────────────

@app.post("/api/resume/match")
async def match_resume_jd(request: ResumeMatchRequest):
    """Compare resume skills against JD requirements and return fit score."""
    try:
        logger.info("Matching resume against JD skills...")
        parsed_resume = await resume_parser.parse_text(request.resume_text)
        result = await resume_parser.match_with_jd(parsed_resume, request.jd_skills)
        logger.info(f"Resume match: {result.get('match_percentage', '?')}% | "
                     f"Fit: {result.get('overall_fit', '?')}")
        return result
    except Exception as e:
        logger.error(f"Resume Match Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 6. Anti-Cheat (Standalone) ──────────────────────────────

@app.post("/api/anticheat/check")
async def check_integrity(request: AntiCheatRequest):
    """Run standalone anti-cheat checks on a candidate's evaluation."""
    try:
        logger.info(f"Running anti-cheat for candidate: {request.candidate_id}")
        report = await anti_cheat.full_integrity_check(
            candidate_id=request.candidate_id,
            assessment_id=request.assessment_id,
            evaluation_data=request.evaluation,
            resume_text=request.resume_text,
            response_timings=request.response_timings,
            all_candidate_codes=request.all_candidate_codes,
        )
        logger.info(f"Anti-cheat complete: integrity={report.overall_integrity_score}")
        return report
    except Exception as e:
        logger.error(f"Anti-Cheat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/anticheat/fingerprint")
async def generate_code_fingerprint(request: dict):
    """Generate a MinHash fingerprint for code plagiarism detection.
    Send: {"code": "def solution()..."}
    Returns: {"fingerprint": [int, int, ...]}
    """
    try:
        code = request.get("code", "")
        if not code.strip():
            raise HTTPException(status_code=400, detail="Empty code")
        fingerprint = anti_cheat.generate_fingerprint(code)
        return {"fingerprint": fingerprint}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fingerprint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 7. Skill Gap Analysis ───────────────────────────────────

@app.post("/api/analytics/skill-gap")
async def skill_gap_analysis(request: SkillGapRequest):
    """Generate skill gap report comparing candidate performance vs requirements."""
    try:
        logger.info(f"Generating skill gap report for: {request.candidate_id}")
        report = analytics.generate_skill_gap_report(
            candidate_id=request.candidate_id,
            evaluation_data=request.evaluation,
            required_skills=request.required_skills,
            all_evaluations_data=request.all_evaluations,
        )
        logger.info(f"Skill gap: {len(report.strengths)} strengths, "
                     f"{len(report.improvement_areas)} areas to improve")
        return report
    except Exception as e:
        logger.error(f"Skill Gap Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Health & Root ────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "active", "mode": "stateless"}


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
