package cl.fullstack3.pedidos360.notify.messaging;

import java.time.Instant;
import java.util.Map;

/** Envoltura comun de comandos (debe coincidir con la de ms-orders). */
public record CommandEnvelope(
        String type,
        String eventId,
        Instant timestamp,
        String traceId,
        String correlationId,
        Map<String, Object> payload
) {
}
