package cl.fullstack3.msreporting.repository;

import cl.fullstack3.msreporting.model.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IReporteRepository extends JpaRepository<Reporte, Long> {

    List<Reporte> findByTipoOrderByFechaGeneracionDesc(String tipo);

    List<Reporte> findAllByOrderByFechaGeneracionDesc();
}
