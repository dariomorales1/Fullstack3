package cl.fullstack3.mscustomer.controller;

import cl.fullstack3.mscustomer.dto.MessageResponse;
import cl.fullstack3.mscustomer.model.Customer;
import cl.fullstack3.mscustomer.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.findAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable Long id) {
        Optional<Customer> customer = customerService.findCustomerById(id);
        if (customer.isPresent()) {
            return ResponseEntity.ok(customer.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Customer not found"));
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {
        try {
            Customer savedCustomer = customerService.saveCustomer(customer);
            return new ResponseEntity<>(savedCustomer, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody Customer customerDetails) {
        return customerService.findCustomerById(id).map(existing -> {
            existing.setName(customerDetails.getName());
            existing.setEmail(customerDetails.getEmail());
            existing.setPhone(customerDetails.getPhone());
            existing.setType(customerDetails.getType());

            existing.getContacts().clear();
            if (customerDetails.getContacts() != null) {
                existing.getContacts().addAll(customerDetails.getContacts());
            }

            try {
                return ResponseEntity.ok(customerService.saveCustomer(existing));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteCustomer(@PathVariable Long id) {
        if (customerService.deleteCustomer(id)) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body(new MessageResponse("Customer has deleted"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Customer not found"));
    }

}
