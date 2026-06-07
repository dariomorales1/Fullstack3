package cl.fullstack3.msfinance.controller;

import cl.fullstack3.msfinance.model.Balance;
import cl.fullstack3.msfinance.model.Movement;
import cl.fullstack3.msfinance.service.FinanceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FinanceController.class)
class FinanceControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private FinanceService financeService;
    @Autowired private ObjectMapper objectMapper;

    // --- GET MOVEMENTS ---
    @Test
    void getAllMovements_Returns200() throws Exception {
        when(financeService.getAllMovements()).thenReturn(List.of(new Movement()));
        mockMvc.perform(get("/api/finance/movements")).andExpect(status().isOk());
    }

    // --- GET BALANCES ---
    @Test
    void getAllBalances_Returns200() throws Exception {
        when(financeService.getAllBalances()).thenReturn(List.of(new Balance()));
        mockMvc.perform(get("/api/finance/balances")).andExpect(status().isOk());
    }

    // --- POST MOVEMENT ---
    @Test
    void createMovement_Returns201() throws Exception {
        Movement movement = new Movement();
        movement.setAmount(new BigDecimal("5000"));
        movement.setType("INCOME");
        movement.setBranchId(1L);
        movement.setDate(LocalDateTime.now());

        when(financeService.saveMovement(any(Movement.class))).thenReturn(movement);

        mockMvc.perform(post("/api/finance/movements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(movement)))
                .andExpect(status().isCreated());
    }
}