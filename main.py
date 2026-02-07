# FILE: main.py

import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from api.schemas import (
    EvaluationRequest, EvaluationResponse, 
    ResumeParseRequest, 
    AssessmentGenerateRequest 
)
from core.jd_parser import ParsedJD
# Import your existing engines
from core.evaluator import evaluator
from core.jd_parser import jd_parser
from core.question_generator import question_generator
from core.resume_parser import resume_parser  # Make sure this import works
from core.anti_cheat import anti_cheat        # Make sure this import works
from pydantic import BaseModel

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-engine")

app = FastAPI(title="Stateless AI Engine", version="2.1")

# ... (CORS Middleware remains the same) ...

class FingerprintRequest(BaseModel):
    code: str

@app.post("/api/anti-cheat/fingerprint")
async def generate_fingerprint_endpoint(request: FingerprintRequest):
    signature = anti_cheat.generate_fingerprint(request.code)
    return {"fingerprint": signature}
# --- 1. JD Parsing (Keep existing) ---
@app.post("/api/jd/parse")
async def parse_jd_endpoint(request: dict): # Simplified for brevity
    # ... existing code ...
    pass

# --- NEW: Question Generation Endpoint ---

@app.post("/api/assessment/generate")
async def generate_assessment_endpoint(request: AssessmentGenerateRequest):
    try:
        logger.info(f"Generating assessment for JD text length: {len(request.job_description_text)}")
        
        # 1. Parse JD on the fly (since we are stateless here relative to the DB)
        # We need a 'ParsedJD' object. Let's assume jd_parser can parsing raw text.
        # If jd_parser.parse() expects a full dict structure, we might need to mock it or update usage.
        # Let's check jd_parser usage.
        
        # Assuming jd_parser.parse_text(text) returns a ParsedJD object
        # If not, we might need to adjust.
        # For now, let's look at how jd_parser is used in other places or check its definition if needed.
        # But wait, looking at imports: 'from core.jd_parser import jd_parser'
        
        parsed_jd = await jd_parser.parse(request.job_description_text)
        
        # 2. Generate Assessment
        assessment = await question_generator.generate_full_assessment(
            parsed_jd=parsed_jd,
            mcq_count=request.mcq_count,
            subjective_count=request.subjective_count,
            coding_count=request.coding_count
        )
        
        # 3. Map to Response Format expected by Spring Boot
        # Spring Boot expects AiAssessmentResponse with lists of questions.
        # The 'Assessment' object from question_generator has lists of MCQQuestion, etc.
        
        return {
             "mcq_questions": [q.dict() for q in assessment.mcq_questions],
             "subjective_questions": [q.dict() for q in assessment.subjective_questions],
             "coding_questions": [q.dict() for q in assessment.coding_questions],
             "mcq_count": len(assessment.mcq_questions),
             "subjective_count": len(assessment.subjective_questions),
             "coding_count": len(assessment.coding_questions)
        }

    except Exception as e:
        logger.error(f"Assessment Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. NEW: Resume Parsing Endpoint ---
@app.post("/api/resume/parse")
async def parse_resume_endpoint(request: ResumeParseRequest):
    """
    Parses a resume text and optionally matches it against JD skills.
    """
    try:
        logger.info("Received resume parsing request")
        # 1. Parse the text
        parsed_data = await resume_parser.parse_text(request.resume_text)
        
        # 2. If JD skills are provided, calculate a match score immediately
        match_data = {}
        if request.job_description_skills:
            match_data = await resume_parser.match_with_jd(parsed_data, request.job_description_skills)
            
        return {
            "parsed_profile": parsed_data,
            "match_analysis": match_data
        }
    except Exception as e:
        logger.error(f"Resume Parse Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. UPDATED: Evaluation with Anti-Cheat ---
@app.post("/api/candidate/evaluate", response_model=EvaluationResponse)
async def evaluate_submission_endpoint(request: EvaluationRequest):
    try:
        logger.info(f"Evaluating candidate: {request.candidate_id}")
        
        # Step A: Grade the Questions (Standard Evaluator)
        eval_response = await evaluator.evaluate(request)
        
        # Step B: Run Anti-Cheat Checks (If data is provided)
        integrity_report = None
        if request.response_timings or request.resume_text:
            logger.info("Running Anti-Cheat Analysis...")
            # We construct a mock 'CandidateEvaluation' object for the anti-cheat engine
            # because the stateless evaluator returns a specific response format.
            # You might need to adapt 'evaluator.py' to return the object anti_cheat needs,
            # or map the data here. For now, we pass the raw data:
            
            integrity_report = await anti_cheat.full_integrity_check(
                candidate_id=request.candidate_id,
                assessment_id=request.assessment_id,
                evaluation=eval_response, # Ensure anti_cheat accepts EvaluationResponse
                resume_text=request.resume_text,
                response_timings=request.response_timings
            )
            
        # Step C: Merge Results
        if integrity_report:
            eval_response.integrity_score = integrity_report.overall_integrity_score
            eval_response.integrity_flags = [f.description for f in integrity_report.flags]
            
        return eval_response

    except Exception as e:
        logger.error(f"Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))