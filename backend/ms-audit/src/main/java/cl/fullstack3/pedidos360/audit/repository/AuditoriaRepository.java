package cl.fullstack3.pedidos360.audit.repository;

import cl.fullstack3.pedidos360.audit.domain.AuditoriaEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditoriaRepository extends JpaRepository<AuditoriaEvento, Long>,
        JpaSpecificationExecutor<AuditoriaEvento> {
}
