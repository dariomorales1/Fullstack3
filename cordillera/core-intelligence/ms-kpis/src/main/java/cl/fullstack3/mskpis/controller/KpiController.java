package cl.fullstack3.mskpis.controller;

import cl.fullstack3.mskpis.dto.CalculoKpiRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorRequestDTO;
import cl.fullstack3.mskpis.dto.IndicadorResponseDTO;
import cl.fullstack3.mskpis.dto.ResultadoResponseDTO;
import cl.fullstack3.mskpis.service.IKpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
public class KpiController {

    private final IKpiService kpiService;

    @GetMapping
    public ResponseEntity<List<IndicadorResponseDTO>> findAll() {
        return ResponseEntity.ok(kpiService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IndicadorResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.findById(id));
    }

    @PostMapping
    public ResponseEntity<IndicadorResponseDTO> create(@RequestBody IndicadorRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kpiService.create(dto));
    }

    @PostMapping("/calcular")
    public ResponseEntity<ResultadoResponseDTO> calcular(@RequestBody CalculoKpiRequestDTO request) {
        return ResponseEntity.ok(kpiService.calcular(request));
    }

    @GetMapping("/{id}/resultado")
    public ResponseEntity<ResultadoResponseDTO> getUltimoResultado(@PathVariable Long id) {
        return ResponseEntity.ok(kpiService.getUltimoResultado(id));
    }

    @GetMapping("/periodo/{periodoId}")
    public ResponseEntity<List<ResultadoResponseDTO>> findByPeriodo(@PathVariable Long periodoId) {
        return ResponseEntity.ok(kpiService.findResultadosByPeriodo(periodoId));
    }
}
