"""
End-to-End Test Script
========================
Demonstrates the complete flow:
1. Register recruiter + candidate
2. Upload JD → Parse → Generate Assessment
3. Upload resume → Match with JD
4. Start assessment → Submit answers → Evaluate
5. Generate leaderboard & reports

Run: python test_flow.py
Requires: Server running at http://localhost:8000
"""
import httpx
import json
import asyncio
import sys
import os

BASE_URL = "http://localhost:8000"

# ── Sample Data ──

SAMPLE_JD = """
Full Stack Developer - MERN Stack

Company: TechCorp Solutions
Location: Remote
Experience: 2-4 years

We are looking for a passionate Full Stack Developer to join our engineering team.

Required Skills:
- Strong proficiency in JavaScript/TypeScript
- React.js with hooks, context API, Redux
- Node.js with Express.js
- MongoDB (Mongoose ODM)
- REST API design and development
- Git version control
- Understanding of CI/CD pipelines

Nice to Have:
- Docker and containerization
- AWS (EC2, S3, Lambda)
- Redis caching
- GraphQL
- Unit testing (Jest, Mocha)

Responsibilities:
- Design and develop scalable web applications
- Build reusable components and front-end libraries
- Write clean, maintainable, and well-documented code
- Collaborate with designers and backend engineers
- Participate in code reviews
- Optimize applications for maximum speed and scalability

Qualifications:
- B.Tech/B.E. in Computer Science or related field
- 2-4 years of professional experience in web development
- Strong problem-solving skills
- Excellent communication skills
"""

SAMPLE_RESUME = """
RAHUL SHARMA
Email: rahul.sharma@email.com | Phone: +91-9876543210
LinkedIn: linkedin.com/in/rahulsharma

SUMMARY:
Experienced Full Stack Developer with 3 years of experience building web applications 
using React, Node.js, and MongoDB. Passionate about clean code and scalable architecture.

SKILLS:
- Frontend: React.js, Redux, HTML5, CSS3, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js, Python (Flask)
- Database: MongoDB, PostgreSQL, Redis
- DevOps: Docker, AWS (EC2, S3), GitHub Actions, CI/CD
- Testing: Jest, Mocha, Cypress
- Tools: Git, Jira, Figma, VS Code

EXPERIENCE:
Software Developer | WebTech Solutions | Jan 2022 - Present (3 years)
- Developed a customer portal using React + Node.js serving 50K+ users
- Implemented REST APIs with Express.js and MongoDB
- Set up CI/CD pipeline with GitHub Actions and Docker
- Reduced page load time by 40% through code splitting and lazy loading

Junior Developer | StartupXYZ | Jun 2021 - Dec 2021 (6 months)
- Built responsive UI components with React and Material-UI
- Worked on MongoDB schema design and aggregation pipelines

EDUCATION:
B.Tech Computer Science | Delhi Technological University | 2021 | CGPA: 8.5

CERTIFICATIONS:
- AWS Certified Cloud Practitioner
- Meta Front-End Developer Certificate
"""


async def test_full_flow():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=600.0) as client:
        print("=" * 60)
        print("🧪 AI Assessment Platform - End-to-End Test")
        print("=" * 60)

        # Use unique emails per run to avoid conflicts
        import time
        run_id = str(int(time.time()))[-6:]

        # ── Helper to check responses ──
        def check(resp, step_name):
            if resp.status_code >= 400:
                print(f"   ❌ {step_name} FAILED (HTTP {resp.status_code})")
                print(f"   Response: {resp.text[:500]}")
                sys.exit(1)
            return resp.json()

        # ── 1. Health Check ──
        print("\n📋 Step 1: Health Check")
        resp = await client.get("/health")
        health = check(resp, "Health check")
        print(f"   Status: {health['status']}")
        print(f"   LLM Available: {health['llm_available']}")
        if not health["llm_available"]:
            print("   ⚠️ LLM not available. Run: ollama pull mistral")
            print("   Continuing anyway (some operations may fail)...")

        # ── 2. Register Users ──
        print("\n👤 Step 2: Register Users")
        recruiter = await client.post("/api/auth/register", json={
            "email": f"recruiter{run_id}@techcorp.com",
            "password": "test123",
            "full_name": "HR Manager",
            "role": "recruiter",
        })
        rec_data = check(recruiter, "Recruiter registration")
        rec_token = rec_data["access_token"]
        rec_headers = {"Authorization": f"Bearer {rec_token}"}
        print(f"   ✅ Recruiter registered: {rec_data['user_id'][:8]}...")

        candidate = await client.post("/api/auth/register", json={
            "email": f"rahul{run_id}@email.com",
            "password": "test123",
            "full_name": "Rahul Sharma",
            "role": "candidate",
        })
        cand_data = check(candidate, "Candidate registration")
        cand_id = cand_data["user_id"]
        print(f"   ✅ Candidate registered: {cand_id[:8]}...")

        # ── 3. Upload & Parse JD ──
        print("\n📄 Step 3: Upload & Parse Job Description")
        jd_resp = await client.post("/api/jd/create", json={
            "title": "Full Stack Developer - MERN",
            "raw_text": SAMPLE_JD,
        }, headers=rec_headers)
        jd_data = check(jd_resp, "JD creation")
        jd_id = jd_data["id"]
        parsed = jd_data["parsed_data"]
        print(f"   ✅ JD Parsed: {jd_data.get('message', '')}")
        print(f"   Skills found: {[s['name'] for s in parsed.get('skills', [])[:5]]}...")
        print(f"   Experience level: {parsed.get('experience_level', 'unknown')}")

        # ── 4. Generate Assessment ──
        print("\n🎯 Step 4: Generate Assessment")
        assess_resp = await client.post("/api/assessment/generate", json={
            "jd_id": jd_id,
            "mcq_count": 5,
            "subjective_count": 2,
            "coding_count": 1,
            "duration_minutes": 60,
            "cutoff_percentage": 40.0,
        }, headers=rec_headers)
        assess_data = check(assess_resp, "Assessment generation")
        assessment_id = assess_data["id"]
        print(f"   ✅ Assessment generated!")
        print(f"   MCQs: {assess_data.get('mcq_count', 0)}")
        print(f"   Subjective: {assess_data.get('subjective_count', 0)}")
        print(f"   Coding: {assess_data.get('coding_count', 0)}")
        print(f"   Total Points: {assess_data.get('total_points', 0)}")

        # ── 5. Upload Resume ──
        print("\n📎 Step 5: Upload & Parse Resume")
        import io
        resume_file = io.BytesIO(SAMPLE_RESUME.encode())
        files = {"file": ("rahul_resume.txt", resume_file, "text/plain")}
        resume_resp = await client.post(
            f"/api/resume/upload?candidate_id={cand_id}",
            files=files,
        )
        resume_data = check(resume_resp, "Resume upload")
        print(f"   ✅ Resume parsed: {len(resume_data.get('parsed_skills', []))} skills found")
        print(f"   Experience: {resume_data.get('total_experience_years', 0)} years")

        # ── 6. Match Resume with JD ──
        print("\n🔗 Step 6: Resume-JD Match")
        match_resp = await client.post(f"/api/resume/match/{cand_id}/{jd_id}")
        match_data = check(match_resp, "Resume-JD match")
        print(f"   ✅ Match: {match_data.get('match_percentage', 0)}%")
        print(f"   Fit: {match_data.get('overall_fit', 'unknown')}")

        # ── 7. Get Candidate Questions ──
        print("\n❓ Step 7: Fetch Questions (candidate view)")
        q_resp = await client.get(f"/api/assessment/{assessment_id}/questions")
        questions = check(q_resp, "Fetch questions")
        mcqs = questions.get("mcq_questions", [])
        subjs = questions.get("subjective_questions", [])
        codes = questions.get("coding_questions", [])
        print(f"   Got {len(mcqs)} MCQs, {len(subjs)} subjective, {len(codes)} coding")

        # ── 8. Start Assessment ──
        print("\n▶️ Step 8: Start Assessment")
        start_resp = await client.post("/api/candidate/start", json={
            "assessment_id": assessment_id,
            "candidate_id": cand_id,
        })
        start_data = check(start_resp, "Start assessment")
        submission_id = start_data["submission_id"]
        print(f"   ✅ Started: {submission_id[:8]}...")

        # ── 9. Submit Answers ──
        print("\n📝 Step 9: Submit Answers")
        # Generate mock answers
        mcq_answers = [
            {"question_id": q["id"], "selected_answer": "B", "time_taken_seconds": 45}
            for q in mcqs
        ]
        subjective_answers = {
            q["id"]: "This is a detailed answer covering key concepts of the topic. "
                     "The main approaches include using appropriate data structures and algorithms. "
                     "In practice, one would consider scalability, maintainability, and performance."
            for q in subjs
        }
        coding_answers = {
            q["id"]: {
                "code": "def solution(arr):\n    # Simple implementation\n    return sorted(arr)\n",
                "language": "python",
            }
            for q in codes
        }
        timings = [{"question_id": q["id"], "time_seconds": 45} for q in mcqs]

        submit_resp = await client.post("/api/candidate/submit", json={
            "submission_id": submission_id,
            "candidate_id": cand_id,
            "mcq_answers": mcq_answers,
            "subjective_answers": subjective_answers,
            "coding_answers": coding_answers,
            "response_timings": timings,
        })
        check(submit_resp, "Submit answers")
        print(f"   ✅ Answers submitted!")

        # ── 10. Evaluate ──
        print("\n🤖 Step 10: AI Evaluation (this may take 30-60 seconds)...")
        eval_resp = await client.post(f"/api/candidate/evaluate/{submission_id}")
        eval_data = check(eval_resp, "Evaluation")
        print(f"   ✅ Evaluation complete!")
        print(f"   Score: {eval_data.get('total_score', 0)}/{eval_data.get('max_total_score', 0)}")
        print(f"   Percentage: {eval_data.get('percentage', 0)}%")
        print(f"   Integrity Score: {eval_data.get('integrity_score', 'N/A')}")
        if eval_data.get("strengths"):
            print(f"   Strengths: {eval_data['strengths'][:2]}")
        if eval_data.get("integrity_flags"):
            print(f"   ⚠️ Flags: {eval_data['integrity_flags'][:2]}")

        # ── 11. Leaderboard ──
        print("\n🏆 Step 11: Generate Leaderboard")
        lb_resp = await client.post("/api/leaderboard/generate", json={
            "assessment_id": assessment_id,
            "cutoff_percentage": 30.0,
        })
        lb_data = check(lb_resp, "Leaderboard generation")
        print(f"   Total candidates: {lb_data.get('total_candidates', 0)}")
        print(f"   Qualified: {lb_data.get('qualified_count', 0)}")
        for entry in lb_data.get("entries", [])[:3]:
            print(f"   #{entry['rank']} - {entry.get('candidate_name', 'Unknown')}: {entry['percentage']}%")

        # ── 12. Skill Gap ──
        print("\n📊 Step 12: Skill Gap Analysis")
        gap_resp = await client.get(f"/api/analytics/skill-gap/{submission_id}")
        gap_data = check(gap_resp, "Skill gap analysis")
        for gap in gap_data.get("skill_gaps", [])[:3]:
            print(f"   {gap['skill']}: {gap['current_score']}% / {gap['required_score']}% required")

        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED! Platform is working end-to-end.")
        print("=" * 60)
        print(f"\n📚 API Documentation: {BASE_URL}/docs")
        print(f"🔍 Full results at: GET /api/candidate/result/{submission_id}")


if __name__ == "__main__":
    asyncio.run(test_full_flow())
