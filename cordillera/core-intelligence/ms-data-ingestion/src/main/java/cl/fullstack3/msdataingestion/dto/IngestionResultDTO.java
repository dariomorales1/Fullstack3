package cl.fullstack3.msdataingestion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IngestionResultDTO {

    private LocalDateTime executionDate;
    private int totalRecordsProcessed;
    private int totalErrors;
    private List<SourceResult> sourceResults;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SourceResult {
        private String sourceService;
        private String status;
        private int recordsProcessed;
        private String error;
    }
}
