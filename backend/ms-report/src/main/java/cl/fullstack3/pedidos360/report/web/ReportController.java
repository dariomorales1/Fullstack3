package cl.fullstack3.pedidos360.report.web;

import cl.fullstack3.pedidos360.report.service.KpiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/report")
@Tag(name = "Reporteria", description = "KPIs en tiempo real a partir de eventos Kafka")
public class ReportController {

    private final KpiService kpiService;

    public ReportController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @GetMapping("/kpis")
    @Operation(summary = "Obtener KPIs agregados (eventos por tipo, ventas, pedidos por hora)")
    public Map<String, Object> kpis(@RequestParam(required = false) String range) {
        return kpiService.kpis();
    }
}
