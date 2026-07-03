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

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.Mockito.when;

@SuppressWarnings({"unchecked", "rawtypes"})
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class KpisClientTest {

    @Mock WebClient.Builder webClientBuilder;
    @Mock WebClient webClient;
    @Mock WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock WebClient.ResponseSpec responseSpec;

    @InjectMocks KpisClient kpisClient;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.build()).thenReturn(webClient);
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    void fetchRaw_WhenServiceUp_ReturnsData() {
        List<Object> data = List.of("kpi1", "kpi2");
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(data));

        StepVerifier.create(kpisClient.fetchRaw())
                .expectNextMatches(result -> result.equals(data))
                .verifyComplete();
    }

    @Test
    void fetchRaw_WhenServiceDown_ReturnsFallbackEmptyList() {
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("connection refused")));

        StepVerifier.create(kpisClient.fetchRaw())
                .expectNextMatches(result -> result instanceof List && ((List<?>) result).isEmpty())
                .verifyComplete();
    }

    @Test
    void findById_WhenServiceUp_ReturnsData() {
        Object kpi = Collections.singletonMap("id", 1);
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(kpi));

        StepVerifier.create(kpisClient.findById(1L))
                .expectNextMatches(result -> result.equals(kpi))
                .verifyComplete();
    }

    @Test
    void findById_WhenServiceDown_ReturnsFallbackEmptyMap() {
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("timeout")));

        StepVerifier.create(kpisClient.findById(1L))
                .expectNextMatches(result -> result instanceof java.util.Map && ((java.util.Map<?, ?>) result).isEmpty())
                .verifyComplete();
    }

    @Test
    void getLatestResult_WhenServiceDown_ReturnsFallback() {
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("timeout")));

        StepVerifier.create(kpisClient.getLatestResult(1L))
                .expectNextMatches(result -> result instanceof java.util.Map)
                .verifyComplete();
    }

    @Test
    void findByPeriod_WhenServiceDown_ReturnsFallbackEmptyList() {
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("timeout")));

        StepVerifier.create(kpisClient.findByPeriod(5L))
                .expectNextMatches(result -> result instanceof List && ((List<?>) result).isEmpty())
                .verifyComplete();
    }
}
