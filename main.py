import logging
from fastapi import FastAPI, HTTPException
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse

from fastapi.middleware.cors import CORSMiddleware
from schemas import EvaluationRequest, EvaluationResponse, JdParseRequest, AssessmentGenerateRequest
from core.evaluator import evaluator
from core.jd_parser import jd_parser
from core.question_generator import question_generator

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-engine")


app = FastAPI(
    title="AI Hiring Intelligence Engine",
    description="Automatically parses job descriptions, generates role-specific assessments, and evaluates candidates using AI.",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. JD Parsing ---
@app.post("/api/jd/parse")
async def parse_jd_endpoint(request: JdParseRequest):
    try:
        return await jd_parser.parse(request.raw_text)
    except Exception as e:
        logger.error(f"JD Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. Assessment Generation ---
@app.post("/api/assessment/generate")
async def generate_assessment_endpoint(request: AssessmentGenerateRequest):
    try:
        # Re-parse on fly since we are stateless
        parsed_jd = await jd_parser.parse(request.jd_text)
        return await question_generator.generate_full_assessment(
            parsed_jd=parsed_jd,
            mcq_count=request.mcq_count,
            subjective_count=request.subjective_count,
            coding_count=request.coding_count
        )
    except Exception as e:
        logger.error(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. Evaluation (The Key Refactor) ---
@app.post("/api/candidate/evaluate", response_model=EvaluationResponse)
async def evaluate_submission_endpoint(request: EvaluationRequest):
    """
    Stateless endpoint: Spring Boot sends Questions + Answers.
    Python returns the calculated Score.
    """
    try:
        logger.info(f"Received evaluation request for candidate: {request.candidate_id}")
        return await evaluator.evaluate(request)
    except Exception as e:
        logger.error(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "active", "mode": "stateless"}


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
