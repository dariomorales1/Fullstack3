package cl.fullstack3.pedidos360.notify.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declara la topologia RabbitMQ del caso Pedidos360:
 * 3 colas de trabajo (email/cocina/factura), cada una con su DLQ,
 * y los exchanges direct, topic y de dead-letter.
 */
@Configuration
public class RabbitTopologyConfig {

    public static final String EXCHANGE_DIRECT = "cmd.direct";
    public static final String EXCHANGE_TOPIC = "cmd.topic";
    public static final String EXCHANGE_DLX = "cmd.dead.dlx";

    public static final String Q_EMAIL = "q.cmd.email";
    public static final String Q_KITCHEN = "q.cmd.kitchen";
    public static final String Q_INVOICE = "q.cmd.invoice";
    public static final String Q_EMAIL_DLQ = "q.cmd.email.dlq";
    public static final String Q_KITCHEN_DLQ = "q.cmd.kitchen.dlq";
    public static final String Q_INVOICE_DLQ = "q.cmd.invoice.dlq";

    public static final String RK_EMAIL = "email.send";
    public static final String RK_KITCHEN = "kitchen.ticket";
    public static final String RK_INVOICE = "invoice.gen";

    // ---------- Exchanges ----------
    @Bean
    DirectExchange cmdDirect() {
        return ExchangeBuilder.directExchange(EXCHANGE_DIRECT).durable(true).build();
    }

    @Bean
    TopicExchange cmdTopic() {
        return ExchangeBuilder.topicExchange(EXCHANGE_TOPIC).durable(true).build();
    }

    @Bean
    DirectExchange cmdDeadDlx() {
        return ExchangeBuilder.directExchange(EXCHANGE_DLX).durable(true).build();
    }

    // ---------- Colas principales (con dead-letter) ----------
    @Bean
    Queue qEmail() {
        return QueueBuilder.durable(Q_EMAIL)
                .deadLetterExchange(EXCHANGE_DLX).deadLetterRoutingKey(RK_EMAIL).build();
    }

    @Bean
    Queue qKitchen() {
        return QueueBuilder.durable(Q_KITCHEN)
                .deadLetterExchange(EXCHANGE_DLX).deadLetterRoutingKey(RK_KITCHEN).build();
    }

    @Bean
    Queue qInvoice() {
        return QueueBuilder.durable(Q_INVOICE)
                .deadLetterExchange(EXCHANGE_DLX).deadLetterRoutingKey(RK_INVOICE).build();
    }

    // ---------- Colas DLQ ----------
    @Bean
    Queue qEmailDlq() {
        return QueueBuilder.durable(Q_EMAIL_DLQ).build();
    }

    @Bean
    Queue qKitchenDlq() {
        return QueueBuilder.durable(Q_KITCHEN_DLQ).build();
    }

    @Bean
    Queue qInvoiceDlq() {
        return QueueBuilder.durable(Q_INVOICE_DLQ).build();
    }

    // ---------- Bindings exchange direct ----------
    @Bean
    Binding bEmailDirect() {
        return BindingBuilder.bind(qEmail()).to(cmdDirect()).with(RK_EMAIL);
    }

    @Bean
    Binding bKitchenDirect() {
        return BindingBuilder.bind(qKitchen()).to(cmdDirect()).with(RK_KITCHEN);
    }

    @Bean
    Binding bInvoiceDirect() {
        return BindingBuilder.bind(qInvoice()).to(cmdDirect()).with(RK_INVOICE);
    }

    // ---------- Bindings exchange topic ----------
    @Bean
    Binding bEmailTopic() {
        return BindingBuilder.bind(qEmail()).to(cmdTopic()).with("email.*");
    }

    @Bean
    Binding bKitchenTopic() {
        return BindingBuilder.bind(qKitchen()).to(cmdTopic()).with("kitchen.#");
    }

    @Bean
    Binding bInvoiceTopic() {
        return BindingBuilder.bind(qInvoice()).to(cmdTopic()).with("invoice.*");
    }

    // ---------- Bindings DLX hacia las DLQ ----------
    @Bean
    Binding bEmailDlq() {
        return BindingBuilder.bind(qEmailDlq()).to(cmdDeadDlx()).with(RK_EMAIL);
    }

    @Bean
    Binding bKitchenDlq() {
        return BindingBuilder.bind(qKitchenDlq()).to(cmdDeadDlx()).with(RK_KITCHEN);
    }

    @Bean
    Binding bInvoiceDlq() {
        return BindingBuilder.bind(qInvoiceDlq()).to(cmdDeadDlx()).with(RK_INVOICE);
    }

    // ---------- Conversor JSON (usa el tipo del metodo, no el header del productor) ----------
    @Bean
    MessageConverter jacksonMessageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        typeMapper.setTypePrecedence(DefaultJackson2JavaTypeMapper.TypePrecedence.INFERRED);
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }
}
