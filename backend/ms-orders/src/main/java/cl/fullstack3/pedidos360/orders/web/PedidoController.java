package cl.fullstack3.pedidos360.orders.web;

import cl.fullstack3.pedidos360.orders.domain.EstadoPedido;
import cl.fullstack3.pedidos360.orders.dto.CambiarEstadoRequest;
import cl.fullstack3.pedidos360.orders.dto.CrearPedidoRequest;
import cl.fullstack3.pedidos360.orders.dto.PedidoResponse;
import cl.fullstack3.pedidos360.orders.exception.EstadoInvalidoException;
import cl.fullstack3.pedidos360.orders.service.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Pedidos", description = "Gestion de pedidos y cambios de estado")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear un pedido (queda en estado CREADO)")
    public PedidoResponse crear(@Valid @RequestBody CrearPedidoRequest req) {
        return PedidoResponse.desde(service.crear(req));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un pedido por id")
    public PedidoResponse obtener(@PathVariable Long id) {
        return PedidoResponse.desde(service.obtener(id));
    }

    @GetMapping
    @Operation(summary = "Listar pedidos con filtros opcionales (estado, from, to)")
    public List<PedidoResponse> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        EstadoPedido estado = status == null ? null : parsearEstado(status);
        Instant desde = parsearInstante(from, "from");
        Instant hasta = parsearInstante(to, "to");
        return service.listar(estado, desde, hasta).stream().map(PedidoResponse::desde).toList();
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cambiar el estado de un pedido (valida transiciones)")
    public PedidoResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoRequest req) {
        return PedidoResponse.desde(service.cambiarEstado(id, parsearEstado(req.status())));
    }

    private EstadoPedido parsearEstado(String valor) {
        try {
            return EstadoPedido.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new EstadoInvalidoException(
                    "Estado invalido: '" + valor + "'. Valores validos: " + Arrays.toString(EstadoPedido.values()));
        }
    }

    private Instant parsearInstante(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(valor);
        } catch (Exception ex) {
            throw new EstadoInvalidoException(
                    "El parametro '" + campo + "' debe ser una fecha ISO-8601 (ej: 2025-11-24T10:00:00Z)");
        }
    }
}
