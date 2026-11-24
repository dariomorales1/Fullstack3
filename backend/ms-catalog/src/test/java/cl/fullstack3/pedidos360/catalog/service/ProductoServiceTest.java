package cl.fullstack3.pedidos360.catalog.service;

import cl.fullstack3.pedidos360.catalog.domain.Producto;
import cl.fullstack3.pedidos360.catalog.dto.ProductoRequest;
import cl.fullstack3.pedidos360.catalog.exception.RecursoNoEncontradoException;
import cl.fullstack3.pedidos360.catalog.exception.StockInsuficienteException;
import cl.fullstack3.pedidos360.catalog.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    ProductoRepository repository;

    @InjectMocks
    ProductoService service;

    private Producto producto(long id, int stock) {
        Producto p = new Producto();
        p.setId(id);
        p.setNombre("Pan");
        p.setPrecio(new BigDecimal("1000"));
        p.setStock(stock);
        p.setActivo(true);
        return p;
    }

    @Test
    void crear_guardaProducto() {
        ProductoRequest req = new ProductoRequest("Pan", "desc", new BigDecimal("1000"), 10, null);
        when(repository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        Producto creado = service.crear(req);

        assertThat(creado.getNombre()).isEqualTo("Pan");
        assertThat(creado.getStock()).isEqualTo(10);
        assertThat(creado.isActivo()).isTrue();
    }

    @Test
    void obtener_inexistente_lanzaNoEncontrado() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.obtener(99L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void descontarStock_suficiente_restaStock() {
        when(repository.findById(1L)).thenReturn(Optional.of(producto(1L, 10)));
        when(repository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        Producto p = service.descontarStock(1L, 4);

        assertThat(p.getStock()).isEqualTo(6);
    }

    @Test
    void descontarStock_insuficiente_lanzaExcepcion() {
        when(repository.findById(1L)).thenReturn(Optional.of(producto(1L, 3)));
        assertThatThrownBy(() -> service.descontarStock(1L, 5))
                .isInstanceOf(StockInsuficienteException.class);
    }
}
