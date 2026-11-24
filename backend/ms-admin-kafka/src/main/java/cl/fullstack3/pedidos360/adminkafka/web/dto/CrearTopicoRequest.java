package cl.fullstack3.pedidos360.adminkafka.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CrearTopicoRequest(
        @NotBlank String nombre,
        @NotNull @Min(1) Integer particiones,
        Integer replicas,
        Long retencionMs,
        String cleanupPolicy
) {
}
