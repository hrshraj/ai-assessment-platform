"""
AI Question Generator
======================
Generates role-specific assessment questions based on parsed JD:
- MCQ (Multiple Choice Questions)
- Subjective (Short answer, scenario-based, case studies)
- Coding (Programming challenges, debugging, system design)

Questions are weighted by skill priority and adapted to experience level.
"""
import logging
import json
from typing import Optional
from pydantic import BaseModel, Field

from core.llm_client import llm_client
from core.jd_parser import ParsedJD, SkillRequirement

logger = logging.getLogger(__name__)


# ─── Question Models ───────────────────────────────────────────

class MCQOption(BaseModel):
    label: str  # "A", "B", "C", "D"
    text: str
    is_correct: bool = False


class MCQQuestion(BaseModel):
    id: str
    question: str
    options: list[MCQOption]
    correct_answer: str  # "A", "B", etc.
    skill: str
    difficulty: str  # "easy", "medium", "hard"
    explanation: str
    time_estimate_seconds: int = 60
    points: float = 1.0


class SubjectiveQuestion(BaseModel):
    id: str
    question: str
    question_type: str  # "short_answer", "scenario", "case_study"
    skill: str
    difficulty: str
    expected_answer_points: list[str]  # Key points expected in the answer
    rubric: dict  # Scoring rubric
    time_estimate_seconds: int = 300
    max_points: float = 10.0


class CodingQuestion(BaseModel):
    id: str
    title: str
    problem_statement: str
    question_type: str  # "implementation", "debugging", "system_design", "optimization"
    skill: str
    difficulty: str
    language_options: list[str]  # ["python", "java", "javascript"]
    starter_code: Optional[str] = ""
    test_cases: list[dict]  # [{"input": "...", "expected_output": "...", "is_hidden": false}]
    constraints: list[str]
    hints: list[str] = []
    time_estimate_seconds: int = 900
    max_points: float = 20.0
    evaluation_criteria: list[str]


class Assessment(BaseModel):
    id: str
    job_title: str
    total_duration_minutes: int
    mcq_questions: list[MCQQuestion]
    subjective_questions: list[SubjectiveQuestion]
    coding_questions: list[CodingQuestion]
    total_points: float
    skill_coverage: dict[str, float]
    difficulty_distribution: dict[str, int]
    metadata: dict = {}


# ─── Prompt Templates ─────────────────────────────────────────

MCQ_SYSTEM_PROMPT = """You are an expert technical interviewer and assessment designer.
Generate high-quality multiple-choice questions that truly test understanding, not just memorization.
Include tricky but fair distractors. Always respond in valid JSON."""

MCQ_GENERATION_PROMPT = """Generate {count} multiple-choice questions for the role of "{job_title}" ({experience_level} level).

SKILLS TO COVER (with weights):
{skills_json}

DIFFICULTY DISTRIBUTION: {difficulty_dist}
DOMAIN: {domain}

Return a JSON array of questions with EXACTLY this structure:
[
    {{
        "id": "mcq_1",
        "question": "Clear, specific question text",
        "options": [
            {{"label": "A", "text": "Option text", "is_correct": false}},
            {{"label": "B", "text": "Option text", "is_correct": true}},
            {{"label": "C", "text": "Option text", "is_correct": false}},
            {{"label": "D", "text": "Option text", "is_correct": false}}
        ],
        "correct_answer": "B",
        "skill": "Python",
        "difficulty": "medium",
        "explanation": "Detailed explanation of why B is correct",
        "time_estimate_seconds": 60,
        "points": 1.0
    }}
]

RULES:
1. Cover skills proportionally to their weights
2. Questions should test real-world understanding, not trivial facts
3. For {experience_level} level: {level_focus}
4. Each question must have exactly 4 options with exactly 1 correct answer
5. Distractors should be plausible but clearly wrong to someone who knows the material
6. Vary question formats: conceptual, code output prediction, best practice, debugging
"""

SUBJECTIVE_SYSTEM_PROMPT = """You are an expert technical interviewer designing scenario-based and analytical questions.
Questions should test deep understanding, problem-solving ability, and communication skills.
Always respond in valid JSON."""

SUBJECTIVE_GENERATION_PROMPT = """Generate {count} subjective questions for "{job_title}" ({experience_level} level).

SKILLS TO COVER: {skills_json}
DOMAIN: {domain}
DIFFICULTY: {difficulty_dist}

Return a JSON array with this structure:
[
    {{
        "id": "subj_1",
        "question": "Detailed scenario or question",
        "question_type": "short_answer|scenario|case_study",
        "skill": "Primary skill tested",
        "difficulty": "easy|medium|hard",
        "expected_answer_points": [
            "Key point 1 that should be in answer",
            "Key point 2",
            "Key point 3"
        ],
        "rubric": {{
            "completeness": {{"max": 3, "description": "Covers all key points"}},
            "accuracy": {{"max": 3, "description": "Technically correct"}},
            "clarity": {{"max": 2, "description": "Well-structured explanation"}},
            "depth": {{"max": 2, "description": "Goes beyond surface level"}}
        }},
        "time_estimate_seconds": 300,
        "max_points": 10.0
    }}
]

RULES:
1. Mix question types: at least 1 scenario-based, 1 short_answer, and 1 case_study (if count >= 3)
2. Scenarios should be realistic workplace situations
3. Case studies should present a problem requiring multi-step analysis
4. Rubric should be fair and evaluatable by AI
5. Expected answer points should be specific enough for automated scoring
"""

CODING_SYSTEM_PROMPT = """You are an expert at creating programming challenges for technical assessments.
Create problems that test real coding ability, algorithmic thinking, and software design skills.
Always respond in valid JSON."""

CODING_GENERATION_PROMPT = """Generate {count} coding/programming questions for "{job_title}" ({experience_level} level).

SKILLS: {skills_json}
DOMAIN: {domain}
DIFFICULTY: {difficulty_dist}

Return a JSON array with this structure:
[
    {{
        "id": "code_1",
        "title": "Short descriptive title",
        "problem_statement": "Detailed problem description with examples",
        "question_type": "implementation|debugging|system_design|optimization",
        "skill": "Primary skill",
        "difficulty": "easy|medium|hard",
        "language_options": ["python", "java", "javascript"],
        "starter_code": "def solution(input):\\n    # Your code here\\n    pass",
        "test_cases": [
            {{"input": "example input", "expected_output": "expected output", "is_hidden": false}},
            {{"input": "edge case", "expected_output": "expected output", "is_hidden": true}}
        ],
        "constraints": ["Time complexity: O(n)", "1 <= n <= 10^5"],
        "hints": ["Consider using a hash map"],
        "time_estimate_seconds": 900,
        "max_points": 20.0,
        "evaluation_criteria": [
            "Correctness - passes all test cases",
            "Code quality - readable, well-structured",
            "Efficiency - optimal time/space complexity"
        ]
    }}
]

RULES:
1. Problems must be solvable within the time estimate
2. Include at least 3 test cases per problem (mix visible and hidden)
3. For {experience_level}: adjust complexity appropriately
4. Include at least one edge case in test cases
5. Starter code should give clear function signature
6. For system_design type: describe the design task clearly with expected deliverables
7. Match problems to the actual skills required by the JD
"""


# ─── Generator Class ──────────────────────────────────────────

class QuestionGenerator:
    """Generates complete assessments from parsed job descriptions."""

    def __init__(self):
        self.llm = llm_client

    async def generate_full_assessment(
        self,
        parsed_jd: ParsedJD,
        mcq_count: Optional[int] = None,
        subjective_count: Optional[int] = None,
        coding_count: Optional[int] = None,
        duration_minutes: Optional[int] = None,
        custom_difficulty: Optional[dict] = None,
    ) -> Assessment:
        """Generate a complete assessment from a parsed JD."""
        config = parsed_jd.assessment_config
        mcq_count = mcq_count or config.get("mcq_count", 10)
        subjective_count = subjective_count or config.get("subjective_count", 5)
        coding_count = coding_count or config.get("coding_count", 3)
        duration = duration_minutes or config.get("recommended_duration_minutes", 90)
        difficulty_dist = custom_difficulty or config.get(
            "difficulty_distribution", {"easy": 0.3, "medium": 0.5, "hard": 0.2}
        )

        skills_json = json.dumps(
            [{"name": s.name, "weight": s.weight, "category": s.category, "level": s.proficiency_level}
             for s in parsed_jd.skills if s.priority == "must_have"],
            indent=2
        )

        logger.info(f"Generating assessment: {mcq_count} MCQ, {subjective_count} subjective, {coding_count} coding")

        # Generate all question types in parallel-ish (sequential for stability)
        mcqs = await self._generate_mcqs(
            parsed_jd, mcq_count, skills_json, difficulty_dist
        )
        subjective = await self._generate_subjective(
            parsed_jd, subjective_count, skills_json, difficulty_dist
        )
        coding = await self._generate_coding(
            parsed_jd, coding_count, skills_json, difficulty_dist
        )

        # Calculate totals
        total_points = (
            sum(q.points for q in mcqs)
            + sum(q.max_points for q in subjective)
            + sum(q.max_points for q in coding)
        )

        # Skill coverage stats
        all_skills_tested = (
            [q.skill for q in mcqs]
            + [q.skill for q in subjective]
            + [q.skill for q in coding]
        )
        skill_counts = {}
        for s in all_skills_tested:
            skill_counts[s] = skill_counts.get(s, 0) + 1
        total_q = len(all_skills_tested) or 1
        skill_coverage = {k: v / total_q for k, v in skill_counts.items()}

        # Difficulty distribution stats
        all_difficulties = (
            [q.difficulty for q in mcqs]
            + [q.difficulty for q in subjective]
            + [q.difficulty for q in coding]
        )
        diff_dist = {}
        for d in all_difficulties:
            diff_dist[d] = diff_dist.get(d, 0) + 1

        import uuid
        assessment = Assessment(
            id=str(uuid.uuid4()),
            job_title=parsed_jd.job_title,
            total_duration_minutes=duration,
            mcq_questions=mcqs,
            subjective_questions=subjective,
            coding_questions=coding,
            total_points=total_points,
            skill_coverage=skill_coverage,
            difficulty_distribution=diff_dist,
            metadata={
                "experience_level": parsed_jd.experience_level,
                "domain": parsed_jd.domain,
                "skills_count": len(parsed_jd.skills),
            }
        )

        logger.info(f"Assessment generated: {total_points} total points, {len(all_skills_tested)} questions")
        return assessment

    async def _generate_mcqs(
        self, parsed_jd: ParsedJD, count: int, skills_json: str, difficulty_dist: dict
    ) -> list[MCQQuestion]:
        """Generate MCQ questions."""
        level = parsed_jd.experience_level
        if level == "fresher":
            level_focus = "basics and fundamentals"
        elif level in ("mid", "senior"):
            level_focus = "practical application and architecture"
        else:
            level_focus = "advanced concepts"

        prompt = MCQ_GENERATION_PROMPT.format(
            count=count,
            job_title=parsed_jd.job_title,
            experience_level=level,
            skills_json=skills_json,
            difficulty_dist=json.dumps(difficulty_dist),
            domain=parsed_jd.domain,
            level_focus=level_focus,
        )
        result = await self.llm.generate_json(
            prompt=prompt,
            system_prompt=MCQ_SYSTEM_PROMPT,
            temperature=0.4,
        )

        questions = []
        items = result if isinstance(result, list) else result.get("questions", result.get("mcq_questions", []))
        for i, q in enumerate(items[:count]):
            try:
                q["id"] = q.get("id", f"mcq_{i+1}")
                questions.append(MCQQuestion(**q))
            except Exception as e:
                logger.warning(f"Skipping malformed MCQ {i}: {e}")
        return questions

    async def _generate_subjective(
        self, parsed_jd: ParsedJD, count: int, skills_json: str, difficulty_dist: dict
    ) -> list[SubjectiveQuestion]:
        """Generate subjective questions."""
        prompt = SUBJECTIVE_GENERATION_PROMPT.format(
            count=count,
            job_title=parsed_jd.job_title,
            experience_level=parsed_jd.experience_level,
            skills_json=skills_json,
            domain=parsed_jd.domain,
            difficulty_dist=json.dumps(difficulty_dist),
        )
        result = await self.llm.generate_json(
            prompt=prompt,
            system_prompt=SUBJECTIVE_SYSTEM_PROMPT,
            temperature=0.5,
        )

        questions = []
        items = result if isinstance(result, list) else result.get("questions", [])
        for i, q in enumerate(items[:count]):
            try:
                q["id"] = q.get("id", f"subj_{i+1}")
                questions.append(SubjectiveQuestion(**q))
            except Exception as e:
                logger.warning(f"Skipping malformed subjective Q {i}: {e}")
        return questions

    async def _generate_coding(
        self, parsed_jd: ParsedJD, count: int, skills_json: str, difficulty_dist: dict
    ) -> list[CodingQuestion]:
        """Generate coding questions."""
        prompt = CODING_GENERATION_PROMPT.format(
            count=count,
            job_title=parsed_jd.job_title,
            experience_level=parsed_jd.experience_level,
            skills_json=skills_json,
            domain=parsed_jd.domain,
            difficulty_dist=json.dumps(difficulty_dist),
        )
        result = await self.llm.generate_json(
            prompt=prompt,
            system_prompt=CODING_SYSTEM_PROMPT,
            temperature=0.4,
        )

        questions = []
        items = result if isinstance(result, list) else result.get("questions", [])
        for i, q in enumerate(items[:count]):
            try:
                q["id"] = q.get("id", f"code_{i+1}")
                questions.append(CodingQuestion(**q))
            except Exception as e:
                logger.warning(f"Skipping malformed coding Q {i}: {e}")
        return questions

    async def regenerate_question(
        self,
        question_type: str,
        skill: str,
        difficulty: str,
        parsed_jd: ParsedJD,
    ) -> dict:
        """Regenerate a single question of a specific type."""
        skills_json = json.dumps([{"name": skill, "weight": 1.0}])
        difficulty_dist = {difficulty: 1.0}

        if question_type == "mcq":
            result = await self._generate_mcqs(parsed_jd, 1, skills_json, difficulty_dist)
        elif question_type == "subjective":
            result = await self._generate_subjective(parsed_jd, 1, skills_json, difficulty_dist)
        elif question_type == "coding":
            result = await self._generate_coding(parsed_jd, 1, skills_json, difficulty_dist)
        else:
            raise ValueError(f"Unknown question type: {question_type}")

        return result[0] if result else None


# Singleton
question_generator = QuestionGenerator()
