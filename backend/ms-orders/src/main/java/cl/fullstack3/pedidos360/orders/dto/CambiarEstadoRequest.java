package cl.fullstack3.pedidos360.orders.dto;

import jakarta.validation.constraints.NotBlank;

/** Cambio de estado de un pedido. El valor se valida contra EstadoPedido. */
public record CambiarEstadoRequest(
        @NotBlank String status
) {
}
