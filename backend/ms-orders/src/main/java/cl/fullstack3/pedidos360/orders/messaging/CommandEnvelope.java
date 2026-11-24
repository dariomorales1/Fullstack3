package cl.fullstack3.pedidos360.orders.messaging;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Envoltura comun para todos los comandos enviados por RabbitMQ.
 * Permite trazabilidad e idempotencia (eventId).
 */
public record CommandEnvelope(
        String type,
        String eventId,
        Instant timestamp,
        String traceId,
        String correlationId,
        Map<String, Object> payload
) {
    public static CommandEnvelope nuevo(String type, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        return new CommandEnvelope(type, id, Instant.now(), id, id, payload);
    }
}
