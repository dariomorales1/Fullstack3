package cl.fullstack3.msreporting.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpisClient {

    private final WebClient.Builder webClientBuilder;

    public String fetchAllKpis() {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://ms-kpis/api/kpis")
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorReturn("[]")
                    .block();
        } catch (Exception e) {
            log.warn("Error consultando ms-kpis: {}", e.getMessage());
            return "[]";
        }
    }

    public String fetchResultadosByPeriodo(Long periodoId) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://ms-kpis/api/kpis/periodo/{periodoId}", periodoId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorReturn("[]")
                    .block();
        } catch (Exception e) {
            log.warn("Error consultando resultados de ms-kpis (periodoId={}): {}", periodoId, e.getMessage());
            return "[]";
        }
    }
}
