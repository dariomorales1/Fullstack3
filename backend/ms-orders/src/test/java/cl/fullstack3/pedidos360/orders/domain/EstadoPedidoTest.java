package cl.fullstack3.pedidos360.orders.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EstadoPedidoTest {

    @Test
    void creadoPuedeAceptarseOCancelarse() {
        assertThat(EstadoPedido.CREADO.puedeTransicionarA(EstadoPedido.ACEPTADO)).isTrue();
        assertThat(EstadoPedido.CREADO.puedeTransicionarA(EstadoPedido.CANCELADO)).isTrue();
    }

    @Test
    void noSePuedeDespacharSinAceptar() {
        assertThat(EstadoPedido.CREADO.puedeTransicionarA(EstadoPedido.DESPACHADO)).isFalse();
    }

    @Test
    void estadosFinalesNoTransicionan() {
        assertThat(EstadoPedido.ENTREGADO.puedeTransicionarA(EstadoPedido.CREADO)).isFalse();
        assertThat(EstadoPedido.CANCELADO.puedeTransicionarA(EstadoPedido.ACEPTADO)).isFalse();
    }
}
