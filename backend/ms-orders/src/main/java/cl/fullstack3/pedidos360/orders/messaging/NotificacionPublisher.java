package cl.fullstack3.pedidos360.orders.messaging;

import cl.fullstack3.pedidos360.orders.domain.Pedido;

/** Publica comandos de notificacion hacia RabbitMQ. */
public interface NotificacionPublisher {

    void notificarPedidoCreado(Pedido pedido);

    void notificarCambioEstado(Pedido pedido);
}
