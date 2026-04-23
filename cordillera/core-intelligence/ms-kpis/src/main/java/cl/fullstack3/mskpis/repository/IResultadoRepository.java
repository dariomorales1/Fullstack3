package cl.fullstack3.mskpis.repository;

import cl.fullstack3.mskpis.model.Resultado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IResultadoRepository extends JpaRepository<Resultado, Long> {

    List<Resultado> findByIndicadorIdOrderByIdDesc(Long indicadorId);

    List<Resultado> findByPeriodoId(Long periodoId);

    Resultado findFirstByIndicadorIdOrderByIdDesc(Long indicadorId);
}
