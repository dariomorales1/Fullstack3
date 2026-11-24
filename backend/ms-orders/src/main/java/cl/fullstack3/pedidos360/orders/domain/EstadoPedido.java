package cl.fullstack3.pedidos360.orders.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Estados de un pedido y sus transiciones permitidas.
 * Regla clave: no se puede "despachar" sin pasar por "aceptar".
 */
public enum EstadoPedido {

    CREADO,
    ACEPTADO,
    EN_PREPARACION,
    DESPACHADO,
    ENTREGADO,
    CANCELADO;

    private static final Map<EstadoPedido, Set<EstadoPedido>> TRANSICIONES = Map.of(
            CREADO, EnumSet.of(ACEPTADO, CANCELADO),
            ACEPTADO, EnumSet.of(EN_PREPARACION, CANCELADO),
            EN_PREPARACION, EnumSet.of(DESPACHADO, CANCELADO),
            DESPACHADO, EnumSet.of(ENTREGADO),
            ENTREGADO, EnumSet.noneOf(EstadoPedido.class),
            CANCELADO, EnumSet.noneOf(EstadoPedido.class)
    );

    public boolean puedeTransicionarA(EstadoPedido destino) {
        return TRANSICIONES.get(this).contains(destino);
    }
}
