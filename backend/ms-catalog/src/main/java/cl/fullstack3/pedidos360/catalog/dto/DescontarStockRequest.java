package cl.fullstack3.pedidos360.catalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Cantidad a descontar del stock de un producto. */
public record DescontarStockRequest(
        @NotNull @Min(1) Integer cantidad
) {
}
