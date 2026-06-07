package cl.fullstack3.mssales.service;

import cl.fullstack3.mssales.model.Sale;
import cl.fullstack3.mssales.model.SaleDetail;
import cl.fullstack3.mssales.repository.ISaleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private ISaleRepository saleRepository;

    @InjectMocks
    private SaleService saleService;

    private Sale sale;

    @BeforeEach
    void setUp() {
        sale = new Sale();
        sale.setId(1L);
        sale.setAmount(new BigDecimal("150000"));
        sale.setBranchId(1L);
        sale.setStatus("COMPLETADA");

        SaleDetail detail = new SaleDetail();
        detail.setProductId(1L);
        detail.setQuantity(2);

        List<SaleDetail> details = new ArrayList<>();
        details.add(detail);
        sale.setDetails(details);
    }

    // --- FIND ALL ---
    @Test
    void findAll_ReturnsList() {
        when(saleRepository.findAll()).thenReturn(List.of(sale));
        List<Sale> result = saleService.findAll();
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
    }

    // --- FIND BY ID ---
    @Test
    void findById_ExistingId_ReturnsSale() {
        when(saleRepository.findById(1L)).thenReturn(Optional.of(sale));
        Optional<Sale> result = saleService.findById(1L);
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    // --- DELETE BY ID ---
    @Test
    void deleteById_CallsRepository() {
        doNothing().when(saleRepository).deleteById(1L);
        saleService.deleteById(1L);
        verify(saleRepository, times(1)).deleteById(1L);
    }

    // --- SAVE ---
    @Test
    void save_SuccessfulSale_SetsDateAndLinksDetails() {
        when(saleRepository.save(any(Sale.class))).thenReturn(sale);

        Sale result = saleService.save(sale);

        assertNotNull(result);
        assertNotNull(result.getDate()); // Entra al if(sale.getDate() == null)
        assertEquals(sale, result.getDetails().get(0).getSale()); // Entra al if(sale.getDetails() != null)
        verify(saleRepository, times(1)).save(sale);
    }

    @Test
    void save_AmountZeroOrNull_ThrowsException() {
        // Caso monto 0
        sale.setAmount(BigDecimal.ZERO);
        assertThrows(IllegalArgumentException.class, () -> saleService.save(sale));

        // Caso monto null
        sale.setAmount(null);
        assertThrows(IllegalArgumentException.class, () -> saleService.save(sale));

        verify(saleRepository, never()).save(any());
    }

    @Test
    void save_WithoutDetails_SavesSuccessfully() {
        sale.setDetails(null); // Evita entrar al if de los detalles
        when(saleRepository.save(any(Sale.class))).thenReturn(sale);

        Sale result = saleService.save(sale);

        assertNotNull(result);
        assertNull(result.getDetails());
        verify(saleRepository, times(1)).save(sale);
    }
}