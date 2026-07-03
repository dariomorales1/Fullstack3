package cl.fullstack3.bff.service;

import cl.fullstack3.bff.client.IngestionClient;
import cl.fullstack3.bff.client.KpisClient;
import cl.fullstack3.bff.client.ReportingClient;
import cl.fullstack3.bff.dto.DashboardDataDTO;
import cl.fullstack3.bff.dto.DashboardSummaryDTO;
import cl.fullstack3.bff.dto.KpiDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final KpisClient kpisClient;
    private final ReportingClient reportingClient;
    private final IngestionClient ingestionClient;
    private final ObjectMapper objectMapper;

    public Mono<DashboardDataDTO> getDashboardData() {
        return Mono.zip(
                        kpisClient.fetchAllKpis(),
                        reportingClient.fetchReports(),
                        ingestionClient.fetchStatus()
                )
                .map(tuple -> construirDashboard(tuple.getT1(), tuple.getT2(), tuple.getT3()))
                .doOnNext(d -> log.info("Dashboard generado con {} KPIs, degraded={}",
                        d.getKpis().size(), d.isDegraded()));
    }

    private DashboardDataDTO construirDashboard(List<KpiDTO> kpis, Object reportes, Object ingestion) {
        List<String> degradados = new ArrayList<>();
        if (kpis.isEmpty()) degradados.add("ms-kpis");
        if (esDegraded(reportes)) degradados.add("ms-reporting");
        if (esDegraded(ingestion)) degradados.add("ms-data-ingestion");

        DashboardSummaryDTO summary = DashboardSummaryDTO.builder()
                .totalKpis(kpis.size())
                .kpisCumplidos(contarPorEstado(kpis, "CUMPLIDO"))
                .kpisEnRiesgo(contarPorEstado(kpis, "EN_RIESGO"))
                .kpisCriticos(contarPorEstado(kpis, "CRITICO"))
                .totalReportes(contarLista(reportes))
                .estadoIngestion(extraerEstadoIngestion(ingestion))
                .build();

        return DashboardDataDTO.builder()
                .summary(summary)
                .kpis(kpis)
                .reportesRecientes(reportes)
                .estadoIngestion(ingestion)
                .degraded(!degradados.isEmpty())
                .serviciosDegradados(degradados)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private int contarPorEstado(List<KpiDTO> kpis, String estado) {
        return (int) kpis.stream()
                .filter(k -> estado.equalsIgnoreCase(k.getEstado()))
                .count();
    }

    private int contarLista(Object reportes) {
        if (reportes instanceof List<?> list) return list.size();
        return 0;
    }

    private boolean esDegraded(Object payload) {
        if (payload instanceof Map<?, ?> map) {
            Object flag = map.get("degraded");
            return Boolean.TRUE.equals(flag);
        }
        return false;
    }

    private String extraerEstadoIngestion(Object ingestion) {
        if (ingestion instanceof Map<?, ?> map) {
            Object status = map.get("status");
            if (status != null) return status.toString();
            if (Boolean.TRUE.equals(map.get("degraded"))) return "DEGRADADO";
        }
        return "DESCONOCIDO";
    }
}
