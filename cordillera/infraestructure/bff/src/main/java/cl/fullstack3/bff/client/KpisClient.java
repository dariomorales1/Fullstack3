package cl.fullstack3.bff.client;

import cl.fullstack3.bff.dto.KpiDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpisClient {

    private final WebClient.Builder webClientBuilder;

    public Mono<List<KpiDTO>> fetchAllKpis() {
        return webClientBuilder.build()
                .get()
                .uri("http://ms-kpis/api/kpis")
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
                .uri("http://ms-kpis/api/kpis")
                .retrieve()
                .bodyToMono(Object.class)
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(ex -> {
                    log.warn("ms-kpis no disponible: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }
}
