package com.devscore.ai.SpringBootBackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.entity.User;

public interface SubmissionRepository extends JpaRepository <Submission , String> {

    @Query("SELECT s FROM Submission s WHERE s.assessment.id = :assessmentId ORDER BY s.score DESC, s.submittedAt ASC")
    List<Submission> findLeaderboardByAssessmentId(@Param("assessmentId") String assessmentId);
    List<Submission> findByAssessmentIdAndIdNot(String assessmentId, String excludeId);
    List<Submission> findByAssessmentId(String assessmentId);
    List<Submission> findByCandidateOrderBySubmittedAtDesc(User candidate);
}
