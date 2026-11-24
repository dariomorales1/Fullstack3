package cl.fullstack3.pedidos360.orders.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/** Implementacion REST del cliente de catalogo. */
@Component
public class RestCatalogClient implements CatalogClient {

    private final RestClient rest;

    public RestCatalogClient(RestClient.Builder builder,
                             @Value("${pedidos360.catalog.base-url:http://localhost:8082}") String baseUrl) {
        this.rest = builder.baseUrl(baseUrl).build();
    }

    @Override
    public void descontarStock(Long productoId, int cantidad) {
        rest.post()
                .uri("/api/catalog/products/{id}/descontar-stock", productoId)
                .body(Map.of("cantidad", cantidad))
                .retrieve()
                .toBodilessEntity();
    }
}
