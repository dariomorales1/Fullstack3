package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.client.KpisClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;

@WebFluxTest(KpisProxyController.class)
class KpisProxyControllerTest {

    @Autowired WebTestClient webTestClient;
    @MockitoBean KpisClient kpisClient;

    @Test
    void findAll_Returns200() {
        when(kpisClient.fetchRaw()).thenReturn(Mono.just(List.of(Map.of("id", 1))));

        webTestClient.get()
                .uri("/api/kpis")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void findById_Returns200() {
        when(kpisClient.findById(1L)).thenReturn(Mono.just(Map.of("id", 1, "codigo", "KPI-001")));

        webTestClient.get()
                .uri("/api/kpis/1")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void getLatestResult_Returns200() {
        when(kpisClient.getLatestResult(1L)).thenReturn(Mono.just(Map.of("valor", 95.0)));

        webTestClient.get()
                .uri("/api/kpis/1/resultado")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void findByPeriod_Returns200() {
        when(kpisClient.findByPeriod(5L)).thenReturn(Mono.just(List.of(Map.of("id", 1))));

        webTestClient.get()
                .uri("/api/kpis/periodo/5")
                .exchange()
                .expectStatus().isOk();
    }
}
