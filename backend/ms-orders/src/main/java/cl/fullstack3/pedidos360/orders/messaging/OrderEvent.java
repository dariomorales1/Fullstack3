package cl.fullstack3.pedidos360.orders.messaging;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Evento de negocio publicado al topico Kafka orders.events.
 * Es la "fuente de verdad" para reporteria y auditoria.
 */
public record OrderEvent(
        String eventType,
        Long pedidoId,
        String clienteId,
        String estado,
        BigDecimal total,
        Instant ocurridoEn
) {
}
