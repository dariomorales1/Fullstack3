package cl.fullstack3.apigateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("bff-dashboard", r -> r.path("/api/dashboard", "/api/dashboard/**")
                        .uri("http://host.docker.internal:8085"))
                .route("bff-kpis", r -> r.path("/api/kpis", "/api/kpis/**")
                        .uri("http://host.docker.internal:8085"))
                .route("bff-reports", r -> r.path("/api/reports", "/api/reports/**")
                        .uri("http://host.docker.internal:8085"))
                .route("sales-route", r -> r.path("/api/sales", "/api/sales/**")
                        .uri("http://host.docker.internal:8081"))
                .route("inventory-route", r -> r.path("/api/inventory", "/api/inventory/**")
                        .uri("http://host.docker.internal:8082"))
                .route("finance-route", r -> r.path("/api/finance", "/api/finance/**")
                        .uri("http://host.docker.internal:8083"))
                .route("customer-route", r -> r.path("/api/customers", "/api/customers/**")
                        .uri("http://host.docker.internal:8084"))
                .route("ingestion-route", r -> r.path("/api/ingestion", "/api/ingestion/**")
                        .uri("http://host.docker.internal:8090"))
                .build();
    }
}
