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

        Assessment assessment = new Assessment();
        assessment.setTitle(title);
        assessment.setJobDescriptionText(extractedText);
        assessment.setRecruiter(recruiter);
        assessment.setDurationMinutes(60);

        assessment = assessmentRepository.save(assessment);


        List<Question> questions = aiIntegrationService.generateQuestions(assessment);
        assessment.setQuestions(questions);

        return assessmentRepository.save(assessment);
    }

    public Assessment createAssessmentFromText(String jobDescription, User recruiter, String title, int questionCount) {

        Assessment assessment = new Assessment();
        assessment.setTitle(title);
        assessment.setJobDescriptionText(jobDescription);
        assessment.setRecruiter(recruiter);
        assessment.setDurationMinutes(60);

        assessment = assessmentRepository.save(assessment);

        List<Question> questions = aiIntegrationService.generateQuestions(assessment, questionCount);
        assessment.setQuestions(questions);

        return assessmentRepository.save(assessment);
    }
}