package cl.fullstack3.pedidos360.orders.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ordersOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("ms-orders - Pedidos360")
                .description("Gestion de pedidos y maquina de estados")
                .version("v1"));
    }
}
