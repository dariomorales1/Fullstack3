package cl.fullstack3.msdataingestion.repository;

import cl.fullstack3.msdataingestion.model.IngestedData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngestedDataRepository extends JpaRepository<IngestedData, Long> {

    List<IngestedData> findBySourceServiceOrderByTimestampDesc(String sourceService);

    IngestedData findFirstByOrderByTimestampDesc();
}
