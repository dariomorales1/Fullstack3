package cl.fullstack3.pedidos360.orders.messaging;

import org.apache.kafka.common.config.TopicConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;
import org.apache.kafka.clients.admin.NewTopic;

/**
 * Crea el topico orders.events y su Dead Letter Topic.
 * Particiones y factor de replicacion son configurables
 * (1 replica en local, 3 en el cluster de la defensa).
 */
@Configuration
@Profile("!test")
public class KafkaTopicsConfig {

    public static final String TOPIC_ORDERS = "orders.events";
    public static final String TOPIC_ORDERS_DLT = "orders.events.DLT";

    @Value("${pedidos360.kafka.partitions:3}")
    private int particiones;

    @Value("${pedidos360.kafka.replicas:1}")
    private int replicas;

    @Value("${pedidos360.kafka.orders-retention-ms:604800000}")
    private String retencionMs;

    @Bean
    public NewTopic ordersEventsTopic() {
        return TopicBuilder.name(TOPIC_ORDERS)
                .partitions(particiones)
                .replicas(replicas)
                .config(TopicConfig.RETENTION_MS_CONFIG, retencionMs)
                .config(TopicConfig.CLEANUP_POLICY_CONFIG, TopicConfig.CLEANUP_POLICY_DELETE)
                .build();
    }

    @Bean
    public NewTopic ordersEventsDltTopic() {
        return TopicBuilder.name(TOPIC_ORDERS_DLT)
                .partitions(particiones)
                .replicas(replicas)
                .build();
    }
}
