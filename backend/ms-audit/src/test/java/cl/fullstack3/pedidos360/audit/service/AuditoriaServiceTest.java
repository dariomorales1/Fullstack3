package cl.fullstack3.pedidos360.audit.service;

import cl.fullstack3.pedidos360.audit.domain.AuditoriaEvento;
import cl.fullstack3.pedidos360.audit.messaging.OrderEvent;
import cl.fullstack3.pedidos360.audit.repository.AuditoriaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditoriaServiceTest {

    @Mock
    AuditoriaRepository repository;

    @InjectMocks
    AuditoriaService service;

    @Test
    void registrar_mapeaElEventoAEntidad() {
        OrderEvent ev = new OrderEvent("OrderAccepted", 5L, "cliente@demo.cl", "ACEPTADO",
                new BigDecimal("4800"), Instant.parse("2025-11-24T10:00:00Z"));
        when(repository.save(any(AuditoriaEvento.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditoriaEvento e = service.registrar(ev);

        assertThat(e.getEventType()).isEqualTo("OrderAccepted");
        assertThat(e.getPedidoId()).isEqualTo(5L);
        assertThat(e.getClienteId()).isEqualTo("cliente@demo.cl");
        assertThat(e.getTotal()).isEqualByComparingTo("4800");
    }
}
