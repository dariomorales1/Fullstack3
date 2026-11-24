package cl.fullstack3.pedidos360.catalog.web;

import java.time.Instant;

/** Cuerpo estandar de error. */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message
) {
    public static ApiError de(int status, String error, String message) {
        return new ApiError(Instant.now(), status, error, message);
    }
}
