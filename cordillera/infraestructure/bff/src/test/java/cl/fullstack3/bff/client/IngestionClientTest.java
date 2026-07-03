package cl.fullstack3.bff.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.Mockito.when;

@SuppressWarnings({"unchecked", "rawtypes"})
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IngestionClientTest {

    @Mock WebClient.Builder webClientBuilder;
    @Mock WebClient webClient;
    @Mock WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock WebClient.ResponseSpec responseSpec;

    @InjectMocks IngestionClient ingestionClient;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    void fetchStatus_WhenServiceUp_ReturnsStatus() {
        Map<String, Object> status = Map.of("status", "SUCCESS", "processed", 100);
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(status));

        StepVerifier.create(ingestionClient.fetchStatus())
                .expectNextMatches(result -> result.equals(status))
                .verifyComplete();
    }

    @Test
    void fetchStatus_WhenServiceDown_ReturnsDegradedFallback() {
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("connection refused")));

        StepVerifier.create(ingestionClient.fetchStatus())
                .expectNextMatches(result -> result instanceof Map &&
                        Boolean.TRUE.equals(((Map<?, ?>) result).get("degraded")))
                .verifyComplete();
    }

    @Test
    void fetchDataBySource_WhenServiceUp_ReturnsData() {
        Map<String, Object> data = Map.of("source", "SALES", "records", 50);
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(data));

        StepVerifier.create(ingestionClient.fetchDataBySource("SALES"))
                .expectNextMatches(result -> result.equals(data))
                .verifyComplete();
    }

    @Test
    void fetchDataBySource_WhenServiceDown_ReturnsDegradedFallback() {
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("timeout")));

        StepVerifier.create(ingestionClient.fetchDataBySource("INVENTORY"))
                .expectNextMatches(result -> result instanceof Map &&
                        Boolean.TRUE.equals(((Map<?, ?>) result).get("degraded")))
                .verifyComplete();
    }
}
