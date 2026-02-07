package com.devscore.ai.SpringBootBackend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class IntegrityReportDTO {
    private List<SnapshotDTO> snapshots;
    private List<Map<String, Object>> events; // For rrweb player

    @Data
    @Builder
    public static class SnapshotDTO {
        private String id;
        private String image;
        private long timeOffset;
        private String reason;
        private String timestamp;
    }
}