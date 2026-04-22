package cl.fullstack3.msfinance.repository;

import cl.fullstack3.msfinance.model.Balance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IBalanceRepository extends JpaRepository<Balance, Long> {

    Optional<Balance> findByBranchAndPeriod(
            Long branchId, String period
    );
}
