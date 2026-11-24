package cl.fullstack3.pedidos360.orders.messaging;

import cl.fullstack3.pedidos360.orders.domain.Pedido;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Publisher inactivo: se usa cuando RabbitMQ esta deshabilitado (ej. tests). */
@Slf4j
@Component
@ConditionalOnProperty(name = "pedidos360.rabbit.enabled", havingValue = "false")
public class NoOpNotificacionPublisher implements NotificacionPublisher {

    @Override
    public void notificarPedidoCreado(Pedido pedido) {
        log.debug("RabbitMQ deshabilitado: se omite notificacion de creacion (pedido {})", pedido.getId());
    }

    @Override
    public void notificarCambioEstado(Pedido pedido) {
        log.debug("RabbitMQ deshabilitado: se omite notificacion de cambio de estado (pedido {})", pedido.getId());
    }
}
