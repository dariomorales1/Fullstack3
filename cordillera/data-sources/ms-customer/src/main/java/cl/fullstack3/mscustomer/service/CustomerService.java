package cl.fullstack3.mscustomer.service;

import cl.fullstack3.mscustomer.model.Customer;
import cl.fullstack3.mscustomer.repository.ICustomerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final ICustomerRepository customerRepository;

    public CustomerService(ICustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> findAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> findCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Customer saveCustomer(Customer customer) {
        if (customer.getId() == null && customerRepository.findByRut(customer.getRut()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un cliente registrado con el RUT: " + customer.getRut());
        }

        if (customer.getRegistrationDate() == null) {
            customer.setRegistrationDate(LocalDateTime.now());
        }

        if (customer.getContacts() != null) {
            customer.getContacts().forEach(contact -> contact.setCustomer(customer));
        }

        return customerRepository.save(customer);
    }

    public boolean deleteCustomer(Long id) {
        if (customerRepository.existsById(id)) {
            customerRepository.deleteById(id);
            return true;
        }
        return false;
    }

}
