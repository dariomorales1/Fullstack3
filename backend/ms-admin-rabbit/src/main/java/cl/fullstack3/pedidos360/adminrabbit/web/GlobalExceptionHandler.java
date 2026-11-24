package cl.fullstack3.pedidos360.adminrabbit.web;

import org.springframework.amqp.AmqpException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> datosInvalidos(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error(400, "Datos invalidos", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException ex) {
        String detalle = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error(400, "Datos invalidos", detalle));
    }

    @ExceptionHandler(AmqpException.class)
    public ResponseEntity<Map<String, Object>> rabbit(AmqpException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(error(502, "Error de RabbitMQ", ex.getMessage()));
    }

    private Map<String, Object> error(int status, String error, String message) {
        return Map.of("timestamp", Instant.now().toString(), "status", status, "error", error,
                "message", message == null ? "" : message);
    }
}
