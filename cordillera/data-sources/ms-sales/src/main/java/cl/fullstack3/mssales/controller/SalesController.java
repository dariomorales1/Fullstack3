package cl.fullstack3.mssales.controller;

import cl.fullstack3.mssales.dto.MessageResponse;
import cl.fullstack3.mssales.model.Sale;
import cl.fullstack3.mssales.service.SaleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final SaleService saleService;

    public SalesController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {
        List<Sale> sales = saleService.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(sales);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSaleById(@PathVariable Long id) {
        Optional<Sale> existing = saleService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new MessageResponse("Sale not found with id: " + id)
            );
        }
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @PostMapping
    public ResponseEntity<Sale> addSale(@RequestBody Sale sale) {
        Sale savedSale = saleService.save(sale);
        return new ResponseEntity<>(savedSale, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSale(@PathVariable Long id, @RequestBody Sale saleDetails) {
        Optional<Sale> existing = saleService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new MessageResponse("Sale not found with id: " + id)
            );
        }
        existing.get().setAmount(saleDetails.getAmount());
        existing.get().setStatus(saleDetails.getStatus());
        saleService.save(existing.get());
        return ResponseEntity.status(HttpStatus.OK).body(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteSale(@PathVariable Long id) {
        Optional<Sale> existing = saleService.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new MessageResponse("Sale not found with id: " + id)
            );
        }
        saleService.deleteById(id);
        return ResponseEntity.status(HttpStatus.OK).body(
                new MessageResponse("Sale deleted")
        );
    }

}
