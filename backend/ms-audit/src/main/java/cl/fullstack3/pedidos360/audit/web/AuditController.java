package cl.fullstack3.pedidos360.audit.web;

import cl.fullstack3.pedidos360.audit.service.AuditoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Auditoria", description = "Timeline de eventos de negocio (solo lectura)")
public class AuditController {

    private final AuditoriaService auditoriaService;

    public AuditController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping("/events")
    @Operation(summary = "Consultar la timeline con filtros opcionales (cliente, tipo, rango de fechas)")
    public List<AuditoriaResponse> eventos(
            @RequestParam(required = false) String clienteId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        Instant desde = parsear(from, "from");
        Instant hasta = parsear(to, "to");
        return auditoriaService.buscar(clienteId, eventType, desde, hasta).stream()
                .map(AuditoriaResponse::desde).toList();
    }

    private Instant parsear(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(valor);
        } catch (Exception ex) {
            throw new IllegalArgumentException(
                    "El parametro '" + campo + "' debe ser una fecha ISO-8601 (ej: 2025-11-24T10:00:00Z)");
        }
    }
}
