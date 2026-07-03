package cl.fullstack3.bff.service;

import cl.fullstack3.bff.client.IngestionClient;
import cl.fullstack3.bff.client.KpisClient;
import cl.fullstack3.bff.client.ReportingClient;
import cl.fullstack3.bff.dto.DashboardDataDTO;
import cl.fullstack3.bff.dto.KpiDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    private KpisClient kpisClient;
    private ReportingClient reportingClient;
    private IngestionClient ingestionClient;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        kpisClient = mock(KpisClient.class);
        reportingClient = mock(ReportingClient.class);
        ingestionClient = mock(IngestionClient.class);
        service = new DashboardService(kpisClient, reportingClient, ingestionClient, new ObjectMapper());
    }

    @Test
    void getDashboardData_conTodosLosServiciosOk_agregaSummary() {
        List<KpiDTO> kpis = List.of(
                KpiDTO.builder().codigo("KPI-001").estado("CUMPLIDO").valorReal(new BigDecimal("100")).build(),
                KpiDTO.builder().codigo("KPI-002").estado("EN_RIESGO").valorReal(new BigDecimal("60")).build(),
                KpiDTO.builder().codigo("KPI-003").estado("CRITICO").valorReal(new BigDecimal("20")).build()
        );
        when(kpisClient.fetchAllKpis()).thenReturn(Mono.just(kpis));
        when(reportingClient.fetchReports()).thenReturn(Mono.just(List.of(Map.of("id", 1), Map.of("id", 2))));
        when(ingestionClient.fetchStatus()).thenReturn(Mono.just(Map.of("status", "SUCCESS")));

        StepVerifier.create(service.getDashboardData())
                .assertNext(dashboard -> {
                    assert dashboard.getKpis().size() == 3;
                    assert dashboard.getSummary().getTotalKpis() == 3;
                    assert dashboard.getSummary().getKpisCumplidos() == 1;
                    assert dashboard.getSummary().getKpisEnRiesgo() == 1;
                    assert dashboard.getSummary().getKpisCriticos() == 1;
                    assert dashboard.getSummary().getTotalReportes() == 2;
                    assert "SUCCESS".equals(dashboard.getSummary().getEstadoIngestion());
                    assert !dashboard.isDegraded();
                    assert dashboard.getServiciosDegradados().isEmpty();
                })
                .verifyComplete();
    }

    @Test
    void getDashboardData_conKpisCaidos_marcaDegraded() {
        when(kpisClient.fetchAllKpis()).thenReturn(Mono.just(List.of()));
        when(reportingClient.fetchReports()).thenReturn(Mono.just(List.of()));
        when(ingestionClient.fetchStatus()).thenReturn(Mono.just(Map.of("status", "SUCCESS")));

        StepVerifier.create(service.getDashboardData())
                .assertNext(dashboard -> {
                    assert dashboard.isDegraded();
                    assert dashboard.getServiciosDegradados().contains("ms-kpis");
                })
                .verifyComplete();
    }

    @Test
    void getDashboardData_conIngestionDegraded_marcaServicioYEstado() {
        when(kpisClient.fetchAllKpis()).thenReturn(Mono.just(List.of(
                KpiDTO.builder().codigo("KPI-001").estado("CUMPLIDO").build()
        )));
        when(reportingClient.fetchReports()).thenReturn(Mono.just(List.of()));
        when(ingestionClient.fetchStatus()).thenReturn(Mono.just(Map.of("degraded", true)));

        StepVerifier.create(service.getDashboardData())
                .assertNext(dashboard -> {
                    assert dashboard.isDegraded();
                    assert dashboard.getServiciosDegradados().contains("ms-data-ingestion");
                    assert "DEGRADADO".equals(dashboard.getSummary().getEstadoIngestion());
                })
                .verifyComplete();
    }
}
