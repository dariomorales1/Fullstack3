package cl.fullstack3.pedidos360.orders.service;

import cl.fullstack3.pedidos360.orders.client.CatalogClient;
import cl.fullstack3.pedidos360.orders.domain.EstadoPedido;
import cl.fullstack3.pedidos360.orders.domain.Pedido;
import cl.fullstack3.pedidos360.orders.domain.PedidoItem;
import cl.fullstack3.pedidos360.orders.dto.CrearPedidoRequest;
import cl.fullstack3.pedidos360.orders.dto.ItemRequest;
import cl.fullstack3.pedidos360.orders.exception.TransicionInvalidaException;
import cl.fullstack3.pedidos360.orders.messaging.NotificacionPublisher;
import cl.fullstack3.pedidos360.orders.repository.PedidoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    PedidoRepository repository;

    @Mock
    CatalogClient catalogClient;

    @Mock
    NotificacionPublisher notificacionPublisher;

    private PedidoService servicio(boolean sincronizarStock) {
        return new PedidoService(repository, catalogClient, notificacionPublisher, sincronizarStock);
    }

    private Pedido pedidoEn(EstadoPedido estado) {
        Pedido p = new Pedido();
        p.setId(1L);
        p.setClienteId("cliente@demo.cl");
        p.setEstado(estado);
        PedidoItem item = new PedidoItem();
        item.setProductoId(10L);
        item.setNombreProducto("Pan");
        item.setCantidad(2);
        item.setPrecioUnitario(new BigDecimal("1000"));
        item.setSubtotal(new BigDecimal("2000"));
        p.agregarItem(item);
        return p;
    }

    @Test
    void crear_calculaTotalYDejaEnCreado() {
        CrearPedidoRequest req = new CrearPedidoRequest("cliente@demo.cl", List.of(
                new ItemRequest(10L, "Pan", 2, new BigDecimal("1000")),
                new ItemRequest(11L, "Cafe", 1, new BigDecimal("1800"))));
        when(repository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido creado = servicio(true).crear(req);

        assertThat(creado.getEstado()).isEqualTo(EstadoPedido.CREADO);
        assertThat(creado.getTotal()).isEqualByComparingTo("3800");
        assertThat(creado.getItems()).hasSize(2);
    }

    @Test
    void aceptar_descuentaStock() {
        when(repository.findById(1L)).thenReturn(Optional.of(pedidoEn(EstadoPedido.CREADO)));
        when(repository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido p = servicio(true).cambiarEstado(1L, EstadoPedido.ACEPTADO);

        assertThat(p.getEstado()).isEqualTo(EstadoPedido.ACEPTADO);
        verify(catalogClient, times(1)).descontarStock(anyLong(), anyInt());
    }

    @Test
    void despacharSinAceptar_lanzaTransicionInvalida() {
        when(repository.findById(1L)).thenReturn(Optional.of(pedidoEn(EstadoPedido.CREADO)));

        assertThatThrownBy(() -> servicio(false).cambiarEstado(1L, EstadoPedido.DESPACHADO))
                .isInstanceOf(TransicionInvalidaException.class);
        verifyNoInteractions(catalogClient);
    }

    @Test
    void entregar_marcaEntregadoEn() {
        when(repository.findById(1L)).thenReturn(Optional.of(pedidoEn(EstadoPedido.DESPACHADO)));
        when(repository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido p = servicio(false).cambiarEstado(1L, EstadoPedido.ENTREGADO);

        assertThat(p.getEstado()).isEqualTo(EstadoPedido.ENTREGADO);
        assertThat(p.getEntregadoEn()).isNotNull();
    }
}
