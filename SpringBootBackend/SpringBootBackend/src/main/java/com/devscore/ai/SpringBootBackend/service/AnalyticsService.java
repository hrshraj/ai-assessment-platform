package com.devscore.ai.SpringBootBackend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.devscore.ai.SpringBootBackend.dto.LeaderboardEntry;
import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.repository.ProctorLogRepository;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final SubmissionRepository submissionRepository;
    private final ProctorLogRepository proctorLogRepository;

    public List<LeaderboardEntry> getLeaderboard(String assessmentId) {
        List<Submission> submissions = submissionRepository.findLeaderboardByAssessmentId(assessmentId);

        return submissions.stream().map(sub -> {
            
            boolean isSuspicious = proctorLogRepository.findBySubmissionIdOrderByTimestampAsc(sub.getId()).size() > 5;
            String status = isSuspicious ? "FLAGGED" : "COMPLETED";

            return new LeaderboardEntry(
                    sub.getCandidate().getId(),
                    sub.getCandidate().getFullName(),
                    sub.getCandidate().getEmail(),
                    sub.getScore(),
                    status,
                    sub.getSubmittedAt()
            );
        }).collect(Collectors.toList());
    }
}
