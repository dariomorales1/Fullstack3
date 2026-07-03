package cl.fullstack3.msreporting.controller;

import cl.fullstack3.msreporting.dto.GenerarReporteRequestDTO;
import cl.fullstack3.msreporting.dto.ReporteResponseDTO;
import cl.fullstack3.msreporting.service.IReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReporteController {

    private final IReporteService reporteService;

    @GetMapping
    public ResponseEntity<List<ReporteResponseDTO>> findAll() {
        return ResponseEntity.ok(reporteService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReporteResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(reporteService.findById(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<ReporteResponseDTO> generate(@RequestBody GenerarReporteRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reporteService.generate(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reporteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<ReporteResponseDTO>> findByTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(reporteService.findByTipo(tipo));
    }
}
