package cl.fullstack3.mssales.controller;

import cl.fullstack3.mssales.model.Sale;
import cl.fullstack3.mssales.service.SaleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SalesController.class)
class SalesControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private SaleService saleService;
    @Autowired private ObjectMapper objectMapper;

    // --- GET ALL ---
    @Test
    void getAllSales_Returns200() throws Exception {
        when(saleService.findAll()).thenReturn(List.of(new Sale()));
        mockMvc.perform(get("/api/sales")).andExpect(status().isOk());
    }

    // --- GET BY ID ---
    @Test
    void getSaleById_Exists_Returns200() throws Exception {
        when(saleService.findById(1L)).thenReturn(Optional.of(new Sale()));
        mockMvc.perform(get("/api/sales/1")).andExpect(status().isOk());
    }

    @Test
    void getSaleById_NotFound_Returns404() throws Exception {
        when(saleService.findById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/sales/1")).andExpect(status().isNotFound());
    }

    // --- POST ---
    @Test
    void addSale_Returns201() throws Exception {
        Sale sale = new Sale();
        sale.setAmount(new BigDecimal("1000"));
        when(saleService.save(any(Sale.class))).thenReturn(sale);

        mockMvc.perform(post("/api/sales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sale)))
                .andExpect(status().isCreated());
    }

    // --- PUT (UPDATE) ---
    @Test
    void updateSale_Exists_Returns200() throws Exception {
        Sale existingSale = new Sale();
        existingSale.setId(1L);
        existingSale.setAmount(new BigDecimal("1000"));

        Sale updateDetails = new Sale();
        updateDetails.setAmount(new BigDecimal("2000"));
        updateDetails.setStatus("COMPLETADA");

        when(saleService.findById(1L)).thenReturn(Optional.of(existingSale));
        when(saleService.save(any(Sale.class))).thenReturn(existingSale);

        mockMvc.perform(put("/api/sales/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDetails)))
                .andExpect(status().isOk());
    }

    @Test
    void updateSale_NotFound_Returns404() throws Exception {
        when(saleService.findById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/sales/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    // --- DELETE ---
    @Test
    void deleteSale_Exists_Returns200() throws Exception {
        when(saleService.findById(1L)).thenReturn(Optional.of(new Sale()));
        doNothing().when(saleService).deleteById(1L);

        mockMvc.perform(delete("/api/sales/1")).andExpect(status().isOk());
    }

    @Test
    void deleteSale_NotFound_Returns404() throws Exception {
        when(saleService.findById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(delete("/api/sales/1")).andExpect(status().isNotFound());
    }
}