package cl.fullstack3.pedidos360.audit.web;

import cl.fullstack3.pedidos360.audit.domain.AuditoriaEvento;

import java.math.BigDecimal;
import java.time.Instant;

public record AuditoriaResponse(
        Long id,
        String eventType,
        Long pedidoId,
        String clienteId,
        String estado,
        BigDecimal total,
        Instant ocurridoEn,
        Instant registradoEn
) {
    public static AuditoriaResponse desde(AuditoriaEvento e) {
        return new AuditoriaResponse(e.getId(), e.getEventType(), e.getPedidoId(), e.getClienteId(),
                e.getEstado(), e.getTotal(), e.getOcurridoEn(), e.getRegistradoEn());
    }
}
