package cl.fullstack3.msdataingestion.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class CustomerClient {

    private final WebClient.Builder webClientBuilder;

    public Mono<String> fetchCustomers() {
        return webClientBuilder.build()
                .get()
                .uri("http://ms-customer/api/customers")
                .retrieve()
                .bodyToMono(String.class)
                .onErrorReturn("[]");
    }
}
