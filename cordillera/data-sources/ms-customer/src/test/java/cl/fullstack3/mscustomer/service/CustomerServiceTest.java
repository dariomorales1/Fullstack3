package cl.fullstack3.mscustomer.service;

import cl.fullstack3.mscustomer.model.Contact;
import cl.fullstack3.mscustomer.model.Customer;
import cl.fullstack3.mscustomer.repository.ICustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomerServiceTest {

    @Mock
    private ICustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer customer;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId(1L);
        customer.setRut("11.111.111-1");
        customer.setName("Empresa Test");

        Contact contact = new Contact();
        contact.setName("Juan Perez");

        List<Contact> contacts = new ArrayList<>();
        contacts.add(contact);
        customer.setContacts(contacts);
    }

    @Test
    void findAllCustomers_ReturnsList() {
        when(customerRepository.findAll()).thenReturn(List.of(customer));
        List<Customer> result = customerService.findAllCustomers();
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
    }

    @Test
    void findCustomerById_ExistingId_ReturnsOptionalCustomer() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        Optional<Customer> result = customerService.findCustomerById(1L);
        assertTrue(result.isPresent());
        assertEquals("11.111.111-1", result.get().getRut());
    }

    @Test
    void deleteCustomer_CallsRepository() {
        // Simulamos que el cliente existe antes de borrar
        when(customerRepository.existsById(1L)).thenReturn(true);
        doNothing().when(customerRepository).deleteById(1L);

        customerService.deleteCustomer(1L);

        verify(customerRepository, times(1)).existsById(1L);
        verify(customerRepository, times(1)).deleteById(1L);
    }

    @Test
    void saveCustomer_NewCustomer_SetsRegistrationDateAndLinksContacts() {
        when(customerRepository.findByRut("11.111.111-1")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);

        Customer result = customerService.saveCustomer(customer);

        assertNotNull(result);
        assertNotNull(result.getRegistrationDate());
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void saveCustomer_CustomerWithoutContacts_SavesSuccessfully() {
        customer.setContacts(new ArrayList<>());
        when(customerRepository.findByRut("11.111.111-1")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);

        Customer result = customerService.saveCustomer(customer);

        assertNotNull(result);
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void saveCustomer_ExistingRut_ThrowsIllegalArgumentException() {
        Customer existing = new Customer();
        existing.setRut("11.111.111-1");

        when(customerRepository.findByRut("11.111.111-1")).thenReturn(Optional.of(existing));

        customer.setId(null); // simula cliente nuevo sin id para activar la validacion de RUT duplicado
        assertThrows(IllegalArgumentException.class, () -> customerService.saveCustomer(customer));

        verify(customerRepository, never()).save(any(Customer.class));
    }
}