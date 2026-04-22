package cl.fullstack3.msdataingestion.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class SalesClient {

    private final WebClient.Builder webClientBuilder;

    public Mono<String> fetchSales() {
        return webClientBuilder.build()
                .get()
                .uri("http://ms-sales/api/sales")
                .retrieve()
                .bodyToMono(String.class)
                .onErrorReturn("[]");
    }
}
