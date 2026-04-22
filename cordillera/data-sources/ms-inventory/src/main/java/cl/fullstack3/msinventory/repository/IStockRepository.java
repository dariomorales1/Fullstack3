package cl.fullstack3.msinventory.repository;

import cl.fullstack3.msinventory.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IStockRepository extends JpaRepository<Stock, Long> {
}
