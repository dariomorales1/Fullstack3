package cl.fullstack3.pedidos360.orders.dto;

import cl.fullstack3.pedidos360.orders.domain.EstadoPedido;
import cl.fullstack3.pedidos360.orders.domain.Pedido;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

public record PedidoResponse(
        Long id,
        String clienteId,
        EstadoPedido estado,
        BigDecimal total,
        List<ItemResponse> items,
        Instant creadoEn,
        Instant actualizadoEn,
        Instant entregadoEn,
        Long leadTimeSegundos
) {
    public static PedidoResponse desde(Pedido p) {
        Long leadTime = (p.getEntregadoEn() != null && p.getCreadoEn() != null)
                ? Duration.between(p.getCreadoEn(), p.getEntregadoEn()).getSeconds()
                : null;
        List<ItemResponse> items = p.getItems().stream().map(ItemResponse::desde).toList();
        return new PedidoResponse(p.getId(), p.getClienteId(), p.getEstado(), p.getTotal(),
                items, p.getCreadoEn(), p.getActualizadoEn(), p.getEntregadoEn(), leadTime);
    }
}
