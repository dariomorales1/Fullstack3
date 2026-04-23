package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.client.ReportingClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportsProxyController {

    private final ReportingClient reportingClient;

    @GetMapping
    public Mono<Object> findAll() {
        return reportingClient.fetchReports();
    }

    @GetMapping("/{id}")
    public Mono<Object> findById(@PathVariable Long id) {
        return reportingClient.findById(id);
    }

    @PostMapping("/generate")
    public Mono<Object> generate(@RequestBody Object body) {
        return reportingClient.generate(body);
    }
}
