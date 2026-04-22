package cl.fullstack3.msdataingestion.repository;

import cl.fullstack3.msdataingestion.model.IngestionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngestionLogRepository extends JpaRepository<IngestionLog, Long> {

    List<IngestionLog> findAllByOrderByExecutionDateDesc();

    IngestionLog findFirstByOrderByExecutionDateDesc();
}
