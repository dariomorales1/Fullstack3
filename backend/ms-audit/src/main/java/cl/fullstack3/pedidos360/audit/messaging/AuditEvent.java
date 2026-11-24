package cl.fullstack3.pedidos360.audit.messaging;

import java.math.BigDecimal;
import java.time.Instant;

/** Evento publicado al topico audit.timeline. */
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
