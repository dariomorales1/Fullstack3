package cl.fullstack3.mskpis.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestionClient {

    private final WebClient.Builder webClientBuilder;

    public String fetchDataBySource(String sourceService) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://ms-data-ingestion/api/ingestion/data/{source}", sourceService)
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorReturn("[]")
                    .block();
        } catch (Exception e) {
            log.warn("Error consultando ms-data-ingestion para source={}: {}", sourceService, e.getMessage());
            return "[]";
        }
    }

    public String fetchStatus() {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("http://ms-data-ingestion/api/ingestion/status")
                    .retrieve()
                    .bodyToMono(String.class)
                    .onErrorReturn("{}")
                    .block();
        } catch (Exception e) {
            log.warn("Error consultando status de ms-data-ingestion: {}", e.getMessage());
            return "{}";
        }
    }
}
