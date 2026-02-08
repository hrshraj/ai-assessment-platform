package com.devscore.ai.SpringBootBackend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devscore.ai.SpringBootBackend.entity.ProctorLog;

public interface ProctorLogRepository extends JpaRepository<ProctorLog, String> {
    
    List<ProctorLog> findBySubmissionIdOrderByTimestampAsc(String submissionId);
    void deleteBySubmissionId(String submissionId);
}
