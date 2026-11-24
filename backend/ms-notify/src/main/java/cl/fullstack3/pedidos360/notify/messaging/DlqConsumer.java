package cl.fullstack3.pedidos360.notify.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Registra en logs los mensajes que no pudieron entregarse y quedaron en las DLQ.
 */
@Slf4j
@Component
public class DlqConsumer {

    @RabbitListener(queues = RabbitTopologyConfig.Q_EMAIL_DLQ)
    public void onEmailDlq(CommandEnvelope env) {
        registrar("q.cmd.email.dlq", env);
    }

    @RabbitListener(queues = RabbitTopologyConfig.Q_KITCHEN_DLQ)
    public void onKitchenDlq(CommandEnvelope env) {
        registrar("q.cmd.kitchen.dlq", env);
    }

    @RabbitListener(queues = RabbitTopologyConfig.Q_INVOICE_DLQ)
    public void onInvoiceDlq(CommandEnvelope env) {
        registrar("q.cmd.invoice.dlq", env);
    }

    private void registrar(String cola, CommandEnvelope env) {
        log.error("Mensaje no entregado en {} -> type={} eventId={} payload={}",
                cola, env.type(), env.eventId(), env.payload());
    }
}
