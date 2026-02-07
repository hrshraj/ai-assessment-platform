"""
Resume Parser & Analyzer
==========================
Extracts structured data from resumes (PDF, DOCX, text):
- Skills with proficiency estimation
- Experience details
- Education
- Projects & certifications
- Semantic skill matching against JD requirements
"""
import logging
import io
import re
from typing import Optional
from pydantic import BaseModel

from core.llm_client import llm_client

logger = logging.getLogger(__name__)


class ParsedResume(BaseModel):
    candidate_name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[dict]  # [{"name": "Python", "proficiency": "advanced", "years": 3}]
    experience: list[dict]  # [{"title": "SDE", "company": "Google", "years": 2, "description": "..."}]
    total_experience_years: float = 0.0
    education: list[dict]  # [{"degree": "B.Tech", "institution": "IIT", "year": 2020}]
    projects: list[dict]  # [{"name": "...", "description": "...", "tech_stack": [...]}]
    certifications: list[str]
    summary: str = ""
    raw_text: str = ""


RESUME_PARSE_SYSTEM = """You are an expert resume parser. Extract all structured information accurately.
Always respond in valid JSON. Do not invent or assume information not present in the resume."""

RESUME_PARSE_PROMPT = """Parse this resume and extract structured information.

RESUME TEXT:
---
{resume_text}
---

Return JSON:
{{
    "candidate_name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "skills": [
        {{"name": "Python", "proficiency": "beginner|intermediate|advanced|expert", "years": 2}},
    ],
    "experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "years": 2.0,
            "description": "Brief role description",
            "start_date": "Jan 2022",
            "end_date": "Present"
        }}
    ],
    "total_experience_years": 5.0,
    "education": [
        {{"degree": "B.Tech CS", "institution": "University Name", "year": 2020, "gpa": "8.5"}}
    ],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Brief description",
            "tech_stack": ["Python", "Flask", "PostgreSQL"]
        }}
    ],
    "certifications": ["AWS Certified Solutions Architect"],
    "summary": "2-3 sentence professional summary"
}}

RULES:
1. Extract ONLY information explicitly stated in the resume
2. Estimate skill proficiency from context (years used, project complexity)
3. If years not mentioned for a skill, estimate based on experience timeline
4. Normalize skill names (e.g., "JS" -> "JavaScript", "ML" -> "Machine Learning")
"""


SKILL_MATCH_PROMPT = """Compare a candidate's resume skills with job requirements.

JOB REQUIRED SKILLS:
{jd_skills}

CANDIDATE'S SKILLS (from resume):
{resume_skills}

CANDIDATE'S PROJECTS:
{projects}

Return JSON:
{{
    "match_percentage": <float 0-100>,
    "matched_skills": [
        {{
            "jd_skill": "React",
            "resume_skill": "ReactJS",
            "match_type": "exact|partial|inferred",
            "confidence": 0.95
        }}
    ],
    "missing_skills": [
        {{
            "skill": "Docker",
            "importance": "must_have|nice_to_have",
            "available_alternative": "Kubernetes (partial)"
        }}
    ],
    "extra_skills": ["Additional valuable skill 1"],
    "overall_fit": "strong|moderate|weak|poor",
    "recommendation": "Brief hiring recommendation"
}}
"""


class ResumeParser:
    """Parse and analyze candidate resumes."""

    def __init__(self):
        self.llm = llm_client

    async def parse_text(self, resume_text: str) -> ParsedResume:
        """Parse a resume from plain text."""
        result = await self.llm.generate_json(
            prompt=RESUME_PARSE_PROMPT.format(resume_text=resume_text),
            system_prompt=RESUME_PARSE_SYSTEM,
            temperature=0.1,
        )

        result["raw_text"] = resume_text
        try:
            return ParsedResume(**result)
        except Exception as e:
            logger.warning(f"Resume parse validation error: {e}")
            result.setdefault("skills", [])
            result.setdefault("experience", [])
            result.setdefault("education", [])
            result.setdefault("projects", [])
            result.setdefault("certifications", [])
            return ParsedResume(**result)

    async def parse_pdf(self, pdf_bytes: bytes) -> ParsedResume:
        """Parse a resume from PDF bytes."""
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                text = "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                )
        except ImportError:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text = "\n".join(
                page.extract_text() or "" for page in reader.pages
            )

        if not text.strip():
            raise ValueError("Could not extract text from PDF. It may be image-based.")
        return await self.parse_text(text)

    async def parse_docx(self, docx_bytes: bytes) -> ParsedResume:
        """Parse a resume from DOCX bytes."""
        from docx import Document
        doc = Document(io.BytesIO(docx_bytes))
        text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        if not text.strip():
            raise ValueError("Could not extract text from DOCX.")
        return await self.parse_text(text)

    async def match_with_jd(
        self, parsed_resume: ParsedResume, jd_skills: list[dict]
    ) -> dict:
        """Compare resume skills with JD requirements."""
        result = await self.llm.generate_json(
            prompt=SKILL_MATCH_PROMPT.format(
                jd_skills=str(jd_skills),
                resume_skills=str(parsed_resume.skills),
                projects=str(parsed_resume.projects),
            ),
            system_prompt="Compare skills objectively. Respond in JSON.",
            temperature=0.2,
        )
        return result


# Singleton
resume_parser = ResumeParser()
