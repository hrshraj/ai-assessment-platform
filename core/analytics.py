"""
Analytics, Ranking & Leaderboard Engine (Stateless)
=====================================================
- Candidate ranking and leaderboard generation
- Skill gap analysis
- Benchmark comparisons
- Recruiter report generation

All methods accept plain dicts — no database dependency.
"""
import logging
from typing import Optional
from pydantic import BaseModel, Field

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
    """Generate rankings, reports, and analytics. All methods accept plain dicts."""

    def generate_leaderboard(
        self,
        assessment_id: str,
        job_title: str,
        evaluations_data: list[dict],
        anti_cheat_data: Optional[dict[str, dict]] = None,
        cutoff_percentage: float = 0.0,
        candidate_names: Optional[dict[str, str]] = None,
    ) -> Leaderboard:
        """Generate a ranked leaderboard from candidate evaluation dicts.

        evaluations_data: list of EvaluationResponse-like dicts with keys:
            candidate_id, total_score, percentage, section_scores, skill_scores, strengths
        anti_cheat_data: {candidate_id: AntiCheatReport-like dict}
        """
        names = candidate_names or {}
        acr = anti_cheat_data or {}

        entries = []
        for ev in evaluations_data:
            cid = ev.get("candidate_id", "")
            pct = ev.get("percentage", 0)
            integrity_info = acr.get(cid, {})
            is_flagged = integrity_info.get("is_flagged", False)
            integrity_score = integrity_info.get("overall_integrity_score")

            is_qualified = pct >= cutoff_percentage and not is_flagged

            entries.append(LeaderboardEntry(
                rank=0,
                candidate_id=cid,
                candidate_name=names.get(cid, f"Candidate-{cid[:6]}"),
                total_score=ev.get("total_score", 0),
                percentage=pct,
                section_scores=ev.get("section_scores", {}),
                skill_scores=ev.get("skill_scores", {}),
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
        candidate_id: str,
        evaluation_data: dict,
        required_skills: dict[str, float],  # {"Python": 80.0, "SQL": 70.0}
        all_evaluations_data: Optional[list[dict]] = None,
    ) -> SkillGapReport:
        """Generate a skill gap analysis for a candidate.

        evaluation_data: EvaluationResponse-like dict with keys:
            candidate_id, percentage, skill_scores, strengths, etc.
        all_evaluations_data: list of similar dicts for benchmarking.
        """
        skill_scores = evaluation_data.get("skill_scores", {})
        percentage = evaluation_data.get("percentage", 0)

        skill_gaps = []
        strengths = []
        improvements = []

        for skill, required_level in required_skills.items():
            current = skill_scores.get(skill, 0)
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
        if all_evaluations_data and len(all_evaluations_data) > 1:
            all_pcts = [e.get("percentage", 0) for e in all_evaluations_data]
            avg_score = sum(all_pcts) / len(all_pcts)
            top_scores = sorted(all_pcts, reverse=True)
            top_10_avg = sum(top_scores[:max(1, len(top_scores) // 10)]) / max(1, len(top_scores) // 10)

            benchmark = {
                "candidate_score": percentage,
                "average_score": round(avg_score, 1),
                "vs_average": round(percentage - avg_score, 1),
                "top_10_percent_avg": round(top_10_avg, 1),
                "vs_top_10": round(percentage - top_10_avg, 1),
                "percentile": self._calculate_percentile(percentage, all_pcts),
            }

        return SkillGapReport(
            candidate_id=candidate_id,
            skill_gaps=skill_gaps,
            strengths=strengths,
            improvement_areas=improvements,
            benchmark_comparison=benchmark,
        )

    def generate_recruiter_report(
        self,
        assessment_id: str,
        job_title: str,
        evaluations_data: list[dict],
        anti_cheat_data: Optional[dict[str, dict]] = None,
        total_registered: int = 0,
        cutoff_percentage: float = 50.0,
    ) -> RecruiterReport:
        """Generate a comprehensive report for recruiters.

        evaluations_data: list of EvaluationResponse-like dicts.
        anti_cheat_data: {candidate_id: AntiCheatReport-like dict}
        """
        acr = anti_cheat_data or {}
        total_applicants = total_registered or len(evaluations_data)
        completion_rate = len(evaluations_data) / total_applicants * 100 if total_applicants > 0 else 0

        scores = [e.get("percentage", 0) for e in evaluations_data]
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
        all_skills: dict[str, list[float]] = {}
        for ev in evaluations_data:
            for skill, score in ev.get("skill_scores", {}).items():
                all_skills.setdefault(skill, []).append(score)
        top_skills = {k: round(sum(v) / len(v), 1) for k, v in all_skills.items()}

        # Shortlisted candidates
        qualified = [e for e in evaluations_data if e.get("percentage", 0) >= cutoff_percentage]
        qualified.sort(key=lambda e: -e.get("percentage", 0))
        shortlisted = [
            {
                "candidate_id": e.get("candidate_id", ""),
                "score": e.get("percentage", 0),
                "strengths": e.get("strengths", [])[:3],
                "integrity": acr.get(e.get("candidate_id", ""), {}).get("overall_integrity_score"),
            }
            for e in qualified[:20]
        ]

        # Flagged candidates
        flagged = [
            {
                "candidate_id": cid,
                "flags": [f.get("description", "") for f in report.get("flags", [])[:3]],
                "integrity_score": report.get("overall_integrity_score"),
            }
            for cid, report in acr.items() if report.get("is_flagged", False)
        ]

        recommendations = self._generate_recommendations(
            len(evaluations_data), avg_score, len(qualified), len(flagged)
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
        median = sorted_scores[n // 2] if n % 2 else (sorted_scores[n // 2 - 1] + sorted_scores[n // 2]) / 2
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
