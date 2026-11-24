package cl.fullstack3.pedidos360.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Datos para crear o actualizar un producto. */
public record ProductoRequest(
        @NotBlank String nombre,
        String descripcion,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal precio,
        @NotNull @Min(0) Integer stock,
        Boolean activo
) {
}
