package cl.fullstack3.pedidos360.report.messaging;

import cl.fullstack3.pedidos360.report.service.KpiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consume eventos de Kafka para alimentar los KPIs.
 * Usa dos consumer groups distintos (uno por topico).
 */
@Slf4j
@Component
public class KpiConsumer {

    private final ObjectMapper objectMapper;
    private final KpiService kpiService;

    public KpiConsumer(ObjectMapper objectMapper, KpiService kpiService) {
        this.objectMapper = objectMapper;
        this.kpiService = kpiService;
    }

    @KafkaListener(topics = "orders.events", groupId = "report-kpis")
    public void onOrderEvent(String json) throws Exception {
        OrderEvent evento = objectMapper.readValue(json, OrderEvent.class);
        if (evento.eventType() == null) {
            throw new IllegalArgumentException("Evento sin eventType: " + json);
        }
        kpiService.registrarEvento(evento);
        log.info("KPI actualizado: evento={} pedidoId={}", evento.eventType(), evento.pedidoId());
    }

    @KafkaListener(topics = "audit.timeline", groupId = "report-audit")
    public void onAuditEvent(String json) throws Exception {
        AuditEvent evento = objectMapper.readValue(json, AuditEvent.class);
        kpiService.registrarAuditoria();
        log.debug("Evento auditado contabilizado: {} pedidoId={}", evento.eventType(), evento.pedidoId());
    }
}
