package cl.fullstack3.pedidos360.catalog.web;

import cl.fullstack3.pedidos360.catalog.dto.DescontarStockRequest;
import cl.fullstack3.pedidos360.catalog.dto.ProductoRequest;
import cl.fullstack3.pedidos360.catalog.dto.ProductoResponse;
import cl.fullstack3.pedidos360.catalog.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/products")
@Tag(name = "Catalogo", description = "Gestion de productos y stock")
public class ProductoController {

    private final ProductoService service;

    public ProductoController(ProductoService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar todos los productos")
    public List<ProductoResponse> listar() {
        return service.listar().stream().map(ProductoResponse::desde).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un producto por id")
    public ProductoResponse obtener(@PathVariable Long id) {
        return ProductoResponse.desde(service.obtener(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    @Operation(summary = "Crear un producto")
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest req) {
        return ProductoResponse.desde(service.crear(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    @Operation(summary = "Actualizar un producto (precio/stock/datos)")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest req) {
        return ProductoResponse.desde(service.actualizar(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar un producto")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }

    @PostMapping("/{id}/descontar-stock")
    @PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
    @Operation(summary = "Descontar stock de un producto (usado al aceptar un pedido)")
    public ResponseEntity<ProductoResponse> descontarStock(@PathVariable Long id,
                                                           @Valid @RequestBody DescontarStockRequest req) {
        return ResponseEntity.ok(ProductoResponse.desde(service.descontarStock(id, req.cantidad())));
    }
}
