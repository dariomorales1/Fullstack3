package cl.fullstack3.pedidos360.catalog.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI catalogOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("ms-catalog - Pedidos360")
                .description("Catalogo de productos y control de stock")
                .version("v1"));
    }
}
