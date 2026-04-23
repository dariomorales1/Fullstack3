package cl.fullstack3.mskpis.repository;

import cl.fullstack3.mskpis.model.Indicador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IIndicadorRepository extends JpaRepository<Indicador, Long> {

    Optional<Indicador> findByCodigo(String codigo);
}
