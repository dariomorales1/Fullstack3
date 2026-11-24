package cl.fullstack3.pedidos360.orders.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ItemRequest(
        @NotNull Long productoId,
        @NotBlank String nombreProducto,
        @NotNull @Min(1) Integer cantidad,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal precioUnitario
) {
}
