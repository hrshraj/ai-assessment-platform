package com.devscore.ai.SpringBootBackend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.devscore.ai.SpringBootBackend.entity.Assessment;
import com.devscore.ai.SpringBootBackend.entity.User;
import com.devscore.ai.SpringBootBackend.entity.Question;
import com.devscore.ai.SpringBootBackend.repository.AssessmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final PdfExtractionService pdfExtractionService;
    private final AiIntegrationService aiIntegrationService;

    public Assessment createAssessmentFromPdf(MultipartFile file, User recruiter, String title) {
        String extractedText = pdfExtractionService.extractTextFromPdf(file);
        return createAssessmentFromText(extractedText, recruiter, title);
    }

    public Assessment createAssessmentFromText(String jobDescriptionText, User recruiter, String title) {
        Assessment assessment = new Assessment();
        assessment.setTitle(title);
        assessment.setJobDescriptionText(jobDescriptionText);
        assessment.setRecruiter(recruiter);
        assessment.setDurationMinutes(60);

        assessment = assessmentRepository.save(assessment);

        List<Question> questions = aiIntegrationService.generateQuestions(assessment);
        assessment.setQuestions(questions);

        return assessmentRepository.save(assessment);
    }
}