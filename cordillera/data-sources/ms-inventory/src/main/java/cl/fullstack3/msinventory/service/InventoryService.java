package cl.fullstack3.msinventory.service;

import cl.fullstack3.msinventory.dto.MessageResponse;
import cl.fullstack3.msinventory.model.Product;
import cl.fullstack3.msinventory.repository.IProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    private final IProductRepository productRepository;

    public InventoryService(IProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> findProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        if (product.getStocks() != null) {
            product.getStocks().forEach(stock -> {
                stock.setProduct(product);
                if (stock.getLastUpdated() == null) {
                    stock.setLastUpdated(LocalDateTime.now());
                }
            });
        }
        return productRepository.save(product);
    }

}
