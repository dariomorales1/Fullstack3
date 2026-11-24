package cl.fullstack3.pedidos360.audit.messaging;

import java.math.BigDecimal;
import java.time.Instant;

/** Evento consumido desde orders.events. */
public record OrderEvent(
        String eventType,
        Long pedidoId,
        String clienteId,
        String estado,
        BigDecimal total,
        Instant ocurridoEn
) {
}
