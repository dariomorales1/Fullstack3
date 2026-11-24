package cl.fullstack3.pedidos360.notify.messaging;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NotificacionConsumerTest {

    private final NotificacionConsumer consumer = new NotificacionConsumer();

    private CommandEnvelope envelope(String eventId, Map<String, Object> payload) {
        return new CommandEnvelope("EMAIL_ESTADO", eventId, Instant.now(), eventId, eventId, payload);
    }

    @Test
    void procesaMensajeNormalSinError() {
        CommandEnvelope env = envelope("evt-1", Map.of("pedidoId", 1, "clienteId", "demo@cl"));
        assertThatCode(() -> consumer.onEmail(env)).doesNotThrowAnyException();
    }

    @Test
    void mensajeDuplicadoSeIgnora() {
        CommandEnvelope env = envelope("evt-2", Map.of("pedidoId", 1));
        consumer.onEmail(env);
        // El segundo con el mismo eventId no debe fallar ni reprocesar
        assertThatCode(() -> consumer.onEmail(env)).doesNotThrowAnyException();
    }

    @Test
    void falloSimuladoLanzaExcepcion() {
        CommandEnvelope env = envelope("evt-3", Map.of("pedidoId", 1, "simularFallo", true));
        assertThatThrownBy(() -> consumer.onEmail(env))
                .isInstanceOf(IllegalStateException.class);
    }
}
