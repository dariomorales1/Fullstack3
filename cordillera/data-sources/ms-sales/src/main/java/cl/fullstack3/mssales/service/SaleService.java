package cl.fullstack3.mssales.service;

import cl.fullstack3.mssales.model.Sale;
import cl.fullstack3.mssales.repository.ISaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SaleService {

    private final ISaleRepository saleRepository;

    public SaleService(ISaleRepository saleRepository) {
        this.saleRepository = saleRepository;
    }

    public List<Sale> findAll() {
        return saleRepository.findAll();
    }

    public Optional<Sale> findById(Long id) {
        return saleRepository.findById(id);
    }

    public Sale save(Sale sale) {

        //validaciones basicas
        if (sale.getAmount() == null || sale.getAmount().signum() <=0) {
            throw new IllegalArgumentException("Sale amount must be greater than 0");
        }
        if (sale.getDate() == null) {
            sale.setDate(LocalDateTime.now());
        }

        if (sale.getDetails() != null) {
            sale.getDetails().forEach(detail -> detail.setSale(sale));
        }

        return saleRepository.save(sale);

    }

    public void deleteById(Long id) {
        saleRepository.deleteById(id);
    }

}
