package cl.fullstack3.msfinance.repository;

import cl.fullstack3.msfinance.model.Movement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IMovementRepository extends JpaRepository<Movement, Long> {
}
