package cl.fullstack3.pedidos360.report.service;

import cl.fullstack3.pedidos360.report.messaging.OrderEvent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class KpiServiceTest {

    private final KpiService service = new KpiService();

    private OrderEvent evento(String tipo, BigDecimal total) {
        return new OrderEvent(tipo, 1L, "cliente@demo.cl", "ESTADO", total, Instant.now());
    }

    @Test
    void acumulaEventosPorTipoYVentas() {
        service.registrarEvento(evento("OrderCreated", new BigDecimal("1000")));
        service.registrarEvento(evento("OrderCreated", new BigDecimal("2000")));
        service.registrarEvento(evento("OrderDelivered", new BigDecimal("3000")));

        Map<String, Object> kpis = service.kpis();

        @SuppressWarnings("unchecked")
        Map<String, Long> porTipo = (Map<String, Long>) kpis.get("eventosPorTipo");
        assertThat(porTipo.get("OrderCreated")).isEqualTo(2L);
        assertThat(porTipo.get("OrderDelivered")).isEqualTo(1L);
        assertThat((BigDecimal) kpis.get("ventasEntregadas")).isEqualByComparingTo("3000");
    }

    @Test
    void cuentaEventosAuditados() {
        service.registrarAuditoria();
        service.registrarAuditoria();
        assertThat(service.kpis().get("eventosAuditados")).isEqualTo(2L);
    }
}
