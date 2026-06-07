package cl.fullstack3.msinventory.service;

import cl.fullstack3.msinventory.model.Product;
import cl.fullstack3.msinventory.model.Stock;
import cl.fullstack3.msinventory.repository.IProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private IProductRepository productRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product product;
    private Stock stock;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setSku("SKU-123");

        stock = new Stock();
        stock.setId(10L);
        stock.setQuantity(50);
    }

    // --- FIND ALL ---
    @Test
    void findAllProducts_ReturnsList() {
        when(productRepository.findAll()).thenReturn(List.of(product));
        List<Product> result = inventoryService.findAllProducts();

        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
    }

    // --- FIND BY ID ---
    @Test
    void findProductById_ExistingId_ReturnsOptionalProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        Optional<Product> result = inventoryService.findProductById(1L);

        assertTrue(result.isPresent());
        assertEquals("SKU-123", result.get().getSku());
    }

    // --- SAVE ---
    @Test
    void saveProduct_WithoutStocks_SavesSuccessfully() {
        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product result = inventoryService.saveProduct(product);

        assertNotNull(result);
        assertTrue(result.getStocks() == null || (result.getStocks() instanceof java.util.Collection && ((java.util.Collection<?>) result.getStocks()).isEmpty()));
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void saveProduct_WithStocksNoDate_SetsLastUpdated() {
        List<Stock> stockList = new ArrayList<>();
        stock.setLastUpdated(null);
        stockList.add(stock);
        product.setStocks(stockList);

        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product result = inventoryService.saveProduct(product);

        assertNotNull(result);
        assertEquals(product, result.getStocks().get(0).getProduct());
        assertNotNull(result.getStocks().get(0).getLastUpdated());
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void saveProduct_WithStocksExistingDate_MaintainsDate() {
        List<Stock> stockList = new ArrayList<>();
        LocalDateTime pastDate = LocalDateTime.of(2025, 1, 1, 10, 0);
        stock.setLastUpdated(pastDate);
        stockList.add(stock);
        product.setStocks(stockList);

        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product result = inventoryService.saveProduct(product);

        assertNotNull(result);
        assertEquals(pastDate, result.getStocks().get(0).getLastUpdated());
        verify(productRepository, times(1)).save(product);
    }
}