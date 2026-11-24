package cl.fullstack3.pedidos360.orders.messaging;

import cl.fullstack3.pedidos360.orders.domain.Pedido;

/** Publica eventos de negocio del pedido al topico Kafka. */
public interface OrderEventPublisher {

    void publicar(Pedido pedido, String eventType);
}
