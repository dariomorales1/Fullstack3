package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.client.KpisClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
public class KpisProxyController {

    private final KpisClient kpisClient;

    @GetMapping
    public Mono<Object> findAll() {
        return kpisClient.fetchRaw();
    }

    @GetMapping("/{id}")
    public Mono<Object> findById(@PathVariable Long id) {
        return kpisClient.findById(id);
    }

    @GetMapping("/{id}/resultado")
    public Mono<Object> getLatestResult(@PathVariable Long id) {
        return kpisClient.getLatestResult(id);
    }

    @GetMapping("/periodo/{periodoId}")
    public Mono<Object> findByPeriod(@PathVariable Long periodoId) {
        return kpisClient.findByPeriod(periodoId);
    }
}
