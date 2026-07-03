package cl.fullstack3.bff.controller;

import cl.fullstack3.bff.dto.DashboardDataDTO;
import cl.fullstack3.bff.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public Mono<DashboardDataDTO> getDashboard() {
        return dashboardService.getDashboardData();
    }
}
