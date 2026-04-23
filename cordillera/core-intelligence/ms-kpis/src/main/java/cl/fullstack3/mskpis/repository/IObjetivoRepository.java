package cl.fullstack3.mskpis.repository;

import cl.fullstack3.mskpis.model.Objetivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IObjetivoRepository extends JpaRepository<Objetivo, Long> {

    List<Objetivo> findByIndicadorId(Long indicadorId);

    Optional<Objetivo> findByIndicadorIdAndPeriodoId(Long indicadorId, Long periodoId);
}
