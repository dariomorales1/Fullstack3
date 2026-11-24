package cl.fullstack3.pedidos360.catalog.service;

import cl.fullstack3.pedidos360.catalog.domain.Producto;
import cl.fullstack3.pedidos360.catalog.dto.ProductoRequest;
import cl.fullstack3.pedidos360.catalog.exception.RecursoNoEncontradoException;
import cl.fullstack3.pedidos360.catalog.exception.StockInsuficienteException;
import cl.fullstack3.pedidos360.catalog.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository repository;

    public ProductoService(ProductoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Producto> listar() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Producto obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el producto con id " + id));
    }

    @Transactional
    public Producto crear(ProductoRequest req) {
        Producto p = new Producto();
        aplicar(p, req);
        return repository.save(p);
    }

    @Transactional
    public Producto actualizar(Long id, ProductoRequest req) {
        Producto p = obtener(id);
        aplicar(p, req);
        return repository.save(p);
    }

    @Transactional
    public void eliminar(Long id) {
        Producto p = obtener(id);
        repository.delete(p);
    }

    /** Descuenta stock al aceptar un pedido. Falla si no hay suficiente. */
    @Transactional
    public Producto descontarStock(Long id, int cantidad) {
        Producto p = obtener(id);
        if (p.getStock() < cantidad) {
            throw new StockInsuficienteException(
                    "Stock insuficiente para el producto " + id + " (disponible: " + p.getStock() + ", solicitado: " + cantidad + ")");
        }
        p.setStock(p.getStock() - cantidad);
        return repository.save(p);
    }

    private void aplicar(Producto p, ProductoRequest req) {
        p.setNombre(req.nombre());
        p.setDescripcion(req.descripcion());
        p.setPrecio(req.precio());
        p.setStock(req.stock());
        p.setActivo(req.activo() == null || req.activo());
    }
}
