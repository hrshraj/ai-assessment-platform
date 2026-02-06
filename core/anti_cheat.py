"""
Anti-Cheat & Fraud Detection Engine
=====================================
Detects:
1. Resume-skill mismatches (resume claims vs assessment performance)
2. Plagiarism / code similarity between candidates
3. Anomaly detection (suspicious timing, random guessing)
4. Bot detection patterns
5. Copy-paste detection
"""
import logging
import json
import re
import hashlib
from typing import Optional
from collections import Counter
from pydantic import BaseModel, Field

from core.llm_client import llm_client
from core.evaluator import CandidateEvaluation
from config import settings

logger = logging.getLogger(__name__)


# ─── Models ────────────────────────────────────────────────────

class ResumeAnalysis(BaseModel):
    claimed_skills: list[dict]  # [{"name": "Python", "level": "expert", "years": 3}]
    experience_years: float
    education: list[str]
    projects: list[str]
    certifications: list[str]


class CheatFlag(BaseModel):
    flag_type: str  # "resume_mismatch", "plagiarism", "timing_anomaly", "random_guess", "bot_pattern"
    severity: str  # "low", "medium", "high", "critical"
    description: str
    evidence: dict
    confidence: float = Field(ge=0, le=1.0)


class AntiCheatReport(BaseModel):
    candidate_id: str
    assessment_id: str
    overall_integrity_score: float = Field(ge=0, le=100)
    flags: list[CheatFlag]
    resume_match_score: Optional[float] = None
    plagiarism_score: float = 0.0
    timing_anomaly_score: float = 0.0
    is_flagged: bool = False
    recommendation: str  # "clear", "review", "reject"
    summary: str


# ─── Prompts ───────────────────────────────────────────────────

RESUME_PARSE_PROMPT = """Extract structured information from this resume/CV text.

RESUME TEXT:
---
{resume_text}
---

Return JSON:
{{
    "claimed_skills": [
        {{"name": "Python", "level": "expert|advanced|intermediate|beginner", "years": 3}},
    ],
    "experience_years": 5.0,
    "education": ["B.Tech CS from IIT Delhi"],
    "projects": ["Project description 1", "Project description 2"],
    "certifications": ["AWS Certified", "Google Cloud"]
}}
"""

RESUME_MISMATCH_PROMPT = """Analyze the mismatch between a candidate's resume claims and their assessment performance.

RESUME CLAIMS:
{resume_claims}

ASSESSMENT PERFORMANCE:
- Overall: {overall_pct}%
- Skill-wise scores: {skill_scores}

JOB TITLE: {job_title}

Return JSON:
{{
    "match_score": <float 0-100>,
    "mismatches": [
        {{
            "skill": "Python",
            "claimed_level": "expert",
            "assessed_level": "beginner",
            "gap_severity": "high",
            "explanation": "Claimed 5 years of Python but scored 20% on Python questions"
        }}
    ],
    "overall_assessment": "brief summary of resume vs performance alignment"
}}
"""


# ─── Anti-Cheat Engine ────────────────────────────────────────

class AntiCheatEngine:
    """Comprehensive anti-cheat and fraud detection system."""

    def __init__(self):
        self.llm = llm_client

    async def full_integrity_check(
        self,
        candidate_id: str,
        assessment_id: str,
        evaluation: CandidateEvaluation,
        resume_text: Optional[str] = None,
        response_timings: Optional[list[dict]] = None,
        all_candidate_codes: Optional[dict[str, list[str]]] = None,
    ) -> AntiCheatReport:
        """Run all anti-cheat checks and produce a report."""
        flags = []

        # 1. Resume-skill mismatch detection
        resume_match_score = None
        if resume_text:
            resume_flags, resume_match_score = await self.check_resume_mismatch(
                resume_text, evaluation
            )
            flags.extend(resume_flags)

        # 2. Timing anomaly detection
        timing_score = 0.0
        if response_timings:
            timing_flags, timing_score = self.check_timing_anomalies(response_timings)
            flags.extend(timing_flags)

        # 3. Random guessing detection (MCQ)
        guess_flags = self.check_random_guessing(evaluation)
        flags.extend(guess_flags)

        # 4. Code plagiarism detection (cross-candidate)
        plagiarism_score = 0.0
        if all_candidate_codes and candidate_id in all_candidate_codes:
            plag_flags, plagiarism_score = self.check_code_plagiarism(
                candidate_id, all_candidate_codes
            )
            flags.extend(plag_flags)

        # 5. Copy-paste / identical pattern detection
        paste_flags = self.check_copy_paste_patterns(evaluation)
        flags.extend(paste_flags)

        # Calculate overall integrity score
        integrity_score = self._calculate_integrity_score(
            flags, resume_match_score, timing_score, plagiarism_score
        )

        is_flagged = any(f.severity in ("high", "critical") for f in flags)
        recommendation = "clear"
        if is_flagged:
            recommendation = "reject" if integrity_score < 30 else "review"
        elif integrity_score < 60:
            recommendation = "review"

        summary = self._generate_summary(flags, integrity_score)

        return AntiCheatReport(
            candidate_id=candidate_id,
            assessment_id=assessment_id,
            overall_integrity_score=round(integrity_score, 1),
            flags=flags,
            resume_match_score=resume_match_score,
            plagiarism_score=round(plagiarism_score, 2),
            timing_anomaly_score=round(timing_score, 2),
            is_flagged=is_flagged,
            recommendation=recommendation,
            summary=summary,
        )

    # ── Resume Mismatch Detection ──

    async def check_resume_mismatch(
        self, resume_text: str, evaluation: CandidateEvaluation
    ) -> tuple[list[CheatFlag], float]:
        """Check if resume claims align with assessment performance."""
        flags = []

        # Parse resume
        resume_result = await self.llm.generate_json(
            prompt=RESUME_PARSE_PROMPT.format(resume_text=resume_text),
            system_prompt="Extract structured resume data. Respond in JSON only.",
            temperature=0.1,
        )

        resume_claims = json.dumps(resume_result.get("claimed_skills", []), indent=2)

        # Compare with performance
        mismatch_result = await self.llm.generate_json(
            prompt=RESUME_MISMATCH_PROMPT.format(
                resume_claims=resume_claims,
                overall_pct=evaluation.percentage,
                skill_scores=json.dumps(evaluation.skill_scores, indent=2),
                job_title="",
            ),
            system_prompt="Analyze resume vs performance mismatch. Respond in JSON.",
            temperature=0.2,
        )

        match_score = float(mismatch_result.get("match_score", 50))
        mismatches = mismatch_result.get("mismatches", [])

        for mm in mismatches:
            if mm.get("gap_severity") in ("high", "critical"):
                flags.append(CheatFlag(
                    flag_type="resume_mismatch",
                    severity=mm.get("gap_severity", "medium"),
                    description=(
                        f"Skill mismatch: Claimed {mm.get('claimed_level', '?')} in "
                        f"{mm.get('skill', '?')} but assessed at {mm.get('assessed_level', '?')} level"
                    ),
                    evidence={
                        "skill": mm.get("skill"),
                        "claimed": mm.get("claimed_level"),
                        "assessed": mm.get("assessed_level"),
                        "skill_score": evaluation.skill_scores.get(mm.get("skill", ""), 0),
                    },
                    confidence=0.75,
                ))

        if match_score < settings.RESUME_MISMATCH_THRESHOLD * 100:
            flags.append(CheatFlag(
                flag_type="resume_mismatch",
                severity="critical",
                description=f"Overall resume-performance match is very low ({match_score}%)",
                evidence={"match_score": match_score, "threshold": settings.RESUME_MISMATCH_THRESHOLD * 100},
                confidence=0.8,
            ))

        return flags, match_score

    # ── Timing Anomaly Detection ──

    def check_timing_anomalies(
        self, response_timings: list[dict]
    ) -> tuple[list[CheatFlag], float]:
        """Detect suspicious timing patterns."""
        flags = []
        anomaly_score = 0.0

        if not response_timings:
            return flags, anomaly_score

        times = [t.get("time_seconds", 0) for t in response_timings]

        # Check for suspiciously fast answers
        fast_answers = sum(1 for t in times if t < settings.MIN_TIME_PER_QUESTION)
        if fast_answers > len(times) * 0.3:
            severity = "critical" if fast_answers > len(times) * 0.5 else "high"
            flags.append(CheatFlag(
                flag_type="timing_anomaly",
                severity=severity,
                description=f"{fast_answers}/{len(times)} questions answered in under {settings.MIN_TIME_PER_QUESTION}s",
                evidence={"fast_answers": fast_answers, "total": len(times), "threshold_seconds": settings.MIN_TIME_PER_QUESTION},
                confidence=0.85,
            ))
            anomaly_score += 40

        # Check for uniform timing (bot pattern)
        if len(times) > 5:
            avg_time = sum(times) / len(times)
            variance = sum((t - avg_time) ** 2 for t in times) / len(times)
            std_dev = variance ** 0.5
            cv = std_dev / avg_time if avg_time > 0 else 0

            if cv < 0.1:  # Very uniform timing = suspicious
                flags.append(CheatFlag(
                    flag_type="bot_pattern",
                    severity="high",
                    description="Suspiciously uniform response times (possible bot)",
                    evidence={"coefficient_of_variation": round(cv, 4), "avg_time": round(avg_time, 1)},
                    confidence=0.7,
                ))
                anomaly_score += 30

        # Check for sudden speed changes (might be looking up answers)
        for i in range(1, len(times)):
            if times[i] > 0 and times[i-1] > 0:
                ratio = max(times[i], times[i-1]) / min(times[i], times[i-1])
                if ratio > 10:  # 10x speed difference between consecutive questions
                    anomaly_score += 5

        return flags, min(anomaly_score, 100)

    # ── Random Guessing Detection ──

    def check_random_guessing(
        self, evaluation: CandidateEvaluation
    ) -> list[CheatFlag]:
        """Detect random guessing patterns in MCQ answers."""
        flags = []
        mcq_results = evaluation.mcq_results

        if len(mcq_results) < 5:
            return flags

        # Check answer distribution
        answers = [r.selected_answer for r in mcq_results if r.selected_answer]
        if not answers:
            flags.append(CheatFlag(
                flag_type="random_guess",
                severity="critical",
                description="No MCQ answers provided",
                evidence={"answered": 0, "total": len(mcq_results)},
                confidence=0.95,
            ))
            return flags

        # Check for same answer pattern (all A's, all B's, etc.)
        counter = Counter(answers)
        most_common_pct = counter.most_common(1)[0][1] / len(answers) if answers else 0
        if most_common_pct > 0.7 and len(answers) > 5:
            flags.append(CheatFlag(
                flag_type="random_guess",
                severity="high",
                description=f"Same answer selected for {most_common_pct*100:.0f}% of MCQs (likely guessing)",
                evidence={"distribution": dict(counter), "most_common_pct": round(most_common_pct, 2)},
                confidence=0.75,
            ))

        # Check if accuracy is close to random (25% for 4 options)
        correct = sum(1 for r in mcq_results if r.is_correct)
        accuracy = correct / len(mcq_results)
        if accuracy <= 0.3 and len(mcq_results) >= 8:
            flags.append(CheatFlag(
                flag_type="random_guess",
                severity="medium",
                description=f"MCQ accuracy ({accuracy*100:.0f}%) is near random chance (25%)",
                evidence={"accuracy": round(accuracy, 2), "correct": correct, "total": len(mcq_results)},
                confidence=0.6,
            ))

        return flags

    # ── Code Plagiarism Detection ──

    def check_code_plagiarism(
        self, candidate_id: str, all_candidate_codes: dict[str, list[str]]
    ) -> tuple[list[CheatFlag], float]:
        """Detect code similarity between candidates."""
        from rapidfuzz import fuzz

        flags = []
        max_similarity = 0.0
        my_codes = all_candidate_codes.get(candidate_id, [])

        if not my_codes:
            return flags, 0.0

        for other_id, other_codes in all_candidate_codes.items():
            if other_id == candidate_id:
                continue
            for my_code in my_codes:
                for other_code in other_codes:
                    # Normalize code (remove whitespace, comments)
                    norm_mine = self._normalize_code(my_code)
                    norm_other = self._normalize_code(other_code)

                    # Token-level similarity
                    similarity = fuzz.ratio(norm_mine, norm_other) / 100.0

                    if similarity > max_similarity:
                        max_similarity = similarity

                    if similarity > settings.PLAGIARISM_THRESHOLD:
                        flags.append(CheatFlag(
                            flag_type="plagiarism",
                            severity="critical" if similarity > 0.95 else "high",
                            description=f"Code similarity of {similarity*100:.1f}% with candidate {other_id[:8]}...",
                            evidence={
                                "similarity": round(similarity, 3),
                                "other_candidate": other_id[:8],
                                "threshold": settings.PLAGIARISM_THRESHOLD,
                            },
                            confidence=0.9,
                        ))

        return flags, max_similarity

    # ── Copy-Paste Detection ──

    def check_copy_paste_patterns(
        self, evaluation: CandidateEvaluation
    ) -> list[CheatFlag]:
        """Detect signs of copy-paste in subjective answers."""
        flags = []

        for result in evaluation.subjective_results:
            text = result.answer_text
            if not text:
                continue

            # Check for unusually formatted text (markdown, HTML, etc.)
            if re.search(r'<[a-z]+[^>]*>', text) or text.count('```') > 2:
                flags.append(CheatFlag(
                    flag_type="copy_paste",
                    severity="medium",
                    description=f"Answer to {result.question_id} contains formatting suggesting copy-paste from external source",
                    evidence={"has_html": bool(re.search(r'<[a-z]+[^>]*>', text)), "code_blocks": text.count('```')},
                    confidence=0.5,
                ))

            # Check for references to sources
            if re.search(r'(according to|source:|reference:|from .+\.com)', text, re.I):
                flags.append(CheatFlag(
                    flag_type="copy_paste",
                    severity="low",
                    description=f"Answer to {result.question_id} contains external references",
                    evidence={"question_id": result.question_id},
                    confidence=0.4,
                ))

        return flags

    # ── Helpers ──

    def _normalize_code(self, code: str) -> str:
        """Normalize code for comparison by removing comments, whitespace, variable names."""
        # Remove single-line comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        # Normalize whitespace
        code = re.sub(r'\s+', ' ', code).strip()
        return code.lower()

    def _calculate_integrity_score(
        self, flags: list[CheatFlag], resume_match: Optional[float],
        timing_score: float, plagiarism_score: float,
    ) -> float:
        """Calculate overall integrity score (100 = fully clean)."""
        score = 100.0

        severity_penalties = {"low": 5, "medium": 10, "high": 20, "critical": 35}
        for flag in flags:
            score -= severity_penalties.get(flag.severity, 5)

        # Resume mismatch penalty
        if resume_match is not None and resume_match < 50:
            score -= (50 - resume_match) * 0.3

        # Plagiarism penalty
        if plagiarism_score > settings.PLAGIARISM_THRESHOLD:
            score -= 30

        return max(0, min(100, score))

    def _generate_summary(self, flags: list[CheatFlag], integrity_score: float) -> str:
        """Generate a human-readable integrity summary."""
        if not flags:
            return "No integrity concerns detected. Candidate appears genuine."

        critical = sum(1 for f in flags if f.severity == "critical")
        high = sum(1 for f in flags if f.severity == "high")

        if critical > 0:
            return (
                f"CRITICAL: {critical} critical integrity issues detected. "
                f"Integrity score: {integrity_score:.0f}/100. Manual review strongly recommended."
            )
        elif high > 0:
            return (
                f"WARNING: {high} high-severity flags detected. "
                f"Integrity score: {integrity_score:.0f}/100. Review recommended."
            )
        else:
            return (
                f"Minor concerns: {len(flags)} low/medium flags. "
                f"Integrity score: {integrity_score:.0f}/100."
            )


# Singleton
anti_cheat = AntiCheatEngine()
