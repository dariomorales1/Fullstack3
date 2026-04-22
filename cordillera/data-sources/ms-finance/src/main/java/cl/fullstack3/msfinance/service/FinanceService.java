package cl.fullstack3.msfinance.service;

import cl.fullstack3.msfinance.model.Balance;
import cl.fullstack3.msfinance.model.Movement;
import cl.fullstack3.msfinance.repository.IBalanceRepository;
import cl.fullstack3.msfinance.repository.IMovementRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FinanceService {

    private final IMovementRepository movementRepository;
    private final IBalanceRepository balanceRepository;

    public FinanceService(IMovementRepository movementRepository, IBalanceRepository balanceRepository) {
        this.movementRepository = movementRepository;
        this.balanceRepository = balanceRepository;
    }

    public List<Movement> getAllMovements() {
        return movementRepository.findAll();
    }

    public List<Balance> getAllBalances() {
        return balanceRepository.findAll();
    }

    @Transactional
    public Movement saveMovement(Movement movement) {

        if (movement.getDate() == null) {
            movement.setDate(LocalDateTime.now());
        }
        if (movement.getAmount() == null || movement.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        int month = movement.getDate().getMonthValue();
        int year = movement.getDate().getYear();

        String quarter = "Q" + ((month - 1) / 3 + 1);
        String currentPeriod = year + "-" + quarter;

        Optional<Balance> optionalBalance = balanceRepository.findByBranchAndPeriod(movement.getBranchId(), currentPeriod);

        Balance balance;

        if (optionalBalance.isPresent()) {
            balance = optionalBalance.get();
        } else {
            balance = new Balance();
            balance.setBranchId(movement.getBranchId());
            balance.setPeriod(currentPeriod);
            balance.setIncome(BigDecimal.ZERO);
            balance.setExpenses(BigDecimal.ZERO);
            balance.setProfit(BigDecimal.ZERO);
        }

        if ("INCOME".equalsIgnoreCase(movement.getType())) {
            balance.setIncome(balance.getIncome().add(movement.getAmount()));
        } else if ("EXPENSE".equalsIgnoreCase(movement.getType())) {
            balance.setExpenses(balance.getExpenses().add(movement.getAmount()));
        } else {
            throw new IllegalArgumentException("Type must be INCOME or EXPENSE");
        }

        balance.setProfit(balance.getIncome().subtract(balance.getExpenses()));

        balanceRepository.save(balance);
        return movementRepository.save(movement);



    }

}
