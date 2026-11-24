package cl.fullstack3.pedidos360.report.service;

import cl.fullstack3.pedidos360.report.messaging.OrderEvent;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Agrega KPIs en memoria a partir de los eventos consumidos de Kafka.
 * Thread-safe para el procesamiento concurrente de los consumidores.
 */
@Service
public class KpiService {

    private final Map<String, AtomicLong> eventosPorTipo = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> pedidosPorHora = new ConcurrentHashMap<>();
    private final AtomicLong eventosAuditados = new AtomicLong();
    private final Object lockVentas = new Object();
    private BigDecimal ventasEntregadas = BigDecimal.ZERO;

    public void registrarEvento(OrderEvent evento) {
        eventosPorTipo.computeIfAbsent(evento.eventType(), k -> new AtomicLong()).incrementAndGet();

        if ("OrderCreated".equals(evento.eventType()) && evento.ocurridoEn() != null) {
            String hora = evento.ocurridoEn().atZone(ZoneOffset.UTC)
                    .truncatedTo(ChronoUnit.HOURS).toInstant().toString();
            pedidosPorHora.computeIfAbsent(hora, k -> new AtomicLong()).incrementAndGet();
        }

        if ("OrderDelivered".equals(evento.eventType()) && evento.total() != null) {
            synchronized (lockVentas) {
                ventasEntregadas = ventasEntregadas.add(evento.total());
            }
        }
    }

    public void registrarAuditoria() {
        eventosAuditados.incrementAndGet();
    }

    public Map<String, Object> kpis() {
        Map<String, Long> porTipo = new ConcurrentHashMap<>();
        eventosPorTipo.forEach((k, v) -> porTipo.put(k, v.get()));
        Map<String, Long> porHora = new ConcurrentHashMap<>();
        pedidosPorHora.forEach((k, v) -> porHora.put(k, v.get()));

        BigDecimal ventas;
        synchronized (lockVentas) {
            ventas = ventasEntregadas;
        }

        return Map.of(
                "eventosPorTipo", porTipo,
                "pedidosCreadosPorHora", porHora,
                "ventasEntregadas", ventas,
                "eventosAuditados", eventosAuditados.get()
        );
    }
}
