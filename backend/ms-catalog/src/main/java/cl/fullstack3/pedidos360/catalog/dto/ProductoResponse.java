package cl.fullstack3.pedidos360.catalog.dto;

import cl.fullstack3.pedidos360.catalog.domain.Producto;

import java.math.BigDecimal;
import java.time.Instant;

/** Representacion de un producto hacia el cliente. */
public record ProductoResponse(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Integer stock,
        boolean activo,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static ProductoResponse desde(Producto p) {
        return new ProductoResponse(
                p.getId(), p.getNombre(), p.getDescripcion(), p.getPrecio(),
                p.getStock(), p.isActivo(), p.getCreadoEn(), p.getActualizadoEn());
    }
}
