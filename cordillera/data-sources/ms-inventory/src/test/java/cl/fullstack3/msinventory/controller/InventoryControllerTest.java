package cl.fullstack3.msinventory.controller;

import cl.fullstack3.msinventory.model.Product;
import cl.fullstack3.msinventory.service.InventoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InventoryController.class)
class InventoryControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private InventoryService inventoryService;
    @Autowired private ObjectMapper objectMapper;

    // --- GET ALL ---
    @Test
    void getAllInventory_Returns200() throws Exception {
        when(inventoryService.findAllProducts()).thenReturn(List.of(new Product()));
        mockMvc.perform(get("/api/inventory")).andExpect(status().isOk());
    }

    // --- GET BY ID ---
    @Test
    void getProductById_Exists_Returns200() throws Exception {
        when(inventoryService.findProductById(1L)).thenReturn(Optional.of(new Product()));
        mockMvc.perform(get("/api/inventory/1")).andExpect(status().isOk());
    }

    @Test
    void getProductById_NotFound_Returns404() throws Exception {
        when(inventoryService.findProductById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/inventory/1")).andExpect(status().isNotFound());
    }

    // --- POST ---
    @Test
    void createProduct_Returns201() throws Exception {
        Product product = new Product();
        product.setName("Nuevo Producto");
        when(inventoryService.saveProduct(any(Product.class))).thenReturn(product);

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(product)))
                .andExpect(status().isCreated());
    }

    // --- PUT (UPDATE) ---
    @Test
    void updateProduct_Exists_Returns200() throws Exception {
        Product existingProduct = new Product();
        existingProduct.setId(1L);
        existingProduct.setName("Viejo");

        Product updateDetails = new Product();
        updateDetails.setName("Actualizado");
        updateDetails.setCategory("Nueva Categoria");
        updateDetails.setPrice(new BigDecimal("5000"));
        updateDetails.setActive(true);

        when(inventoryService.findProductById(1L)).thenReturn(Optional.of(existingProduct));
        when(inventoryService.saveProduct(any(Product.class))).thenReturn(existingProduct);

        mockMvc.perform(put("/api/inventory/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDetails)))
                .andExpect(status().isOk());
    }

    @Test
    void updateProduct_NotFound_Returns404() throws Exception {
        when(inventoryService.findProductById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/inventory/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }
}