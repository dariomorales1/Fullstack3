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

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.Mockito.when;

@SuppressWarnings({"unchecked", "rawtypes"})
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportingClientTest {

    @Mock WebClient.Builder webClientBuilder;
    @Mock WebClient webClient;
    @Mock WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock WebClient.RequestBodySpec requestBodySpec;
    @Mock WebClient.ResponseSpec responseSpec;

    @InjectMocks ReportingClient reportingClient;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.build()).thenReturn(webClient);
    }

    private void mockGetChain() {
        when(webClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Object.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    private void mockPostChain() {
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    void fetchReports_WhenServiceUp_ReturnsData() {
        mockGetChain();
        List<Object> reports = List.of(Map.of("id", 1), Map.of("id", 2));
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(reports));

        StepVerifier.create(reportingClient.fetchReports())
                .expectNextMatches(result -> result.equals(reports))
                .verifyComplete();
    }

    @Test
    void fetchReports_WhenServiceDown_ReturnsFallbackEmptyList() {
        mockGetChain();
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("connection refused")));

        StepVerifier.create(reportingClient.fetchReports())
                .expectNextMatches(result -> result instanceof List && ((List<?>) result).isEmpty())
                .verifyComplete();
    }

    @Test
    void findById_WhenServiceUp_ReturnsReport() {
        mockGetChain();
        Map<String, Object> report = Map.of("id", 1, "tipo", "VENTAS");
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(report));

        StepVerifier.create(reportingClient.findById(1L))
                .expectNextMatches(result -> result.equals(report))
                .verifyComplete();
    }

    @Test
    void findById_WhenServiceDown_ReturnsDegradedFallback() {
        mockGetChain();
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("timeout")));

        StepVerifier.create(reportingClient.findById(1L))
                .expectNextMatches(result -> result instanceof Map &&
                        Boolean.TRUE.equals(((Map<?, ?>) result).get("degraded")))
                .verifyComplete();
    }

    @Test
    void generate_WhenServiceUp_ReturnsResult() {
        mockPostChain();
        Map<String, Object> body = Map.of("tipo", "KPI_MENSUAL");
        Map<String, Object> result = Map.of("id", 99, "tipo", "KPI_MENSUAL");
        when(responseSpec.bodyToMono(Object.class)).thenReturn(Mono.just(result));

        StepVerifier.create(reportingClient.generate(body))
                .expectNextMatches(r -> r.equals(result))
                .verifyComplete();
    }

    @Test
    void generate_WhenServiceDown_ReturnsDegradedFallback() {
        mockPostChain();
        when(responseSpec.bodyToMono(Object.class))
                .thenReturn(Mono.error(new RuntimeException("timeout")));

        StepVerifier.create(reportingClient.generate(Map.of("tipo", "KPI_MENSUAL")))
                .expectNextMatches(result -> result instanceof Map &&
                        Boolean.TRUE.equals(((Map<?, ?>) result).get("degraded")))
                .verifyComplete();
    }
}
