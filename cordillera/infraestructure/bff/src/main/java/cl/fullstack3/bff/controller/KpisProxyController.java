package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.client.KpisClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
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
}
