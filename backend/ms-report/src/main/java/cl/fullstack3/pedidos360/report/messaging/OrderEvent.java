package cl.fullstack3.pedidos360.report.messaging;

import java.math.BigDecimal;
import java.time.Instant;

/** Evento consumido desde orders.events (misma forma que el publicado por ms-orders). */
public record OrderEvent(
        String eventType,
        Long pedidoId,
        String clienteId,
        String estado,
        BigDecimal total,
        Instant ocurridoEn
) {
}
