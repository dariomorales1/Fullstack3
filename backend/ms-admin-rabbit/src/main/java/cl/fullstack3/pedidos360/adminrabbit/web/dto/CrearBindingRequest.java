package cl.fullstack3.pedidos360.adminrabbit.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CrearBindingRequest(
        @NotBlank String cola,
        @NotBlank String exchange,
        @NotBlank String routingKey
) {
}
