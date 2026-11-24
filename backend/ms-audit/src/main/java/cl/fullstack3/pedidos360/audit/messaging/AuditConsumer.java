package cl.fullstack3.pedidos360.audit.messaging;

import cl.fullstack3.pedidos360.audit.service.AuditoriaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Consume orders.events, persiste cada evento en la timeline de auditoria
 * y lo republica enriquecido al topico audit.timeline.
 */
@Slf4j
@Component
public class AuditConsumer {

    private final ObjectMapper objectMapper;
    private final AuditoriaService auditoriaService;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public AuditConsumer(ObjectMapper objectMapper, AuditoriaService auditoriaService,
                         KafkaTemplate<String, String> kafkaTemplate) {
        this.objectMapper = objectMapper;
        this.auditoriaService = auditoriaService;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "orders.events", groupId = "audit-persist")
    public void onOrderEvent(String json) throws Exception {
        OrderEvent evento = objectMapper.readValue(json, OrderEvent.class);
        if (evento.eventType() == null) {
            throw new IllegalArgumentException("Evento sin eventType: " + json);
        }
        auditoriaService.registrar(evento);

        AuditEvent auditado = new AuditEvent(evento.eventType(), evento.pedidoId(), evento.clienteId(),
                evento.estado(), evento.total(), evento.ocurridoEn(), Instant.now());
        kafkaTemplate.send("audit.timeline", String.valueOf(evento.pedidoId()),
                objectMapper.writeValueAsString(auditado));

        log.info("Auditoria registrada y republicada: {} pedidoId={}", evento.eventType(), evento.pedidoId());
    }
}
