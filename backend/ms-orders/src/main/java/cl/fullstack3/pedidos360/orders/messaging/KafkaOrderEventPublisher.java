package cl.fullstack3.pedidos360.orders.messaging;

import cl.fullstack3.pedidos360.orders.domain.Pedido;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Publica eventos a Kafka usando la clave del pedido para distribuir por particiones. */
@Slf4j
@Component
@ConditionalOnProperty(name = "pedidos360.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaOrderEventPublisher implements OrderEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaOrderEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public void publicar(Pedido pedido, String eventType) {
        OrderEvent evento = new OrderEvent(
                eventType, pedido.getId(), pedido.getClienteId(),
                pedido.getEstado().name(), pedido.getTotal(), Instant.now());
        kafkaTemplate.send(KafkaTopicsConfig.TOPIC_ORDERS, String.valueOf(pedido.getId()), evento);
        log.info("Evento Kafka publicado type={} pedidoId={} topic={}",
                eventType, pedido.getId(), KafkaTopicsConfig.TOPIC_ORDERS);
    }
}
