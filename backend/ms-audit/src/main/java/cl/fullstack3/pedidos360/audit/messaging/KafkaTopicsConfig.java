package cl.fullstack3.pedidos360.audit.messaging;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.config.TopicConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Crea el topico audit.timeline (politica compact+delete para conservar la ultima
 * foto por clave y a la vez expirar) y su Dead Letter Topic.
 */
@Configuration
@Profile("!test")
public class KafkaTopicsConfig {

    public static final String TOPIC_AUDIT = "audit.timeline";
    public static final String TOPIC_AUDIT_DLT = "audit.timeline.DLT";

    @Value("${pedidos360.kafka.partitions:3}")
    private int particiones;

    @Value("${pedidos360.kafka.replicas:1}")
    private int replicas;

    @Value("${pedidos360.kafka.audit-retention-ms:2592000000}")
    private String retencionMs;

    @Bean
    public NewTopic auditTimelineTopic() {
        return TopicBuilder.name(TOPIC_AUDIT)
                .partitions(particiones)
                .replicas(replicas)
                .config(TopicConfig.RETENTION_MS_CONFIG, retencionMs)
                .config(TopicConfig.CLEANUP_POLICY_CONFIG,
                        TopicConfig.CLEANUP_POLICY_COMPACT + "," + TopicConfig.CLEANUP_POLICY_DELETE)
                .build();
    }

    @Bean
    public NewTopic auditTimelineDltTopic() {
        return TopicBuilder.name(TOPIC_AUDIT_DLT)
                .partitions(particiones)
                .replicas(replicas)
                .build();
    }
}
