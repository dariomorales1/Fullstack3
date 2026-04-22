package cl.fullstack3.msdataingestion.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ingestion_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IngestionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_date", nullable = false)
    private LocalDateTime executionDate;

    @Column(name = "records_processed")
    private Integer recordsProcessed;

    @Column
    private Integer errors;

    @Column(name = "source_service", length = 50)
    private String sourceService;

    @Column(length = 30)
    private String status;

    @PrePersist
    protected void onCreate() {
        if (executionDate == null) executionDate = LocalDateTime.now();
    }
}
