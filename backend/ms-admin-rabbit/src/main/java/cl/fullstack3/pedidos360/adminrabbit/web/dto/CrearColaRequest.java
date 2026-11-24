package cl.fullstack3.pedidos360.adminrabbit.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CrearColaRequest(
        @NotBlank String nombre,
        Boolean durable
) {
}
