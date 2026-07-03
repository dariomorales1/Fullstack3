package cl.fullstack3.mskpis.repository;

import cl.fullstack3.mskpis.model.Periodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IPeriodoRepository extends JpaRepository<Periodo, Long> {

    Optional<Periodo> findByAnioAndMes(Integer anio, Integer mes);
}
