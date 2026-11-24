package cl.fullstack3.pedidos360.orders.messaging;

import cl.fullstack3.pedidos360.orders.domain.EstadoPedido;
import cl.fullstack3.pedidos360.orders.domain.Pedido;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/** Implementacion real que publica a RabbitMQ (exchange cmd.direct). */
@Slf4j
@Component
@ConditionalOnProperty(name = "pedidos360.rabbit.enabled", havingValue = "true", matchIfMissing = true)
public class RabbitNotificacionPublisher implements NotificacionPublisher {

    public static final String RK_EMAIL = "email.send";
    public static final String RK_KITCHEN = "kitchen.ticket";
    public static final String RK_INVOICE = "invoice.gen";

    private final RabbitTemplate rabbitTemplate;

    public RabbitNotificacionPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void notificarPedidoCreado(Pedido pedido) {
        publicar(RK_KITCHEN, "KITCHEN_TICKET", pedido);
        publicar(RK_EMAIL, "EMAIL_CONFIRMACION", pedido);
    }

    @Override
    public void notificarCambioEstado(Pedido pedido) {
        publicar(RK_EMAIL, "EMAIL_ESTADO", pedido);
        if (pedido.getEstado() == EstadoPedido.ENTREGADO) {
            publicar(RK_INVOICE, "INVOICE_GEN", pedido);
        }
    }

    private void publicar(String routingKey, String tipo, Pedido pedido) {
        CommandEnvelope envelope = CommandEnvelope.nuevo(tipo, payload(pedido));
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE_DIRECT, routingKey, envelope);
        log.info("Comando publicado tipo={} routingKey={} pedidoId={} eventId={}",
                tipo, routingKey, pedido.getId(), envelope.eventId());
    }

    private Map<String, Object> payload(Pedido pedido) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("pedidoId", pedido.getId());
        p.put("clienteId", pedido.getClienteId());
        p.put("estado", pedido.getEstado().name());
        p.put("total", pedido.getTotal());
        return p;
    }
}
