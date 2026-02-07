package com.devscore.ai.SpringBootBackend.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devscore.ai.SpringBootBackend.entity.*;
import com.devscore.ai.SpringBootBackend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/seed")
@RequiredArgsConstructor
@Slf4j
public class SeedController {

    private final UserRepository userRepository;
    private final AssessmentRepository assessmentRepository;
    private final SubmissionRepository submissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @PostMapping("/data")
    public ResponseEntity<?> seedDatabase() {
        try {
            // --- 1. Create Recruiter ---
            User recruiter = userRepository.findByEmail("recruiter@devscore.ai").orElseGet(() -> {
                User r = User.builder()
                    .email("recruiter@devscore.ai")
                    .passwordHash(passwordEncoder.encode("Test1234!"))
                    .fullName("Priya Sharma")
                    .role(Role.RECRUITER)
                    .companyName("TechCorp India")
                    .build();
                return userRepository.save(r);
            });

            // --- 2. Create Candidates ---
            User candidate1 = findOrCreateCandidate("sarah@gmail.com", "Sarah Connor", "https://github.com/sarahconnor");
            User candidate2 = findOrCreateCandidate("rahul@gmail.com", "Rahul Verma", "https://github.com/rahulv");
            User candidate3 = findOrCreateCandidate("alex@gmail.com", "Alex Chen", "https://github.com/alexchen");

            // --- 3. Create Assessments with Questions ---
            Assessment a1 = createReactAssessment(recruiter);
            Assessment a2 = createBackendAssessment(recruiter);
            Assessment a3 = createMLAssessment(recruiter);

            // --- 4. Create Submissions with Scores ---
            createSubmission(candidate1, a1, 87, 95.0,
                "{\"React\":92,\"TypeScript\":85,\"CSS\":78,\"Testing\":88,\"Performance\":90}",
                "[\"Excellent component architecture\",\"Strong TypeScript skills\",\"Great testing practices\"]",
                "[\"CSS optimization could improve\",\"Need more experience with SSR\"]",
                "Outstanding React developer. Demonstrates deep understanding of component lifecycle and state management.");

            createSubmission(candidate2, a1, 72, 88.0,
                "{\"React\":75,\"TypeScript\":68,\"CSS\":80,\"Testing\":65,\"Performance\":70}",
                "[\"Good CSS skills\",\"Solid fundamentals\"]",
                "[\"Testing needs improvement\",\"TypeScript generics weak\",\"Should learn React.memo patterns\"]",
                "Solid developer with room for growth in TypeScript and testing practices.");

            createSubmission(candidate3, a1, 94, 98.0,
                "{\"React\":96,\"TypeScript\":95,\"CSS\":90,\"Testing\":92,\"Performance\":95}",
                "[\"Exceptional code quality\",\"Expert-level TypeScript\",\"Strong architecture decisions\",\"Excellent performance awareness\"]",
                "[\"Minor: Could document more\"]",
                "Elite-level frontend engineer. Top 1% in React and TypeScript proficiency.");

            createSubmission(candidate1, a2, 78, 92.0,
                "{\"Java\":80,\"SpringBoot\":75,\"SQL\":82,\"SystemDesign\":76,\"Security\":78}",
                "[\"Strong SQL knowledge\",\"Good security awareness\"]",
                "[\"Spring Boot advanced features need work\",\"System design could be more scalable\"]",
                "Competent backend developer with strong database skills.");

            createSubmission(candidate2, a2, 91, 97.0,
                "{\"Java\":93,\"SpringBoot\":90,\"SQL\":88,\"SystemDesign\":92,\"Security\":91}",
                "[\"Expert Spring Boot knowledge\",\"Excellent system design\",\"Strong security implementation\"]",
                "[\"Minor SQL optimization opportunities\"]",
                "Senior-level backend engineer with comprehensive Spring Boot expertise.");

            log.info("Database seeded successfully!");
            return ResponseEntity.ok(Map.of(
                "message", "Database seeded successfully!",
                "assessments", List.of(a1.getId(), a2.getId(), a3.getId()),
                "candidates", List.of(candidate1.getEmail(), candidate2.getEmail(), candidate3.getEmail()),
                "recruiter", recruiter.getEmail()
            ));

        } catch (Exception e) {
            log.error("Seeding failed", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private User findOrCreateCandidate(String email, String name, String github) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User c = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("Test1234!"))
                .fullName(name)
                .role(Role.CANDIDATE)
                .githubProfile(github)
                .build();
            return userRepository.save(c);
        });
    }

    private Assessment createReactAssessment(User recruiter) {
        // Check if already exists
        List<Assessment> existing = assessmentRepository.findByRecruiterId(recruiter.getId());
        for (Assessment a : existing) {
            if ("Senior React Engineer".equals(a.getTitle())) return a;
        }

        Assessment assessment = new Assessment();
        assessment.setTitle("Senior React Engineer");
        assessment.setJobDescriptionText("Looking for a Senior React Engineer with 5+ years experience in React, TypeScript, Next.js, and modern frontend tooling.");
        assessment.setRecruiter(recruiter);
        assessment.setDurationMinutes(60);
        assessment = assessmentRepository.save(assessment);

        List<Question> questions = new ArrayList<>();
        // MCQs
        questions.add(createMCQ(assessment, "Which React hook is used to perform side effects in function components?",
            "[\"useEffect\",\"useState\",\"useReducer\",\"useMemo\"]", "useEffect", 10));
        questions.add(createMCQ(assessment, "What is the purpose of React.memo()?",
            "[\"Memoize component to prevent unnecessary re-renders\",\"Create a new memo in state\",\"Store values in memory permanently\",\"Replace useCallback\"]", "Memoize component to prevent unnecessary re-renders", 10));
        questions.add(createMCQ(assessment, "In TypeScript with React, what type should you use for a component that accepts children?",
            "[\"React.PropsWithChildren<Props>\",\"React.ChildrenProps\",\"React.WithChildren\",\"React.ComponentChildren\"]", "React.PropsWithChildren<Props>", 10));
        questions.add(createMCQ(assessment, "Which pattern is best for sharing stateful logic between components?",
            "[\"Custom Hooks\",\"Higher-Order Components only\",\"Global variables\",\"CSS Modules\"]", "Custom Hooks", 10));
        questions.add(createMCQ(assessment, "What is the virtual DOM in React?",
            "[\"A lightweight copy of the real DOM for efficient updates\",\"A backup of the HTML file\",\"A browser extension\",\"The actual DOM rendered by the browser\"]", "A lightweight copy of the real DOM for efficient updates", 10));

        // Subjective
        Question subj = new Question();
        subj.setAssessment(assessment);
        subj.setQuestionText("Explain how you would architect a large-scale React application with complex state management. Discuss the trade-offs between Redux, Context API, and Zustand, and when you would choose each.");
        subj.setType(Question.QuestionType.SUBJECTIVE);
        subj.setScoreWeight(25);
        subj.setRubricJson("{\"architecture_understanding\":5,\"state_management_depth\":5,\"tradeoff_analysis\":5,\"practical_examples\":5,\"clarity\":5}");
        subj.setExpectedAnswerJson("[\"Discuss component composition and module boundaries\",\"Compare Redux for complex global state vs Context for simpler cases\",\"Mention Zustand for lightweight needs\",\"Address performance implications of each\",\"Discuss server state vs client state (React Query/TanStack)\"]");
        questions.add(subj);

        // Coding
        Question coding = new Question();
        coding.setAssessment(assessment);
        coding.setQuestionText("Implement a custom React hook called useDebounce that delays updating a value until after a specified delay. The hook should accept a value and delay in milliseconds, and return the debounced value.");
        coding.setType(Question.QuestionType.CODING);
        coding.setScoreWeight(25);
        coding.setCorrectAnswer("function useDebounce(value, delay) { const [debounced, setDebounced] = useState(value); useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]); return debounced; }");
        questions.add(coding);

        assessment.setQuestions(questions);
        return assessmentRepository.save(assessment);
    }

    private Assessment createBackendAssessment(User recruiter) {
        List<Assessment> existing = assessmentRepository.findByRecruiterId(recruiter.getId());
        for (Assessment a : existing) {
            if ("Backend Java Developer".equals(a.getTitle())) return a;
        }

        Assessment assessment = new Assessment();
        assessment.setTitle("Backend Java Developer");
        assessment.setJobDescriptionText("Seeking a Backend Java Developer with expertise in Spring Boot, microservices, REST APIs, and PostgreSQL.");
        assessment.setRecruiter(recruiter);
        assessment.setDurationMinutes(75);
        assessment = assessmentRepository.save(assessment);

        List<Question> questions = new ArrayList<>();
        questions.add(createMCQ(assessment, "Which annotation in Spring Boot is used to mark a class as a REST controller?",
            "[\"@RestController\",\"@Controller\",\"@Service\",\"@Component\"]", "@RestController", 10));
        questions.add(createMCQ(assessment, "What is the default scope of a Spring Bean?",
            "[\"Singleton\",\"Prototype\",\"Request\",\"Session\"]", "Singleton", 10));
        questions.add(createMCQ(assessment, "Which HTTP method is idempotent?",
            "[\"PUT\",\"POST\",\"PATCH\",\"None of the above\"]", "PUT", 10));
        questions.add(createMCQ(assessment, "What does @Transactional annotation do in Spring?",
            "[\"Manages database transaction boundaries\",\"Creates a new thread\",\"Enables logging\",\"Handles HTTP requests\"]", "Manages database transaction boundaries", 10));

        Question subj = new Question();
        subj.setAssessment(assessment);
        subj.setQuestionText("Design a RESTful API for a bookstore application. Include endpoints for CRUD operations on books, user authentication, and order management. Explain your choice of HTTP methods and status codes.");
        subj.setType(Question.QuestionType.SUBJECTIVE);
        subj.setScoreWeight(30);
        subj.setRubricJson("{\"api_design\":6,\"http_methods\":5,\"status_codes\":5,\"authentication\":5,\"scalability\":4}");
        subj.setExpectedAnswerJson("[\"RESTful resource naming conventions\",\"Proper use of GET/POST/PUT/DELETE\",\"Authentication with JWT or OAuth\",\"Appropriate status codes (200/201/400/401/404/500)\",\"Pagination for list endpoints\"]");
        questions.add(subj);

        Question coding = new Question();
        coding.setAssessment(assessment);
        coding.setQuestionText("Write a Java method that finds the longest palindromic substring in a given string. Optimize for time complexity.");
        coding.setType(Question.QuestionType.CODING);
        coding.setScoreWeight(30);
        questions.add(coding);

        assessment.setQuestions(questions);
        return assessmentRepository.save(assessment);
    }

    private Assessment createMLAssessment(User recruiter) {
        List<Assessment> existing = assessmentRepository.findByRecruiterId(recruiter.getId());
        for (Assessment a : existing) {
            if ("AI/ML Engineer".equals(a.getTitle())) return a;
        }

        Assessment assessment = new Assessment();
        assessment.setTitle("AI/ML Engineer");
        assessment.setJobDescriptionText("Hiring an AI/ML Engineer with experience in deep learning, NLP, computer vision, and MLOps. Must know PyTorch/TensorFlow and have deployed models to production.");
        assessment.setRecruiter(recruiter);
        assessment.setDurationMinutes(90);
        assessment = assessmentRepository.save(assessment);

        List<Question> questions = new ArrayList<>();
        questions.add(createMCQ(assessment, "Which optimization algorithm adapts the learning rate for each parameter?",
            "[\"Adam\",\"SGD\",\"Batch Gradient Descent\",\"Newton's Method\"]", "Adam", 10));
        questions.add(createMCQ(assessment, "What is the vanishing gradient problem?",
            "[\"Gradients become extremely small during backpropagation in deep networks\",\"The model runs out of memory\",\"The loss function vanishes\",\"Data preprocessing issue\"]", "Gradients become extremely small during backpropagation in deep networks", 10));
        questions.add(createMCQ(assessment, "Which architecture is commonly used for sequence-to-sequence tasks in NLP?",
            "[\"Transformer\",\"CNN\",\"Random Forest\",\"SVM\"]", "Transformer", 10));

        Question subj = new Question();
        subj.setAssessment(assessment);
        subj.setQuestionText("Explain the Transformer architecture and how self-attention works. Discuss why Transformers have largely replaced RNNs/LSTMs in NLP tasks.");
        subj.setType(Question.QuestionType.SUBJECTIVE);
        subj.setScoreWeight(35);
        subj.setRubricJson("{\"attention_mechanism\":8,\"architecture_understanding\":7,\"comparison_with_rnns\":5,\"practical_applications\":5}");
        subj.setExpectedAnswerJson("[\"Query-Key-Value attention mechanism\",\"Multi-head attention for parallel processing\",\"Positional encoding for sequence order\",\"Parallelization advantage over sequential RNNs\",\"Better long-range dependency handling\"]");
        questions.add(subj);

        Question coding = new Question();
        coding.setAssessment(assessment);
        coding.setQuestionText("Implement a simple neural network class in Python with forward pass, backward pass, and gradient descent update. Use only NumPy (no frameworks).");
        coding.setType(Question.QuestionType.CODING);
        coding.setScoreWeight(35);
        questions.add(coding);

        assessment.setQuestions(questions);
        return assessmentRepository.save(assessment);
    }

    private Question createMCQ(Assessment assessment, String text, String optionsJson, String correct, int weight) {
        Question q = new Question();
        q.setAssessment(assessment);
        q.setQuestionText(text);
        q.setType(Question.QuestionType.MCQ);
        q.setOptionsJson(optionsJson);
        q.setCorrectAnswer(correct);
        q.setScoreWeight(weight);
        return q;
    }

    private void createSubmission(User candidate, Assessment assessment, int score, double integrity,
            String skillScores, String strengths, String weaknesses, String feedback) {
        // Check if submission already exists
        List<Submission> existing = submissionRepository.findByCandidateIdOrderBySubmittedAtDesc(candidate.getId());
        for (Submission s : existing) {
            if (s.getAssessment().getId().equals(assessment.getId())) return;
        }

        Submission sub = Submission.builder()
            .assessment(assessment)
            .candidate(candidate)
            .submittedAt(LocalDateTime.now().minusHours((long)(Math.random() * 48)))
            .score(score)
            .aiFeedback(feedback)
            .skillScoresJson(skillScores)
            .strengthsJson(strengths)
            .weaknessesJson(weaknesses)
            .integrityScore(integrity)
            .integrityFlagsJson("[]")
            .build();

        submissionRepository.save(sub);
    }
}
