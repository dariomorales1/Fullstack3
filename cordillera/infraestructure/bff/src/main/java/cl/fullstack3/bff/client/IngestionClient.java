package cl.fullstack3.bff.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
@Slf4j
public class IngestionClient {

    private final String INGESTION_BASE_URL;
    private final WebClient.Builder webClientBuilder;

    public IngestionClient(WebClient.Builder webClientBuilder,
                            @Value("${services.ms-data-ingestion.url}") String ingestionServiceUrl) {
        this.webClientBuilder = webClientBuilder;
        this.INGESTION_BASE_URL = ingestionServiceUrl + "/api/ingestion";
    }

    public Mono<Object> fetchStatus() {
        return webClientBuilder.build()
                .get()
                .uri(INGESTION_BASE_URL + "/status")
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
                .uri(INGESTION_BASE_URL + "/data/{source}", source)
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-data-ingestion no disponible (source={}): {}", source, ex.getMessage());
                    return Mono.just(Map.of("degraded", true, "source", source));
                });
    }
}
