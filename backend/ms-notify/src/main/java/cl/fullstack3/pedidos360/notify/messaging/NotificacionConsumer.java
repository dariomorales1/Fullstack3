package cl.fullstack3.pedidos360.notify.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * Procesa los comandos de las colas de trabajo. Si ocurre un error, el mensaje
 * se reintenta y, al agotar los intentos, pasa a la DLQ. Incluye idempotencia
 * por eventId para evitar procesar un mensaje dos veces.
 */
@Slf4j
@Component
public class NotificacionConsumer {

    private final Set<String> procesados = ConcurrentHashMap.newKeySet();

    @RabbitListener(queues = RabbitTopologyConfig.Q_EMAIL)
    public void onEmail(CommandEnvelope env) {
        procesar("EMAIL", env, e ->
                log.info("Enviando email al cliente {} (pedido {})", valor(e, "clienteId"), valor(e, "pedidoId")));
    }

    @RabbitListener(queues = RabbitTopologyConfig.Q_KITCHEN)
    public void onKitchen(CommandEnvelope env) {
        procesar("COCINA", env, e ->
                log.info("Imprimiendo ticket de cocina para el pedido {}", valor(e, "pedidoId")));
    }

    @RabbitListener(queues = RabbitTopologyConfig.Q_INVOICE)
    public void onInvoice(CommandEnvelope env) {
        procesar("FACTURA", env, e ->
                log.info("Generando boleta/factura del pedido {}", valor(e, "pedidoId")));
    }

    private void procesar(String canal, CommandEnvelope env, Consumer<CommandEnvelope> accion) {
        if (env.eventId() != null && procesados.contains(env.eventId())) {
            log.warn("[{}] Evento duplicado ignorado (eventId={})", canal, env.eventId());
            return;
        }
        if (esFalloSimulado(env)) {
            // No se marca como procesado: se reintenta y, al agotar intentos, pasa a la DLQ.
            throw new IllegalStateException("Fallo simulado procesando comando " + env.type() + " (eventId=" + env.eventId() + ")");
        }
        accion.accept(env);
        if (env.eventId() != null) {
            // Se marca solo tras procesar con exito, para no bloquear reintentos/DLQ de mensajes fallidos.
            procesados.add(env.eventId());
        }
    }

    private boolean esFalloSimulado(CommandEnvelope env) {
        Map<String, Object> payload = env.payload();
        return payload != null && Boolean.TRUE.equals(payload.get("simularFallo"));
    }

    private Object valor(CommandEnvelope env, String clave) {
        return env.payload() == null ? null : env.payload().get(clave);
    }
}
