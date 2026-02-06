"""
JD Parser & Skill Extractor
============================
Parses job descriptions using LLM to extract:
- Required technical skills (with priority weights)
- Soft skills
- Experience level (fresher/mid/senior)
- Role responsibilities
- Tools & technologies
- Domain knowledge
- Assessment criteria mapping
"""
import logging
from typing import Optional
from pydantic import BaseModel, Field

from core.llm_client import llm_client

logger = logging.getLogger(__name__)


# ─── Data Models ───────────────────────────────────────────────

class SkillRequirement(BaseModel):
    name: str
    category: str  # "technical", "soft", "tool", "domain"
    priority: str  # "must_have", "nice_to_have", "bonus"
    weight: float = Field(ge=0, le=1.0, description="Importance weight 0-1")
    proficiency_level: str  # "beginner", "intermediate", "advanced", "expert"


class ParsedJD(BaseModel):
    job_title: str
    experience_level: str  # "fresher", "junior", "mid", "senior", "lead"
    experience_years_min: int = 0
    experience_years_max: int = 0
    skills: list[SkillRequirement]
    responsibilities: list[str]
    tools_technologies: list[str]
    domain: str  # e.g., "web_development", "data_science", "devops"
    assessment_config: dict  # recommended assessment configuration
    difficulty_level: str  # "easy", "medium", "hard", "expert"
    summary: str


# ─── Prompts ───────────────────────────────────────────────────

JD_PARSE_SYSTEM_PROMPT = """You are an expert HR technology AI that analyzes job descriptions with extreme precision. 
You extract structured information that will be used to generate technical assessments.
Always respond in valid JSON format. Be thorough and accurate."""

JD_PARSE_PROMPT = """Analyze the following Job Description and extract structured information.

JOB DESCRIPTION:
---
{jd_text}
---

Return a JSON object with EXACTLY this structure:
{{
    "job_title": "exact job title",
    "experience_level": "fresher|junior|mid|senior|lead",
    "experience_years_min": 0,
    "experience_years_max": 3,
    "skills": [
        {{
            "name": "skill name (e.g., Python, React, SQL)",
            "category": "technical|soft|tool|domain",
            "priority": "must_have|nice_to_have|bonus",
            "weight": 0.9,
            "proficiency_level": "beginner|intermediate|advanced|expert"
        }}
    ],
    "responsibilities": ["responsibility 1", "responsibility 2"],
    "tools_technologies": ["Docker", "AWS", "Git"],
    "domain": "web_development|data_science|devops|mobile|ml_ai|backend|frontend|fullstack|cloud|security|database|other",
    "assessment_config": {{
        "recommended_duration_minutes": 90,
        "mcq_count": 10,
        "subjective_count": 5,
        "coding_count": 3,
        "difficulty_distribution": {{
            "easy": 0.3,
            "medium": 0.5,
            "hard": 0.2
        }},
        "skill_coverage": {{
            "skill_name": 0.3
        }}
    }},
    "difficulty_level": "easy|medium|hard|expert",
    "summary": "2-3 sentence summary of what the role requires"
}}

RULES:
1. Extract ALL skills mentioned, including implicit ones (e.g., if "REST APIs" is mentioned, include HTTP, API Design)
2. Weight must_have skills higher (0.7-1.0), nice_to_have (0.3-0.6), bonus (0.1-0.3)
3. Infer experience_level from years/seniority mentioned
4. The assessment_config.skill_coverage should map each must_have skill to a percentage (must sum to 1.0)
5. Be precise with proficiency levels based on the JD context
"""


# ─── Parser Class ──────────────────────────────────────────────

class JDParser:
    """Parse and analyze job descriptions using AI."""

    def __init__(self):
        self.llm = llm_client

    async def parse(self, jd_text: str) -> ParsedJD:
        """Parse a job description and return structured data."""
        logger.info("Parsing job description...")

        prompt = JD_PARSE_PROMPT.format(jd_text=jd_text)
        result = await self.llm.generate_json(
            prompt=prompt,
            system_prompt=JD_PARSE_SYSTEM_PROMPT,
            temperature=0.2,
        )

        if "error" in result:
            logger.error(f"JD parsing failed: {result}")
            raise ValueError(f"Failed to parse JD: {result.get('error')}")

        # Validate and construct ParsedJD
        try:
            parsed = ParsedJD(**result)
            logger.info(
                f"Parsed JD: {parsed.job_title} | {len(parsed.skills)} skills | "
                f"Level: {parsed.experience_level}"
            )
            return parsed
        except Exception as e:
            logger.error(f"Validation error: {e}")
            # Attempt recovery with defaults
            result.setdefault("job_title", "Unknown Role")
            result.setdefault("experience_level", "mid")
            result.setdefault("skills", [])
            result.setdefault("responsibilities", [])
            result.setdefault("tools_technologies", [])
            result.setdefault("domain", "other")
            result.setdefault("difficulty_level", "medium")
            result.setdefault("summary", "")
            result.setdefault("assessment_config", {
                "recommended_duration_minutes": 90,
                "mcq_count": 10,
                "subjective_count": 5,
                "coding_count": 3,
                "difficulty_distribution": {"easy": 0.3, "medium": 0.5, "hard": 0.2},
                "skill_coverage": {},
            })
            return ParsedJD(**result)

    async def extract_skills_only(self, jd_text: str) -> list[SkillRequirement]:
        """Quick extraction of just skills from a JD."""
        parsed = await self.parse(jd_text)
        return parsed.skills

    async def get_assessment_config(self, jd_text: str) -> dict:
        """Get recommended assessment configuration for a JD."""
        parsed = await self.parse(jd_text)
        config = parsed.assessment_config
        config["job_title"] = parsed.job_title
        config["experience_level"] = parsed.experience_level
        config["difficulty_level"] = parsed.difficulty_level
        config["domain"] = parsed.domain
        return config

    def compute_skill_weights(self, skills: list[SkillRequirement]) -> dict[str, float]:
        """Normalize skill weights so they sum to 1.0."""
        total = sum(s.weight for s in skills)
        if total == 0:
            return {s.name: 1.0 / len(skills) for s in skills}
        return {s.name: s.weight / total for s in skills}


# Singleton
jd_parser = JDParser()
