package cl.fullstack3.pedidos360.orders.messaging;

import cl.fullstack3.pedidos360.orders.domain.Pedido;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Publisher inactivo para cuando Kafka esta deshabilitado (ej. tests). */
@Slf4j
@Component
@ConditionalOnProperty(name = "pedidos360.kafka.enabled", havingValue = "false")
public class NoOpOrderEventPublisher implements OrderEventPublisher {

    @Override
    public void publicar(Pedido pedido, String eventType) {
        log.debug("Kafka deshabilitado: se omite evento {} del pedido {}", eventType, pedido.getId());
    }
}
