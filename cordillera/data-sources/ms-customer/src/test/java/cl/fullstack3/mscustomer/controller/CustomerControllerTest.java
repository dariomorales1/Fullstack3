package cl.fullstack3.mscustomer.controller;

import cl.fullstack3.mscustomer.model.Customer;
import cl.fullstack3.mscustomer.service.CustomerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerController.class)
class CustomerControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private CustomerService customerService;
    @Autowired private ObjectMapper objectMapper;

    // --- GET ALL ---
    @Test
    void getAllCustomers_Returns200() throws Exception {
        when(customerService.findAllCustomers()).thenReturn(List.of(new Customer()));
        mockMvc.perform(get("/api/customers")).andExpect(status().isOk());
    }

    // --- GET BY ID ---
    @Test
    void getCustomerById_Exists_Returns200() throws Exception {
        when(customerService.findCustomerById(1L)).thenReturn(Optional.of(new Customer()));
        mockMvc.perform(get("/api/customers/1")).andExpect(status().isOk());
    }

    @Test
    void getCustomerById_NotFound_Returns404() throws Exception {
        when(customerService.findCustomerById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/customers/1")).andExpect(status().isNotFound());
    }

    // --- POST ---
    @Test
    void createCustomer_Returns201() throws Exception {
        Customer customer = new Customer();
        customer.setRut("11.111.111-1");
        customer.setName("Empresa Test");

        when(customerService.saveCustomer(any(Customer.class))).thenReturn(customer);

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customer)))
                .andExpect(status().isCreated());
    }

    // --- PUT (UPDATE) ---
    @Test
    void updateCustomer_Exists_Returns200() throws Exception {
        Customer existingCustomer = new Customer();
        existingCustomer.setId(1L);
        existingCustomer.setRut("11.111.111-1");

        Customer updateDetails = new Customer();
        updateDetails.setName("Nombre Actualizado");

        when(customerService.findCustomerById(1L)).thenReturn(Optional.of(existingCustomer));
        when(customerService.saveCustomer(any(Customer.class))).thenReturn(existingCustomer);

        mockMvc.perform(put("/api/customers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDetails)))
                .andExpect(status().isOk());
    }

    @Test
    void updateCustomer_NotFound_Returns404() throws Exception {
        when(customerService.findCustomerById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/customers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    // --- DELETE ---
    @Test
    void deleteCustomer_Exists_Returns200() throws Exception {
        // Simulamos que el cliente existe
        when(customerService.findCustomerById(1L)).thenReturn(Optional.of(new Customer()));
        when(customerService.deleteCustomer(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/customers/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCustomer_NotFound_Returns404() throws Exception {
        when(customerService.findCustomerById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(delete("/api/customers/1")).andExpect(status().isNotFound());
    }
}