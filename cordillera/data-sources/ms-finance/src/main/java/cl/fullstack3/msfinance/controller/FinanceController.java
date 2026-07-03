package cl.fullstack3.msfinance.controller;

import cl.fullstack3.msfinance.dto.MessageResponse;
import cl.fullstack3.msfinance.model.Balance;
import cl.fullstack3.msfinance.model.Movement;
import cl.fullstack3.msfinance.service.FinanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/movements")
    public ResponseEntity<List<Movement>> getAllMovements() {
        return ResponseEntity.ok(financeService.getAllMovements());
    }

    @GetMapping("/balances")
    public ResponseEntity<List<Balance>> getAllBalances() {
        return ResponseEntity.ok(financeService.getAllBalances());
    }

    @PostMapping("/movements")
    public ResponseEntity<?> createMovement(@RequestBody Movement movement) {
        try {
            Movement savedMovement = financeService.saveMovement(movement);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMovement);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("An error occurred at the process"));
        }
    }

}
