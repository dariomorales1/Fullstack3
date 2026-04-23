package cl.fullstack3.bff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDataDTO {

    private DashboardSummaryDTO summary;
    private List<KpiDTO> kpis;
    private Object reportesRecientes;
    private Object estadoIngestion;
    private boolean degraded;
    private List<String> serviciosDegradados;
    private LocalDateTime generatedAt;
}
