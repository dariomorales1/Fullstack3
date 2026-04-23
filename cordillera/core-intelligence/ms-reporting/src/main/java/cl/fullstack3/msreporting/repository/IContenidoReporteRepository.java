package cl.fullstack3.msreporting.repository;

import cl.fullstack3.msreporting.model.ContenidoReporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IContenidoReporteRepository extends JpaRepository<ContenidoReporte, Long> {

    List<ContenidoReporte> findByReporteIdOrderByOrdenAsc(Long reporteId);
}
