package cl.fullstack3.pedidos360.orders.service;

import cl.fullstack3.pedidos360.orders.client.CatalogClient;
import cl.fullstack3.pedidos360.orders.domain.EstadoPedido;
import cl.fullstack3.pedidos360.orders.domain.Pedido;
import cl.fullstack3.pedidos360.orders.domain.PedidoItem;
import cl.fullstack3.pedidos360.orders.dto.CrearPedidoRequest;
import cl.fullstack3.pedidos360.orders.dto.ItemRequest;
import cl.fullstack3.pedidos360.orders.exception.RecursoNoEncontradoException;
import cl.fullstack3.pedidos360.orders.exception.TransicionInvalidaException;
import cl.fullstack3.pedidos360.orders.messaging.NotificacionPublisher;
import cl.fullstack3.pedidos360.orders.repository.PedidoRepository;
import cl.fullstack3.pedidos360.orders.repository.PedidoSpecs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class PedidoService {

    private final PedidoRepository repository;
    private final CatalogClient catalogClient;
    private final NotificacionPublisher notificacionPublisher;
    private final boolean sincronizarStock;

    public PedidoService(PedidoRepository repository,
                         CatalogClient catalogClient,
                         NotificacionPublisher notificacionPublisher,
                         @Value("${pedidos360.catalog.stock-sync:true}") boolean sincronizarStock) {
        this.repository = repository;
        this.catalogClient = catalogClient;
        this.notificacionPublisher = notificacionPublisher;
        this.sincronizarStock = sincronizarStock;
    }

    @Transactional(readOnly = true)
    public List<Pedido> listar(EstadoPedido estado, Instant from, Instant to) {
        Specification<Pedido> spec = Specification.where(PedidoSpecs.conEstado(estado))
                .and(PedidoSpecs.desde(from))
                .and(PedidoSpecs.hasta(to));
        return repository.findAll(spec);
    }

    @Transactional(readOnly = true)
    public Pedido obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el pedido con id " + id));
    }

    @Transactional
    public Pedido crear(CrearPedidoRequest req) {
        Pedido pedido = new Pedido();
        pedido.setClienteId(req.clienteId());
        pedido.setEstado(EstadoPedido.CREADO);

        BigDecimal total = BigDecimal.ZERO;
        for (ItemRequest it : req.items()) {
            PedidoItem item = new PedidoItem();
            item.setProductoId(it.productoId());
            item.setNombreProducto(it.nombreProducto());
            item.setCantidad(it.cantidad());
            item.setPrecioUnitario(it.precioUnitario());
            BigDecimal subtotal = it.precioUnitario().multiply(BigDecimal.valueOf(it.cantidad()));
            item.setSubtotal(subtotal);
            pedido.agregarItem(item);
            total = total.add(subtotal);
        }
        pedido.setTotal(total);
        Pedido guardado = repository.save(pedido);
        notificacionPublisher.notificarPedidoCreado(guardado);
        return guardado;
    }

    @Transactional
    public Pedido cambiarEstado(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = obtener(id);
        EstadoPedido actual = pedido.getEstado();

        if (!actual.puedeTransicionarA(nuevoEstado)) {
            throw new TransicionInvalidaException(
                    "No se permite pasar de " + actual + " a " + nuevoEstado);
        }

        if (nuevoEstado == EstadoPedido.ACEPTADO) {
            descontarStockDeItems(pedido);
        }

        pedido.setEstado(nuevoEstado);
        if (nuevoEstado == EstadoPedido.ENTREGADO) {
            pedido.setEntregadoEn(Instant.now());
        }
        Pedido guardado = repository.save(pedido);
        notificacionPublisher.notificarCambioEstado(guardado);
        return guardado;
    }

    /** Al aceptar el pedido se descuenta el stock (best-effort si el catalogo no responde). */
    private void descontarStockDeItems(Pedido pedido) {
        if (!sincronizarStock) {
            return;
        }
        for (PedidoItem item : pedido.getItems()) {
            try {
                catalogClient.descontarStock(item.getProductoId(), item.getCantidad());
            } catch (Exception ex) {
                log.warn("No se pudo descontar stock del producto {} (pedido {}): {}",
                        item.getProductoId(), pedido.getId(), ex.getMessage());
            }
        }
    }
}
