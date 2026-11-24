package cl.fullstack3.pedidos360.catalog.bootstrap;

import cl.fullstack3.pedidos360.catalog.domain.Producto;
import cl.fullstack3.pedidos360.catalog.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Carga datos de ejemplo si el catalogo esta vacio (solo fuera de tests). */
@Component
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private final ProductoRepository repository;

    public DataSeeder(ProductoRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }
        crear("Pan amasado", "Pan artesanal 500g", "1500", 120);
        crear("Marraqueta", "Pack de 6 unidades", "1200", 200);
        crear("Cafe americano", "Vaso 350ml", "1800", 80);
        crear("Empanada de pino", "Horneada", "2500", 60);
        crear("Torta tres leches", "Porcion individual", "3200", 40);
    }

    private void crear(String nombre, String descripcion, String precio, int stock) {
        Producto p = new Producto();
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setPrecio(new BigDecimal(precio));
        p.setStock(stock);
        p.setActivo(true);
        repository.save(p);
    }
}
