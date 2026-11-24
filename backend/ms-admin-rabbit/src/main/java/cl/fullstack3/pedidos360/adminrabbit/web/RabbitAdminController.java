package cl.fullstack3.pedidos360.adminrabbit.web;

import cl.fullstack3.pedidos360.adminrabbit.web.dto.CrearBindingRequest;
import cl.fullstack3.pedidos360.adminrabbit.web.dto.CrearColaRequest;
import cl.fullstack3.pedidos360.adminrabbit.web.dto.CrearExchangeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.amqp.core.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Properties;

@RestController
@RequestMapping("/api/adminrabbit")
@Tag(name = "Admin RabbitMQ", description = "Creacion y eliminacion de colas, exchanges y bindings")
public class RabbitAdminController {

    private final AmqpAdmin amqpAdmin;

    public RabbitAdminController(AmqpAdmin amqpAdmin) {
        this.amqpAdmin = amqpAdmin;
    }

    // ---------- Exchanges ----------
    @PostMapping("/exchanges")
    @Operation(summary = "Crear un exchange (direct, topic o fanout)")
    public ResponseEntity<Map<String, String>> crearExchange(@Valid @RequestBody CrearExchangeRequest req) {
        boolean durable = req.durable() == null || req.durable();
        Exchange exchange = switch (req.tipo().toLowerCase()) {
            case "direct" -> new DirectExchange(req.nombre(), durable, false);
            case "topic" -> new TopicExchange(req.nombre(), durable, false);
            case "fanout" -> new FanoutExchange(req.nombre(), durable, false);
            default -> throw new IllegalArgumentException(
                    "Tipo de exchange invalido: '" + req.tipo() + "'. Use direct, topic o fanout.");
        };
        amqpAdmin.declareExchange(exchange);
        return ResponseEntity.ok(Map.of("mensaje", "Exchange creado", "nombre", req.nombre(), "tipo", req.tipo()));
    }

    @DeleteMapping("/exchanges/{nombre}")
    @Operation(summary = "Eliminar un exchange")
    public ResponseEntity<Map<String, Object>> eliminarExchange(@PathVariable String nombre) {
        boolean eliminado = amqpAdmin.deleteExchange(nombre);
        return ResponseEntity.ok(Map.of("nombre", nombre, "eliminado", eliminado));
    }

    // ---------- Colas ----------
    @PostMapping("/queues")
    @Operation(summary = "Crear una cola")
    public ResponseEntity<Map<String, String>> crearCola(@Valid @RequestBody CrearColaRequest req) {
        boolean durable = req.durable() == null || req.durable();
        amqpAdmin.declareQueue(new Queue(req.nombre(), durable, false, false));
        return ResponseEntity.ok(Map.of("mensaje", "Cola creada", "nombre", req.nombre()));
    }

    @DeleteMapping("/queues/{nombre}")
    @Operation(summary = "Eliminar una cola")
    public ResponseEntity<Map<String, Object>> eliminarCola(@PathVariable String nombre) {
        boolean eliminada = amqpAdmin.deleteQueue(nombre);
        return ResponseEntity.ok(Map.of("nombre", nombre, "eliminada", eliminada));
    }

    @GetMapping("/queues/{nombre}")
    @Operation(summary = "Ver propiedades de una cola (existencia, mensajes, consumidores)")
    public ResponseEntity<?> infoCola(@PathVariable String nombre) {
        Properties props = amqpAdmin.getQueueProperties(nombre);
        if (props == null) {
            return ResponseEntity.ok(Map.of("nombre", nombre, "existe", false));
        }
        return ResponseEntity.ok(props);
    }

    // ---------- Bindings ----------
    @PostMapping("/bindings")
    @Operation(summary = "Crear un binding entre un exchange y una cola")
    public ResponseEntity<Map<String, String>> crearBinding(@Valid @RequestBody CrearBindingRequest req) {
        Binding binding = new Binding(req.cola(), Binding.DestinationType.QUEUE,
                req.exchange(), req.routingKey(), null);
        amqpAdmin.declareBinding(binding);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Binding creado",
                "cola", req.cola(),
                "exchange", req.exchange(),
                "routingKey", req.routingKey()));
    }
}
