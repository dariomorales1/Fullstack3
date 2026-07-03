package cl.fullstack3.bff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {

    private Integer totalKpis;
    private Integer kpisCumplidos;
    private Integer kpisEnRiesgo;
    private Integer kpisCriticos;
    private Integer totalReportes;
    private String estadoIngestion;
}
