package cl.fullstack3.bff.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportingClient {

    private static final String REPORTING_BASE_URL = "http://host.docker.internal:8092/api/reports";

    private final WebClient.Builder webClientBuilder;

    public Mono<Object> fetchReports() {
        return webClientBuilder.build()
                .get()
                .uri(REPORTING_BASE_URL)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-reporting no disponible: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    public Mono<Object> findById(Long id) {
        return webClientBuilder.build()
                .get()
                .uri(REPORTING_BASE_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-reporting no disponible (id={}): {}", id, ex.getMessage());
                    return Mono.just(Map.of("degraded", true, "message", "Servicio de reportes no disponible"));
                });
    }

    public Mono<Object> generate(Object body) {
        return webClientBuilder.build()
                .post()
                .uri(REPORTING_BASE_URL + "/generate")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(10))
                .onErrorResume(ex -> {
                    log.warn("Error generando reporte: {}", ex.getMessage());
                    return Mono.just(Map.of("degraded", true, "message", "No se pudo generar el reporte"));
                });
    }
}
