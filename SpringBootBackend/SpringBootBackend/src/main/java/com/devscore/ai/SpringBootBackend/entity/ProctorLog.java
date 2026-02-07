package com.devscore.ai.SpringBootBackend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "proctor_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctorLog {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    private LocalDateTime timestamp;

    @Lob 
    @Column(columnDefinition = "TEXT") 
    private String snapshotBase64; 

    @Column(columnDefinition = "jsonb") 
    private String activityLogJson;

    @Enumerated(EnumType.STRING)
    private LogType logType;

    public enum LogType {
        SNAPSHOT,
        ACTIVITY_DUMP,
        TAB_SWITCH,
        FULL_SCREEN_EXIT
    }
}
