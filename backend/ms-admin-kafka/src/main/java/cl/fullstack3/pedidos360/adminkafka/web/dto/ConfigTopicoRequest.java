package cl.fullstack3.pedidos360.adminkafka.web.dto;

/** Ajuste de configuracion de un topico (retencion y/o politica de limpieza). */
public record ConfigTopicoRequest(
        Long retencionMs,
        String cleanupPolicy
) {
}
