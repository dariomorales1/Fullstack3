package cl.fullstack3.pedidos360.catalog.repository;

import cl.fullstack3.pedidos360.catalog.domain.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
}
