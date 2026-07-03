package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.client.ReportingClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebFluxTest(ReportsProxyController.class)
class ReportsProxyControllerTest {

    @Autowired WebTestClient webTestClient;
    @MockitoBean ReportingClient reportingClient;

    @Test
    void findAll_Returns200() {
        when(reportingClient.fetchReports()).thenReturn(Mono.just(List.of(Map.of("id", 1))));

        webTestClient.get()
                .uri("/api/reports")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void findById_Returns200() {
        when(reportingClient.findById(1L)).thenReturn(Mono.just(Map.of("id", 1, "tipo", "VENTAS")));

        webTestClient.get()
                .uri("/api/reports/1")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void generate_Returns200() {
        when(reportingClient.generate(any())).thenReturn(Mono.just(Map.of("id", 99, "tipo", "KPI_MENSUAL")));

        webTestClient.post()
                .uri("/api/reports/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("tipo", "KPI_MENSUAL"))
                .exchange()
                .expectStatus().isOk();
    }
}
