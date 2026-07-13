package cl.fullstack3.bff.client;

import cl.fullstack3.bff.dto.KpiDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class KpisClient {

    private final String KPIS_BASE_URL;
    private final WebClient.Builder webClientBuilder;

    public KpisClient(WebClient.Builder webClientBuilder,
                       @Value("${services.ms-kpis.url}") String kpisServiceUrl) {
        this.webClientBuilder = webClientBuilder;
        this.KPIS_BASE_URL = kpisServiceUrl + "/api/kpis";
    }

    public Mono<List<KpiDTO>> fetchAllKpis() {
        return webClientBuilder.build()
                .get()
                .uri(KPIS_BASE_URL)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<KpiDTO>>() {})
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-kpis no disponible: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    public Mono<Object> fetchRaw() {
        return webClientBuilder.build()
                .get()
                .uri(KPIS_BASE_URL)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-kpis no disponible: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    public Mono<Object> findById(Long id) {
        return webClientBuilder.build()
                .get()
                .uri(KPIS_BASE_URL + "/{id}", id)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-kpis no disponible (id={}): {}", id, ex.getMessage());
                    return Mono.just(Collections.emptyMap());
                });
    }

    public Mono<Object> getLatestResult(Long id) {
        return webClientBuilder.build()
                .get()
                .uri(KPIS_BASE_URL + "/{id}/resultado", id)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("resultado KPI no disponible (id={}): {}", id, ex.getMessage());
                    return Mono.just(Collections.emptyMap());
                });
    }

    public Mono<Object> findByPeriod(Long periodoId) {
        return webClientBuilder.build()
                .get()
                .uri(KPIS_BASE_URL + "/periodo/{periodoId}", periodoId)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("resultados KPI no disponibles (periodo={}): {}", periodoId, ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }
}
