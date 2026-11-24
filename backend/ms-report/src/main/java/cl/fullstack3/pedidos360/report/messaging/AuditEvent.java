package cl.fullstack3.pedidos360.report.messaging;

import java.math.BigDecimal;
import java.time.Instant;

/** Evento consumido desde audit.timeline (publicado por ms-audit). */
public record AuditEvent(
        String eventType,
        Long pedidoId,
        String clienteId,
        String estado,
        BigDecimal total,
        Instant ocurridoEn,
        Instant auditadoEn
) {
}
