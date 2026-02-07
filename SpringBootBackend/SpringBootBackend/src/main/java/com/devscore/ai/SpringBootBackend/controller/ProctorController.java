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
                .orElseThrow(() -> new RuntimeException("Invalid Submission ID"));

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
        // Save all logs in one DB transaction - efficient!
        List<ProctorLog> logs = requests.stream()
                .map(request -> {
                    Submission submission = submissionRepository.findById(String.valueOf(request.submissionId()))
                            .orElseThrow(() -> new RuntimeException("Invalid Submission ID"));
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
                    return log;
                })
                .toList();
        proctorLogRepository.saveAll(logs);
        return ResponseEntity.ok().build();
    }
}
