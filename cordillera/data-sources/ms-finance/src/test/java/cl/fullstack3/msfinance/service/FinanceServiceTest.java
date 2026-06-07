package cl.fullstack3.msfinance.service;

import cl.fullstack3.msfinance.model.Balance;
import cl.fullstack3.msfinance.model.Movement;
import cl.fullstack3.msfinance.repository.IBalanceRepository;
import cl.fullstack3.msfinance.repository.IMovementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

    @Mock
    private IMovementRepository movementRepository;

    @Mock
    private IBalanceRepository balanceRepository;

    @InjectMocks
    private FinanceService financeService;

    private Movement movement;

    @BeforeEach
    void setUp() {
        movement = new Movement();
        movement.setId(1L);
        movement.setBranchId(1L);
        movement.setAmount(new BigDecimal("50000"));
        movement.setDate(LocalDateTime.of(2026, 2, 15, 10, 0));
    }

    // --- FIND ALL ---
    @Test
    void getAllMovements_ReturnsList() {
        when(movementRepository.findAll()).thenReturn(List.of(movement));
        List<Movement> result = financeService.getAllMovements();
        assertFalse(result.isEmpty());
    }

    @Test
    void getAllBalances_ReturnsList() {
        when(balanceRepository.findAll()).thenReturn(List.of(new Balance()));
        List<Balance> result = financeService.getAllBalances();
        assertFalse(result.isEmpty());
    }

    // --- SAVE MOVEMENT (CORE LOGIC) ---
    @Test
    void saveMovement_NewIncome_CreatesBalanceAndCalculatesProfit() {
        movement.setType("INCOME");
        when(balanceRepository.findByBranchIdAndPeriod(1L, "2026-Q1")).thenReturn(Optional.empty());
        when(movementRepository.save(any(Movement.class))).thenReturn(movement);

        Movement result = financeService.saveMovement(movement);

        assertNotNull(result);
        verify(balanceRepository).save(argThat(balance ->
                balance.getPeriod().equals("2026-Q1") &&
                        balance.getIncome().compareTo(new BigDecimal("50000")) == 0 &&
                        balance.getExpenses().compareTo(BigDecimal.ZERO) == 0 &&
                        balance.getProfit().compareTo(new BigDecimal("50000")) == 0
        ));
        verify(movementRepository).save(movement);
    }

    @Test
    void saveMovement_ExistingExpense_UpdatesBalanceCorrectly() {
        movement.setType("EXPENSE");

        Balance existingBalance = new Balance();
        existingBalance.setIncome(new BigDecimal("100000"));
        existingBalance.setExpenses(new BigDecimal("20000"));

        when(balanceRepository.findByBranchIdAndPeriod(1L, "2026-Q1")).thenReturn(Optional.of(existingBalance));
        when(movementRepository.save(any(Movement.class))).thenReturn(movement);

        financeService.saveMovement(movement);

        assertEquals(new BigDecimal("70000"), existingBalance.getExpenses());
        assertEquals(new BigDecimal("30000"), existingBalance.getProfit());
        verify(balanceRepository).save(existingBalance);
    }

    @Test
    void saveMovement_InvalidType_ThrowsException() {
        movement.setType("INVALIDO");
        when(balanceRepository.findByBranchIdAndPeriod(any(), any())).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            financeService.saveMovement(movement);
        });

        assertEquals("Type must be INCOME or EXPENSE", exception.getMessage());
        verify(movementRepository, never()).save(any());
    }
}