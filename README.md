# AI Assessment Platform

<div align="center">

![Platform Status](https://img.shields.io/badge/status-active-success.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**An intelligent AI-powered platform for automated assessments and evaluations**

[Live Demo](https://ai-assessment-platform-psi.vercel.app) · [Report Bug](https://github.com/hrshraj/ai-assessment-platform/issues) · [Request Feature](https://github.com/hrshraj/ai-assessment-platform/issues)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🎯 About

AI Assessment Platform is a modern, full-stack web application that leverages artificial intelligence to conduct automated assessments, evaluations, and interviews. The platform streamlines the recruitment and testing process by providing intelligent question generation, automated evaluation, and comprehensive analytics.

### Why This Platform?

- **Automated Assessment**: Reduce manual effort in creating and evaluating tests
- **AI-Powered Analysis**: Intelligent evaluation of responses using machine learning
- **Scalable Solution**: Handle multiple assessments simultaneously
- **Real-time Results**: Instant feedback and scoring
- **Comprehensive Analytics**: Detailed insights into candidate performance

---

## ✨ Key Features

### 🤖 AI-Powered Capabilities
- **Intelligent Question Generation**: Auto-generate questions based on job roles and requirements
- **Automated Evaluation**: AI-driven assessment of responses with detailed scoring
- **Natural Language Processing**: Advanced text analysis for subjective answers
- **Adaptive Testing**: Difficulty adjustment based on candidate performance

### 📊 Assessment Management
- **Multi-format Support**: MCQ, coding challenges, essay questions, and more
- **Customizable Tests**: Create tailored assessments for specific roles
- **Time Management**: Set time limits per question or overall assessment
- **Question Randomization**: Ensure test integrity with shuffled questions

### 📈 Analytics & Reporting
- **Performance Metrics**: Comprehensive candidate scoring and ranking
- **Detailed Analytics**: Visual insights into assessment results
- **Comparative Analysis**: Benchmark candidates against each other
- **Export Reports**: Generate PDF/CSV reports for further analysis

### 🔐 Security & Reliability
- **Secure Authentication**: Protected access for admins and candidates
- **Data Encryption**: Secure handling of sensitive information
- **Proctoring Features**: Monitor test-taking behavior
- **Backup & Recovery**: Reliable data management

---

## 🛠️ Tech Stack

### Frontend
- **React 18+** - Modern UI library with hooks
- **Vite** - Next-generation frontend tooling
- **JavaScript (ES6+)** - Core programming language
- **CSS3** - Responsive styling

### Backend
- **Python 3.8+** - Primary backend language
- **FastAPI** - Modern, fast web framework for building APIs
- **Java (Spring Boot)** - Enterprise-grade backend services

### Database & Storage
- **MongoDB/PostgreSQL** - Data persistence
- **Redis** - Caching and session management

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Vercel** - Frontend deployment
- **Render** - Backend deployment

### AI/ML Libraries
- **TensorFlow/PyTorch** - Deep learning models
- **scikit-learn** - Machine learning algorithms
- **NLTK/spaCy** - Natural language processing
- **Transformers** - Pre-trained language models

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Java JDK** (v11 or higher) - for Spring Boot backend
- **Docker** (optional, for containerized deployment)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/hrshraj/ai-assessment-platform.git
cd ai-assessment-platform
```

#### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### 3. Python Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python main.py
```

The Python backend will be available at `http://localhost:8000`

#### 4. Spring Boot Backend Setup

```bash
cd SpringBootBackend/SpringBootBackend

# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

The Spring Boot backend will be available at `http://localhost:8080`

#### 5. Docker Setup (Alternative)

```bash
# Run with Docker Compose
docker-compose up --build

# Stop services
docker-compose down
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_SPRING_API_URL=http://localhost:8080

# Database
DATABASE_URL=mongodb://localhost:27017/assessment_db
# or PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/assessment_db

# AI/ML APIs
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Authentication
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# File Storage
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

### Setup Script

For quick setup, run the provided setup script:

```bash
chmod +x setup.sh
./setup.sh
```

---

## 📖 Usage

### For Administrators

1. **Create Assessment**
   - Log in to the admin dashboard
   - Navigate to "Create Assessment"
   - Configure question types, duration, and difficulty
   - Generate or import questions

2. **Manage Candidates**
   - Add candidates manually or import CSV
   - Send assessment invitations
   - Monitor real-time progress

3. **Review Results**
   - View candidate scores and rankings
   - Analyze performance metrics
   - Export detailed reports

### For Candidates

1. **Access Assessment**
   - Receive invitation email with unique link
   - Complete registration/login
   - Read instructions carefully

2. **Take Test**
   - Answer questions within time limit
   - Navigate between questions
   - Submit when complete

3. **View Results**
   - Receive instant feedback (if enabled)
   - View detailed score breakdown
   - Download certificate (if applicable)

---

## 📁 Project Structure

```
ai-assessment-platform/
├── api/                          # API route handlers
├── core/                         # Core business logic
├── SpringBootBackend/            # Java Spring Boot backend
│   └── SpringBootBackend/
│       ├── src/
│       ├── pom.xml
│       └── ...
├── public/                       # Static assets
├── src/                          # React frontend source
│   ├── components/               # Reusable components
│   ├── pages/                    # Page components
│   ├── services/                 # API service layers
│   ├── utils/                    # Utility functions
│   ├── App.jsx                   # Main App component
│   └── main.jsx                  # Entry point
├── .vscode/                      # VS Code settings
├── __pycache__/                  # Python cache
├── config.py                     # Configuration settings
├── schemas.py                    # Data validation schemas
├── main.py                       # FastAPI main application
├── test_flow.py                  # Test cases
├── requirements.txt              # Python dependencies
├── package.json                  # Node.js dependencies
├── vite.config.js                # Vite configuration
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Multi-container setup
├── vercel.json                   # Vercel deployment config
├── render.yaml                   # Render deployment config
├── setup.sh                      # Setup automation script
├── .env.example                  # Environment template
└── README.md                     # This file
```

---

## 🚢 Deployment

### Frontend (Vercel)

The frontend is deployed on Vercel with automatic deployments from the main branch.

```bash
# Manual deployment
npm run build
vercel --prod
```

### Backend (Render/Docker)

```bash
# Deploy to Render
git push origin main  # Automatic deployment configured

# Or use Docker
docker build -t ai-assessment-platform .
docker run -p 8000:8000 ai-assessment-platform
```

### Full Stack with Docker Compose

```bash
docker-compose -f docker-compose.yml up -d
```

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Assessment Endpoints

```http
GET    /api/assessments              # List all assessments
POST   /api/assessments              # Create new assessment
GET    /api/assessments/{id}         # Get specific assessment
PUT    /api/assessments/{id}         # Update assessment
DELETE /api/assessments/{id}         # Delete assessment
POST   /api/assessments/{id}/submit  # Submit assessment
```

### Question Endpoints

```http
GET    /api/questions                # List questions
POST   /api/questions/generate       # AI generate questions
POST   /api/questions                # Create question
```

### Results & Analytics

```http
GET /api/results/{assessment_id}           # Get results
GET /api/analytics/overview                # Dashboard analytics
GET /api/analytics/candidate/{id}          # Candidate analysis
```

For detailed API documentation, visit `/docs` endpoint when running the server (FastAPI auto-generated docs).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Project**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open Pull Request**

### Contribution Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea?

- [Report a Bug](https://github.com/hrshraj/ai-assessment-platform/issues/new?labels=bug)
- [Request a Feature](https://github.com/hrshraj/ai-assessment-platform/issues/new?labels=enhancement)

---

## 📝 License



---

## 👤 Contact

**Harsh Raj**

- GitHub: [@hrshraj](https://github.com/hrshraj)
- Project Link: [https://github.com/hrshraj/ai-assessment-platform](https://github.com/hrshraj/ai-assessment-platform)
- Live Demo: [https://ai-assessment-platform-psi.vercel.app](https://ai-assessment-platform-psi.vercel.app)

---

## 🙏 Acknowledgments

- FastAPI for the excellent backend framework
- React and Vite for modern frontend development
- Vercel and Render for deployment platforms
- All contributors who have helped improve this project

---

## 📊 Project Status

This project is actively maintained and under continuous development. 



---

<div align="center">

**Made with ❤️**

⭐ Star this repository if you find it helpful!

</div>
