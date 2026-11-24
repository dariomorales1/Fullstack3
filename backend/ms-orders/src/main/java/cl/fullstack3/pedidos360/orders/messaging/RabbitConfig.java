package cl.fullstack3.pedidos360.orders.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Exchanges a los que publica el microservicio de pedidos. */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE_DIRECT = "cmd.direct";
    public static final String EXCHANGE_TOPIC = "cmd.topic";

    @Bean
    public DirectExchange cmdDirect() {
        return ExchangeBuilder.directExchange(EXCHANGE_DIRECT).durable(true).build();
    }

    @Bean
    public TopicExchange cmdTopic() {
        return ExchangeBuilder.topicExchange(EXCHANGE_TOPIC).durable(true).build();
    }

    @Bean
    public MessageConverter jacksonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
