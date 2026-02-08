package com.devscore.ai.SpringBootBackend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devscore.ai.SpringBootBackend.dto.ProctorRequest;
import com.devscore.ai.SpringBootBackend.entity.ProctorLog;
import com.devscore.ai.SpringBootBackend.entity.Submission;
import com.devscore.ai.SpringBootBackend.repository.ProctorLogRepository;
import com.devscore.ai.SpringBootBackend.repository.SubmissionRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/proctor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProctorController {

    private final ProctorLogRepository proctorLogRepository;
    private final SubmissionRepository submissionRepository;

    @PostMapping("/log")
    public ResponseEntity<?> logProctorEvent(@RequestBody ProctorRequest request) {

        // 1. Validate the Submission exists
        Submission submission = submissionRepository.findById(String.valueOf(request.submissionId()))
                .orElse(null);
        if (submission == null) {
            System.out.println("WARN: Proctor log for unknown submission ID: " + request.submissionId());
            return ResponseEntity.ok("Skipped - unknown submission");
        }

        // 2. Build the Log
        ProctorLog log = ProctorLog.builder()
                .submission(submission)
                .timestamp(LocalDateTime.now())
                .logType(request.logType())
                .build();

        if (request.logType() == ProctorLog.LogType.SNAPSHOT) {
            log.setSnapshotBase64(request.data()); // Store Image
        } else {
            log.setActivityLogJson(request.data()); // Store JSON Events
        }

        proctorLogRepository.save(log);

        return ResponseEntity.ok("Log Saved");
    }

    @PostMapping("/batch-log")
    public ResponseEntity<?> logBatch(@RequestBody List<ProctorRequest> requests) {
        // Save all logs in one DB transaction - skip invalid submission IDs gracefully
        List<ProctorLog> logs = new java.util.ArrayList<>();
        for (ProctorRequest request : requests) {
            try {
                Submission submission = submissionRepository.findById(String.valueOf(request.submissionId()))
                        .orElse(null);
                if (submission == null) {
                    System.out.println("WARN: Skipping proctor log for unknown submission ID: " + request.submissionId());
                    continue;
                }
                ProctorLog log = ProctorLog.builder()
                        .submission(submission)
                        .timestamp(LocalDateTime.now())
                        .logType(request.logType())
                        .build();
                if (request.logType() == ProctorLog.LogType.SNAPSHOT) {
                    log.setSnapshotBase64(request.data());
                } else {
                    log.setActivityLogJson(request.data());
                }
                logs.add(log);
            } catch (Exception e) {
                System.out.println("WARN: Skipping proctor log entry due to error: " + e.getMessage());
            }
        }
        if (!logs.isEmpty()) {
            proctorLogRepository.saveAll(logs);
        }
        return ResponseEntity.ok().build();
    }
}
