package cl.fullstack3.bff.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestionClient {

    private final WebClient.Builder webClientBuilder;

    public Mono<Object> fetchStatus() {
        return webClientBuilder.build()
                .get()
                .uri("http://ms-data-ingestion/api/ingestion/status")
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-data-ingestion no disponible: {}", ex.getMessage());
                    return Mono.just(Map.of("degraded", true, "message", "Servicio de ingesta no disponible"));
                });
    }

    public Mono<Object> fetchDataBySource(String source) {
        return webClientBuilder.build()
                .get()
                .uri("http://ms-data-ingestion/api/ingestion/data/{source}", source)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-data-ingestion no disponible (source={}): {}", source, ex.getMessage());
                    return Mono.just(Map.of("degraded", true, "source", source));
                });
    }
}
