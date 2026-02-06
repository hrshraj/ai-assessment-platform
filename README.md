# 🧠 AI Assessment Platform

> AI-powered assessment & evaluation platform to eliminate fake job applications

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Your Team)                      │
│         React / HTML+CSS / Any Framework                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │ Recruiter│  │ Candidate│  │ Leaderboard│  │ Analytics│  │
│  │Dashboard │  │  Portal  │  │   Board    │  │  Reports │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘  │
└───────┼──────────────┼──────────────┼──────────────┼────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────── REST API (FastAPI) ──────────────────────┐
│  /api/auth/*  /api/jd/*  /api/assessment/*  /api/candidate/*│
│  /api/resume/*  /api/leaderboard/*  /api/analytics/*        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────────┐
        ▼                ▼                    ▼
┌──────────────┐ ┌──────────────┐  ┌─────────────────┐
│  AI Engine   │ │   Database   │  │     Redis        │
│ ┌──────────┐ │ │   SQLite /   │  │  (Sessions/      │
│ │JD Parser │ │ │  PostgreSQL  │  │   Caching)       │
│ ├──────────┤ │ └──────────────┘  └─────────────────┘
│ │Question  │ │
│ │Generator │ │
│ ├──────────┤ │         ┌─────────────────┐
│ │Evaluator │ │ ◄──────►│   Ollama LLM    │
│ ├──────────┤ │         │  (Mistral /     │
│ │Anti-Cheat│ │         │   CodeLlama)    │
│ ├──────────┤ │         └─────────────────┘
│ │Resume    │ │
│ │Parser    │ │
│ ├──────────┤ │
│ │Analytics │ │
│ └──────────┘ │
└──────────────┘
```

## 📂 Project Structure

```
ai-assessment-platform/
├── main.py                    # FastAPI app with ALL routes
├── config.py                  # Configuration management
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container definition
├── docker-compose.yml         # Full stack (App + Ollama + Redis)
├── setup.sh                   # Quick setup script
├── test_flow.py               # End-to-end test script
│
├── core/                      # 🧠 AI ENGINE (the brain)
│   ├── llm_client.py          # Ollama LLM wrapper
│   ├── jd_parser.py           # JD intelligence & skill extraction
│   ├── question_generator.py  # MCQ, subjective, coding question gen
│   ├── evaluator.py           # AI scoring & code execution
│   ├── anti_cheat.py          # Plagiarism, resume mismatch, anomaly
│   ├── resume_parser.py       # Resume parsing (PDF/DOCX/text)
│   └── analytics.py           # Leaderboard, reports, skill gaps
│
├── api/                       # API layer
│   ├── auth.py                # JWT authentication
│   └── schemas.py             # Request/response models
│
└── models/                    # Database
    └── database.py            # SQLAlchemy models
```

## 🚀 Quick Start

### Option A: Docker (Recommended)
```bash
chmod +x setup.sh
./setup.sh
```

### Option B: Manual
```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull mistral
ollama pull codellama

# 2. Install Python deps
pip install -r requirements.txt

# 3. Run
python main.py
```

### Test It
```bash
# API docs (Swagger UI)
open http://localhost:8000/docs

# Run end-to-end test
python test_flow.py
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/jd/create` | Upload & parse JD |
| GET | `/api/jd/{id}` | Get parsed JD |
| POST | `/api/assessment/generate` | Generate assessment from JD |
| GET | `/api/assessment/{id}/questions` | Get candidate-safe questions |
| POST | `/api/candidate/start` | Start assessment |
| POST | `/api/candidate/submit` | Submit answers |
| POST | `/api/candidate/evaluate/{id}` | Run AI evaluation |
| GET | `/api/candidate/result/{id}` | Get results |
| POST | `/api/resume/upload` | Upload & parse resume |
| POST | `/api/resume/match/{cid}/{jid}` | Resume-JD match |
| POST | `/api/leaderboard/generate` | Generate rankings |
| GET | `/api/analytics/report/{id}` | Recruiter report |
| GET | `/api/analytics/skill-gap/{id}` | Skill gap analysis |
| GET | `/api/dashboard` | Recruiter dashboard |
| GET | `/health` | System health |

## 🧪 Complete API Flow

```
Recruiter uploads JD
    → AI parses skills, experience level, domain
    → Recruiter generates assessment (customizable)
        → AI creates MCQ + Subjective + Coding questions
        
Candidate starts assessment
    → Gets questions (answers hidden)
    → Submits responses with timing data
    → AI evaluates:
        ├── MCQs: auto-graded
        ├── Subjective: rubric-based AI scoring
        ├── Coding: execution + AI quality review
        └── Anti-cheat: timing, plagiarism, resume mismatch
    → Gets detailed results with feedback

Recruiter views:
    ├── Leaderboard (ranked candidates)
    ├── Skill gap reports
    ├── Integrity flags
    └── Recruiter analytics dashboard
```

## 👥 24-Hour Hackathon Task Split (9 Members)

### Hour 0-2: Setup & Architecture
- **All**: Clone repo, run setup, understand architecture
- Read `main.py` for API structure, `core/` for AI modules

### AI/Backend Team (Members 1-5)

| Member | Module | Files | Hours |
|--------|--------|-------|-------|
| M1 | JD Parser improvements + testing | `core/jd_parser.py` | 4-8h |
| M2 | Question Generator quality tuning | `core/question_generator.py` | 6-10h |
| M3 | Evaluator + Code sandbox security | `core/evaluator.py` | 6-10h |
| M4 | Anti-cheat + Resume parser | `core/anti_cheat.py`, `core/resume_parser.py` | 6-8h |
| M5 | Analytics + API integration testing | `core/analytics.py`, `test_flow.py` | 6-8h |

### Frontend Team (Members 6-8)

| Member | Component | Hours |
|--------|-----------|-------|
| M6 | Recruiter Dashboard (JD upload, assessment config) | 8-12h |
| M7 | Candidate Portal (questions UI, code editor, timer) | 8-12h |
| M8 | Results/Leaderboard/Analytics pages | 6-10h |

### Member 9: Pitch & Demo
- Hours 0-16: Help wherever needed
- Hours 16-24: Prepare demo, pitch deck, video recording

## 🔧 Key Customization Points

### Change LLM Model
Edit `.env`:
```
OLLAMA_MODEL=llama3.1        # or mixtral, gemma2, etc.
OLLAMA_CODING_MODEL=codellama
```

### Adjust Assessment Defaults
Edit `.env`:
```
DEFAULT_MCQ_COUNT=15
DEFAULT_SUBJECTIVE_COUNT=5
DEFAULT_CODING_COUNT=3
DEFAULT_ASSESSMENT_DURATION_MINUTES=120
```

### Switch to PostgreSQL
```
DATABASE_URL=postgresql://user:pass@localhost:5432/assessment_db
```

## 🛡️ Anti-Cheat Features

1. **Resume-Performance Mismatch**: AI compares resume claims vs actual scores
2. **Plagiarism Detection**: Cross-candidate code similarity (rapidfuzz)
3. **Timing Anomalies**: Detects impossibly fast answers / uniform timing (bots)
4. **Random Guessing**: Statistical detection of guess patterns in MCQs
5. **Copy-Paste Detection**: Identifies external source formatting in answers

## 📊 Scoring System

- **MCQ**: 1 point each (auto-graded)
- **Subjective**: 10 points each (AI rubric: completeness, accuracy, clarity, depth)
- **Coding**: 20 points each (60% test cases + 40% code quality)
- **Skill-wise mapping**: Every question maps to skills from the JD
- **Weighted scoring**: Skills weighted by JD priority (must_have > nice_to_have)
