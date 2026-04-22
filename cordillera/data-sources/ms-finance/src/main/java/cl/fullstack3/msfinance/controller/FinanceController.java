package cl.fullstack3.msfinance.controller;

import cl.fullstack3.msfinance.model.Balance;
import cl.fullstack3.msfinance.model.Movement;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final IMovementRepository movementRepository;
    private final IBalanceRepository balanceRepository;

    private FinanceController(IMovementRepository movementRepository, IBalanaceRepository balanceRepository) {
        this.movementRepository = movementRepository;
        this.balanceRepository = balanceRepository;
    }

    @GetMapping("/movements")
    public List<Movement> getAllMovements() {
        return movementRepository.findAll();
    }

    @GetMapping("/balances")
    public List<Balance> getAllBalances() {
        return balanceRepository.findAll();
    }

    @PostMapping("/movements")
    public Movement createMovement(@RequestBody Movement movement) {
        return movementRepository.save(movement);
    }

}
