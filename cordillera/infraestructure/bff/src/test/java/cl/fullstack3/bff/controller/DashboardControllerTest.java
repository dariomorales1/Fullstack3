package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.dto.DashboardDataDTO;
import cl.fullstack3.bff.dto.DashboardSummaryDTO;
import cl.fullstack3.bff.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;

@WebFluxTest(DashboardController.class)
class DashboardControllerTest {

    @Autowired WebTestClient webTestClient;
    @MockitoBean DashboardService dashboardService;

    @Test
    void getDashboard_Returns200WithData() {
        DashboardDataDTO dto = DashboardDataDTO.builder()
                .summary(DashboardSummaryDTO.builder()
                        .totalKpis(2).kpisCumplidos(1).kpisEnRiesgo(1)
                        .kpisCriticos(0).totalReportes(3).estadoIngestion("SUCCESS")
                        .build())
                .kpis(List.of())
                .degraded(false)
                .serviciosDegradados(List.of())
                .generatedAt(LocalDateTime.now())
                .build();

        when(dashboardService.getDashboardData()).thenReturn(Mono.just(dto));

        webTestClient.get()
                .uri("/api/dashboard")
                .exchange()
                .expectStatus().isOk()
                .expectBody(DashboardDataDTO.class)
                .value(result -> {
                    assert !result.isDegraded();
                    assert result.getSummary().getTotalKpis() == 2;
                });
    }

    @Test
    void getDashboard_WhenServiceDegraded_Returns200WithDegradedFlag() {
        DashboardDataDTO dto = DashboardDataDTO.builder()
                .summary(DashboardSummaryDTO.builder()
                        .totalKpis(0).estadoIngestion("DEGRADADO").build())
                .kpis(List.of())
                .degraded(true)
                .serviciosDegradados(List.of("ms-kpis"))
                .generatedAt(LocalDateTime.now())
                .build();

        when(dashboardService.getDashboardData()).thenReturn(Mono.just(dto));

        webTestClient.get()
                .uri("/api/dashboard")
                .exchange()
                .expectStatus().isOk()
                .expectBody(DashboardDataDTO.class)
                .value(result -> {
                    assert result.isDegraded();
                    assert result.getServiciosDegradados().contains("ms-kpis");
                });
    }
}
