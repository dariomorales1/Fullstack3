package cl.fullstack3.pedidos360.orders.repository;

import cl.fullstack3.pedidos360.orders.domain.EstadoPedido;
import cl.fullstack3.pedidos360.orders.domain.Pedido;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

/** Filtros opcionales para la busqueda de pedidos. */
public final class PedidoSpecs {

    private PedidoSpecs() {
    }

    public static Specification<Pedido> conEstado(EstadoPedido estado) {
        return (root, query, cb) -> estado == null ? null : cb.equal(root.get("estado"), estado);
    }

    public static Specification<Pedido> desde(Instant from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("creadoEn"), from);
    }

    public static Specification<Pedido> hasta(Instant to) {
        return (root, query, cb) -> to == null ? null : cb.lessThanOrEqualTo(root.get("creadoEn"), to);
    }
}
