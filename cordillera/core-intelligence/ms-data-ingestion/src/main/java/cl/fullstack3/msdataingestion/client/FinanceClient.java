package cl.fullstack3.msdataingestion.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class FinanceClient {

    private final WebClient.Builder webClientBuilder;

    public Mono<String> fetchFinance() {
        return webClientBuilder.build()
                .get()
                .uri("http://ms-finance/api/finance/movimientos")
                .retrieve()
                .bodyToMono(String.class)
                .onErrorReturn("[]");
    }
}
