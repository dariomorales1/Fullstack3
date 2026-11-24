package cl.fullstack3.pedidos360.adminrabbit.web.dto;

import jakarta.validation.constraints.NotBlank;

/** tipo: direct, topic o fanout. */
public record CrearExchangeRequest(
        @NotBlank String nombre,
        @NotBlank String tipo,
        Boolean durable
) {
}
