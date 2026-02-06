"""
Analytics, Ranking & Leaderboard Engine
=========================================
- Candidate ranking and leaderboard generation
- Skill gap analysis
- Benchmark comparisons
- Recruiter report generation
"""
import logging
from typing import Optional
from pydantic import BaseModel, Field

from core.evaluator import CandidateEvaluation
from core.anti_cheat import AntiCheatReport

logger = logging.getLogger(__name__)


class LeaderboardEntry(BaseModel):
    rank: int
    candidate_id: str
    candidate_name: str = ""
    total_score: float
    percentage: float
    section_scores: dict
    skill_scores: dict[str, float]
    integrity_score: Optional[float] = None
    is_qualified: bool = True
    is_flagged: bool = False


class Leaderboard(BaseModel):
    assessment_id: str
    job_title: str
    total_candidates: int
    qualified_count: int
    disqualified_count: int
    flagged_count: int
    entries: list[LeaderboardEntry]
    statistics: dict  # avg, median, top_percentile scores
    cutoff_score: float = 0.0


class SkillGapReport(BaseModel):
    candidate_id: str
    skill_gaps: list[dict]  # [{"skill": "Python", "current": 40, "required": 80, "gap": 40}]
    strengths: list[str]
    improvement_areas: list[str]
    benchmark_comparison: dict  # {"vs_average": +10, "vs_top_10": -20}


class RecruiterReport(BaseModel):
    assessment_id: str
    job_title: str
    total_applicants: int
    completion_rate: float
    qualified_candidates: int
    average_score: float
    score_distribution: dict  # {"0-20": 5, "20-40": 10, ...}
    top_skills_coverage: dict  # {"Python": 85, "SQL": 60}
    shortlisted: list[dict]  # Top candidates
    flagged_candidates: list[dict]
    recommendations: list[str]


class AnalyticsEngine:
    """Generate rankings, reports, and analytics."""

    def generate_leaderboard(
        self,
        assessment_id: str,
        job_title: str,
        evaluations: list[CandidateEvaluation],
        anti_cheat_reports: Optional[dict[str, AntiCheatReport]] = None,
        cutoff_percentage: float = 0.0,
        candidate_names: Optional[dict[str, str]] = None,
    ) -> Leaderboard:
        """Generate a ranked leaderboard from candidate evaluations."""
        names = candidate_names or {}
        acr = anti_cheat_reports or {}

        entries = []
        for eval in evaluations:
            integrity = acr.get(eval.candidate_id)
            is_flagged = integrity.is_flagged if integrity else False
            integrity_score = integrity.overall_integrity_score if integrity else None

            is_qualified = eval.percentage >= cutoff_percentage and not is_flagged

            entries.append(LeaderboardEntry(
                rank=0,  # Will be set after sorting
                candidate_id=eval.candidate_id,
                candidate_name=names.get(eval.candidate_id, f"Candidate-{eval.candidate_id[:6]}"),
                total_score=eval.total_score,
                percentage=eval.percentage,
                section_scores=eval.section_scores,
                skill_scores=eval.skill_scores,
                integrity_score=integrity_score,
                is_qualified=is_qualified,
                is_flagged=is_flagged,
            ))

        # Sort by percentage (descending), then by total score
        entries.sort(key=lambda e: (-e.percentage, -e.total_score))

        # Assign ranks
        for i, entry in enumerate(entries, 1):
            entry.rank = i

        # Statistics
        scores = [e.percentage for e in entries]
        stats = self._compute_statistics(scores)

        qualified = sum(1 for e in entries if e.is_qualified)
        flagged = sum(1 for e in entries if e.is_flagged)

        return Leaderboard(
            assessment_id=assessment_id,
            job_title=job_title,
            total_candidates=len(entries),
            qualified_count=qualified,
            disqualified_count=len(entries) - qualified,
            flagged_count=flagged,
            entries=entries,
            statistics=stats,
            cutoff_score=cutoff_percentage,
        )

    def generate_skill_gap_report(
        self,
        evaluation: CandidateEvaluation,
        required_skills: dict[str, float],  # {"Python": 80.0, "SQL": 70.0}
        all_evaluations: Optional[list[CandidateEvaluation]] = None,
    ) -> SkillGapReport:
        """Generate a skill gap analysis for a candidate."""
        skill_gaps = []
        strengths = []
        improvements = []

        for skill, required_level in required_skills.items():
            current = evaluation.skill_scores.get(skill, 0)
            gap = required_level - current

            skill_gaps.append({
                "skill": skill,
                "current_score": round(current, 1),
                "required_score": round(required_level, 1),
                "gap": round(max(0, gap), 1),
                "status": "meets" if current >= required_level else "below",
            })

            if current >= required_level:
                strengths.append(f"{skill}: {current:.0f}% (exceeds {required_level:.0f}% requirement)")
            elif gap > 20:
                improvements.append(f"{skill}: significant gap ({gap:.0f}% below requirement)")
            elif gap > 0:
                improvements.append(f"{skill}: minor gap ({gap:.0f}% below requirement)")

        # Benchmark comparison
        benchmark = {}
        if all_evaluations and len(all_evaluations) > 1:
            avg_score = sum(e.percentage for e in all_evaluations) / len(all_evaluations)
            top_scores = sorted([e.percentage for e in all_evaluations], reverse=True)
            top_10_avg = sum(top_scores[:max(1, len(top_scores)//10)]) / max(1, len(top_scores)//10)

            benchmark = {
                "candidate_score": evaluation.percentage,
                "average_score": round(avg_score, 1),
                "vs_average": round(evaluation.percentage - avg_score, 1),
                "top_10_percent_avg": round(top_10_avg, 1),
                "vs_top_10": round(evaluation.percentage - top_10_avg, 1),
                "percentile": self._calculate_percentile(
                    evaluation.percentage, [e.percentage for e in all_evaluations]
                ),
            }

        return SkillGapReport(
            candidate_id=evaluation.candidate_id,
            skill_gaps=skill_gaps,
            strengths=strengths,
            improvement_areas=improvements,
            benchmark_comparison=benchmark,
        )

    def generate_recruiter_report(
        self,
        assessment_id: str,
        job_title: str,
        evaluations: list[CandidateEvaluation],
        anti_cheat_reports: Optional[dict[str, AntiCheatReport]] = None,
        total_registered: int = 0,
        cutoff_percentage: float = 50.0,
    ) -> RecruiterReport:
        """Generate a comprehensive report for recruiters."""
        acr = anti_cheat_reports or {}
        total_applicants = total_registered or len(evaluations)
        completion_rate = len(evaluations) / total_applicants * 100 if total_applicants > 0 else 0

        scores = [e.percentage for e in evaluations]
        avg_score = sum(scores) / len(scores) if scores else 0

        # Score distribution
        buckets = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
        for s in scores:
            if s < 20: buckets["0-20"] += 1
            elif s < 40: buckets["20-40"] += 1
            elif s < 60: buckets["40-60"] += 1
            elif s < 80: buckets["60-80"] += 1
            else: buckets["80-100"] += 1

        # Skills coverage across all candidates
        all_skills = {}
        for eval in evaluations:
            for skill, score in eval.skill_scores.items():
                if skill not in all_skills:
                    all_skills[skill] = []
                all_skills[skill].append(score)
        top_skills = {k: round(sum(v)/len(v), 1) for k, v in all_skills.items()}

        # Shortlisted candidates
        qualified = [e for e in evaluations if e.percentage >= cutoff_percentage]
        qualified.sort(key=lambda e: -e.percentage)
        shortlisted = [
            {
                "candidate_id": e.candidate_id,
                "score": e.percentage,
                "strengths": e.strengths[:3],
                "integrity": acr[e.candidate_id].overall_integrity_score
                if e.candidate_id in acr else None,
            }
            for e in qualified[:20]
        ]

        # Flagged candidates
        flagged = [
            {
                "candidate_id": cid,
                "flags": [f.description for f in report.flags[:3]],
                "integrity_score": report.overall_integrity_score,
            }
            for cid, report in acr.items() if report.is_flagged
        ]

        recommendations = self._generate_recommendations(
            len(evaluations), avg_score, len(qualified), len(flagged)
        )

        return RecruiterReport(
            assessment_id=assessment_id,
            job_title=job_title,
            total_applicants=total_applicants,
            completion_rate=round(completion_rate, 1),
            qualified_candidates=len(qualified),
            average_score=round(avg_score, 1),
            score_distribution=buckets,
            top_skills_coverage=top_skills,
            shortlisted=shortlisted,
            flagged_candidates=flagged,
            recommendations=recommendations,
        )

    # ── Helpers ──

    def _compute_statistics(self, scores: list[float]) -> dict:
        if not scores:
            return {"mean": 0, "median": 0, "min": 0, "max": 0, "std_dev": 0}

        sorted_scores = sorted(scores)
        n = len(sorted_scores)
        mean = sum(scores) / n
        median = sorted_scores[n // 2] if n % 2 else (sorted_scores[n//2 - 1] + sorted_scores[n//2]) / 2
        variance = sum((s - mean) ** 2 for s in scores) / n
        std_dev = variance ** 0.5

        return {
            "mean": round(mean, 2),
            "median": round(median, 2),
            "min": round(min(scores), 2),
            "max": round(max(scores), 2),
            "std_dev": round(std_dev, 2),
            "top_10_percentile": round(sorted_scores[max(0, int(n * 0.9))], 2) if n > 0 else 0,
        }

    def _calculate_percentile(self, score: float, all_scores: list[float]) -> float:
        below = sum(1 for s in all_scores if s < score)
        return round(below / len(all_scores) * 100, 1) if all_scores else 0

    def _generate_recommendations(
        self, total: int, avg: float, qualified: int, flagged: int
    ) -> list[str]:
        recs = []
        if qualified < total * 0.1:
            recs.append("Very few qualified candidates. Consider reviewing cutoff criteria or broadening the job description.")
        if avg < 40:
            recs.append("Average scores are low. Assessment difficulty may need calibration.")
        if flagged > total * 0.2:
            recs.append(f"High fraud rate ({flagged}/{total} flagged). Consider adding proctoring measures.")
        if qualified > 20:
            recs.append(f"{qualified} qualified candidates identified. Consider a second round for top 10-15.")
        if not recs:
            recs.append("Assessment results look healthy. Proceed with shortlisting top candidates.")
        return recs


# Singleton
analytics = AnalyticsEngine()
