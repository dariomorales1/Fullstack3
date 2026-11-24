package cl.fullstack3.pedidos360.orders.dto;

import cl.fullstack3.pedidos360.orders.domain.PedidoItem;

import java.math.BigDecimal;

public record ItemResponse(
        Long productoId,
        String nombreProducto,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
) {
    public static ItemResponse desde(PedidoItem i) {
        return new ItemResponse(i.getProductoId(), i.getNombreProducto(), i.getCantidad(),
                i.getPrecioUnitario(), i.getSubtotal());
    }
}
