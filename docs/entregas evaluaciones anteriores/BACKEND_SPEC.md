# Backend Specification — Plataforma Grupo Cordillera

## Resumen del Proyecto

Plataforma de monitoreo empresarial basada en microservicios para un holding con múltiples sucursales. El sistema consolida datos de ventas, inventario, finanzas y clientes para generar KPIs y reportes para la Alta Gerencia.

**Monorepo estructura:**

```
cordillera/
├── core-intelligence/
│   ├── ms-data-ingestion/
│   ├── ms-kpis/
│   ├── ms-reporting/
│   └── pom.xml (parent)
├── data-sources/
│   ├── ms-sales/
│   ├── ms-inventory/
│   ├── ms-finance/
│   ├── ms-customer/
│   └── pom.xml (parent)
├── infraestructure/
│   ├── eureka-server/
│   ├── api-gateway/
│   ├── bff/
│   └── pom.xml (parent)
└── pom.xml (root parent)
```

**Reglas globales:**

- Java 17 + Spring Boot 3.2.x + Spring Cloud 2023.0.x
- Cada microservicio es un módulo Maven independiente con su propio `pom.xml`
- Los POMs padre (`data-sources/pom.xml`, `core-intelligence/pom.xml`, `infraestructure/pom.xml`) son solo agregadores con `<packaging>pom</packaging>` y `<modules>`. NO tienen carpeta `src/`.
- El POM raíz (`cordillera/pom.xml`) agrega los 3 módulos padre. NO tiene carpeta `src/`.
- Base package: `cl.fullstack3.{nombre-ms}` (ej: `cl.fullstack3.mssales`, `cl.fullstack3.mskpis`)
- Cada MS usa `application.yml` (NO `application.properties`)
- Cada MS tiene 3 perfiles Spring: `local`, `docker`, `aws`
- PostgreSQL como base de datos. Cada MS conecta a su propia database.
- Migraciones con Flyway (`src/main/resources/db/migration/`)
- Todos los MS se registran en Eureka con `@EnableDiscoveryClient`
- Lombok habilitado en todos los MS
- Swagger/OpenAPI con `springdoc-openapi-starter-webmvc-ui`

---

## Dependencias Maven comunes

Todos los microservicios de data-sources y core-intelligence comparten estas dependencias:

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
</parent>

<properties>
    <java.version>17</java.version>
    <spring-cloud.version>2023.0.1</spring-cloud.version>
</properties>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <!-- PostgreSQL -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!-- Flyway -->
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-database-postgresql</artifactId>
    </dependency>
    <!-- Eureka Client -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    <!-- Actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <!-- Swagger -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.5.0</version>
    </dependency>
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <!-- Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

---

## application.yml base (template para todos los MS)

```yaml
spring:
  application:
    name: ${MS_NAME}  # ej: ms-sales
  profiles:
    active: local
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: ${MS_PORT}

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka}
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 30

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      show-details: always

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

---
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:postgresql://localhost:5432/${DB_NAME}
    username: postgres
    password: postgres

---
spring:
  config:
    activate:
      on-profile: docker
  datasource:
    url: jdbc:postgresql://postgres:5432/${DB_NAME}
    username: postgres
    password: postgres

eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka

---
spring:
  config:
    activate:
      on-profile: aws
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASS}

eureka:
  client:
    service-url:
      defaultZone: http://${EUREKA_HOST}:8761/eureka
```

---

## Estructura de carpetas por microservicio

Cada MS sigue esta estructura (ejemplo con ms-sales):

```
ms-sales/
├── src/
│   ├── main/
│   │   ├── java/cl/fullstack3/mssales/
│   │   │   ├── MsSalesApplication.java
│   │   │   ├── config/
│   │   │   │   └── OpenApiConfig.java
│   │   │   ├── controller/
│   │   │   │   └── VentaController.java
│   │   │   ├── dto/
│   │   │   │   ├── VentaRequestDTO.java
│   │   │   │   └── VentaResponseDTO.java
│   │   │   ├── entity/
│   │   │   │   ├── Venta.java
│   │   │   │   └── DetalleVenta.java
│   │   │   ├── repository/
│   │   │   │   ├── IVentaRepository.java
│   │   │   │   └── IDetalleVentaRepository.java
│   │   │   ├── service/
│   │   │   │   ├── IVentaService.java
│   │   │   │   └── VentaServiceImpl.java
│   │   │   └── exception/
│   │   │       ├── ResourceNotFoundException.java
│   │   │       └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   │           ├── V1__create_tables.sql
│   │           └── V2__seed_data.sql
│   └── test/java/cl/fullstack3/mssales/
│       ├── controller/VentaControllerTest.java
│       └── service/VentaServiceTest.java
├── Dockerfile
└── pom.xml
```

---

## Clase Application (template)

```java
package cl.fullstack3.mssales;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MsSalesApplication {
    public static void main(String[] args) {
        SpringApplication.run(MsSalesApplication.class, args);
    }
}
```

---

## OpenApiConfig (template)

```java
package cl.fullstack3.mssales.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "MS Sales API",
        version = "1.0",
        description = "Microservicio de gestión de ventas — Grupo Cordillera"
    )
)
public class OpenApiConfig {
}
```

---

## GlobalExceptionHandler (template, usar en todos los MS)

```java
package cl.fullstack3.mssales.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "timestamp", LocalDateTime.now(),
            "status", 404,
            "error", "Not Found",
            "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "timestamp", LocalDateTime.now(),
            "status", 500,
            "error", "Internal Server Error",
            "message", ex.getMessage()
        ));
    }
}
```

```java
package cl.fullstack3.mssales.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

---

## Dockerfile (template, usar en todos los MS Java)

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B
COPY src/ src/
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE ${PORT}
ENV JAVA_OPTS="-Xmx160m -Xms64m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

# DATA SOURCE SERVICES

## 1. ms-sales (puerto 8081, db_sales)

### Entidades

```java
@Entity
@Table(name = "venta")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Venta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "sucursal_id", nullable = false)
    private Long sucursalId;

    @Column(name = "cliente_id", nullable = false)
    private Long clienteId;

    @Column(name = "metodo_pago", nullable = false, length = 50)
    private String metodoPago;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleVenta> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (fecha == null) fecha = LocalDateTime.now();
        if (estado == null) estado = "COMPLETADA";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

```java
@Entity
@Table(name = "detalle_venta")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DetalleVenta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id", nullable = false)
    @JsonIgnore
    private Venta venta;

    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (subtotal == null && cantidad != null && precioUnitario != null) {
            subtotal = precioUnitario.multiply(BigDecimal.valueOf(cantidad));
        }
    }
}
```

### DTOs

```java
public record VentaRequestDTO(
    @NotNull BigDecimal monto,
    @NotNull Long sucursalId,
    @NotNull Long clienteId,
    @NotBlank String metodoPago,
    String estado,
    List<DetalleVentaDTO> detalles
) {}

public record DetalleVentaDTO(
    @NotNull Long productoId,
    @NotNull Integer cantidad,
    @NotNull BigDecimal precioUnitario
) {}

public record VentaResponseDTO(
    Long id,
    LocalDateTime fecha,
    BigDecimal monto,
    Long sucursalId,
    Long clienteId,
    String metodoPago,
    String estado,
    List<DetalleVentaDTO> detalles
) {}
```

### Repository

```java
public interface IVentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findBySucursalId(Long sucursalId);
    List<Venta> findByClienteId(Long clienteId);
    List<Venta> findByEstado(String estado);
    List<Venta> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT SUM(v.monto) FROM Venta v WHERE v.sucursalId = :sucursalId AND v.estado = 'COMPLETADA'")
    BigDecimal sumMontoBySucursalId(@Param("sucursalId") Long sucursalId);
}

public interface IDetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {
    List<DetalleVenta> findByVentaId(Long ventaId);
}
```

### Service Interface

```java
public interface IVentaService {
    List<VentaResponseDTO> findAll();
    VentaResponseDTO findById(Long id);
    VentaResponseDTO create(VentaRequestDTO dto);
    VentaResponseDTO update(Long id, VentaRequestDTO dto);
    void delete(Long id);
    List<VentaResponseDTO> findBySucursalId(Long sucursalId);
    List<VentaResponseDTO> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sales` | Listar todas las ventas |
| GET | `/api/sales/{id}` | Obtener venta por ID |
| POST | `/api/sales` | Crear nueva venta con detalles |
| PUT | `/api/sales/{id}` | Actualizar venta |
| DELETE | `/api/sales/{id}` | Eliminar venta |
| GET | `/api/sales/sucursal/{sucursalId}` | Ventas por sucursal |
| GET | `/api/sales/periodo?inicio=&fin=` | Ventas por rango de fecha |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS venta (
    id              BIGSERIAL       PRIMARY KEY,
    fecha           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto           DECIMAL(12,2)   NOT NULL,
    sucursal_id     BIGINT          NOT NULL,
    cliente_id      BIGINT          NOT NULL,
    metodo_pago     VARCHAR(50)     NOT NULL,
    estado          VARCHAR(30)     NOT NULL DEFAULT 'COMPLETADA',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_venta (
    id              BIGSERIAL       PRIMARY KEY,
    venta_id        BIGINT          NOT NULL REFERENCES venta(id) ON DELETE CASCADE,
    producto_id     BIGINT          NOT NULL,
    cantidad        INT             NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2)   NOT NULL CHECK (precio_unitario >= 0),
    subtotal        DECIMAL(12,2)   NOT NULL CHECK (subtotal >= 0),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venta_fecha ON venta(fecha);
CREATE INDEX idx_venta_sucursal ON venta(sucursal_id);
CREATE INDEX idx_venta_cliente ON venta(cliente_id);
CREATE INDEX idx_venta_estado ON venta(estado);
CREATE INDEX idx_detalle_venta_id ON detalle_venta(venta_id);
```

### Flyway V2__seed_data.sql

```sql
INSERT INTO venta (id, fecha, monto, sucursal_id, cliente_id, metodo_pago, estado) VALUES
(1, '2026-01-15 10:30:00', 150000.00, 1, 1, 'DEBITO', 'COMPLETADA'),
(2, '2026-01-16 14:20:00', 85000.00, 1, 2, 'EFECTIVO', 'COMPLETADA'),
(3, '2026-01-17 09:45:00', 320000.00, 2, 3, 'CREDITO', 'COMPLETADA'),
(4, '2026-01-18 11:00:00', 45000.00, 2, 4, 'TRANSFERENCIA', 'COMPLETADA'),
(5, '2026-01-19 16:30:00', 210000.00, 3, 5, 'DEBITO', 'COMPLETADA'),
(6, '2026-02-01 10:00:00', 178000.00, 1, 6, 'CREDITO', 'COMPLETADA'),
(7, '2026-02-05 13:15:00', 92000.00, 3, 7, 'EFECTIVO', 'ANULADA'),
(8, '2026-02-10 15:45:00', 560000.00, 2, 8, 'TRANSFERENCIA', 'COMPLETADA'),
(9, '2026-02-15 08:30:00', 73000.00, 1, 9, 'DEBITO', 'PENDIENTE'),
(10, '2026-03-01 12:00:00', 415000.00, 3, 10, 'CREDITO', 'COMPLETADA');

INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 2, 50000.00, 100000.00), (1, 3, 1, 50000.00, 50000.00),
(2, 2, 5, 17000.00, 85000.00), (3, 5, 4, 80000.00, 320000.00),
(4, 1, 1, 45000.00, 45000.00), (5, 4, 3, 70000.00, 210000.00),
(6, 2, 2, 17000.00, 34000.00), (6, 6, 2, 72000.00, 144000.00),
(7, 3, 4, 23000.00, 92000.00), (8, 7, 8, 70000.00, 560000.00);

SELECT setval('venta_id_seq', 10);
SELECT setval('detalle_venta_id_seq', 10);
```

### application.yml específico

```yaml
spring:
  application:
    name: ms-sales
server:
  port: 8081
# Heredar el resto del template base con DB_NAME=db_sales
```

---

## 2. ms-inventory (puerto 8082, db_inventory)

### Entidades

```java
@Entity
@Table(name = "producto")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Producto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String categoria; // ELECTRONICA, ALIMENTOS, ROPA, HERRAMIENTAS

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Boolean activo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL)
    private List<Stock> stocks = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (activo == null) activo = true;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

```java
@Entity
@Table(name = "stock", uniqueConstraints = @UniqueConstraint(columnNames = {"producto_id", "sucursal_id"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    @JsonIgnore
    private Producto producto;

    @Column(name = "sucursal_id", nullable = false)
    private Long sucursalId;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "stock_minimo", nullable = false)
    private Integer stockMinimo;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist @PreUpdate
    protected void onSave() { fechaActualizacion = LocalDateTime.now(); }
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventory` | Listar productos con stock |
| GET | `/api/inventory/{id}` | Producto por ID con stocks |
| POST | `/api/inventory` | Crear producto |
| PUT | `/api/inventory/{id}` | Actualizar producto |
| GET | `/api/inventory/categoria/{categoria}` | Productos por categoría |
| GET | `/api/inventory/stock/sucursal/{sucursalId}` | Stock por sucursal |
| PUT | `/api/inventory/stock/{productoId}/{sucursalId}` | Actualizar stock |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS producto (
    id          BIGSERIAL       PRIMARY KEY,
    sku         VARCHAR(50)     NOT NULL UNIQUE,
    nombre      VARCHAR(200)    NOT NULL,
    categoria   VARCHAR(100)    NOT NULL,
    precio      DECIMAL(10,2)   NOT NULL CHECK (precio >= 0),
    activo      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock (
    id                  BIGSERIAL   PRIMARY KEY,
    producto_id         BIGINT      NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    sucursal_id         BIGINT      NOT NULL,
    cantidad            INT         NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    stock_minimo        INT         NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    fecha_actualizacion TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, sucursal_id)
);

CREATE INDEX idx_producto_categoria ON producto(categoria);
CREATE INDEX idx_producto_activo ON producto(activo);
CREATE INDEX idx_stock_producto ON stock(producto_id);
CREATE INDEX idx_stock_sucursal ON stock(sucursal_id);
```

---

## 3. ms-finance (puerto 8083, db_finance)

### Entidades

```java
@Entity
@Table(name = "movimiento")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Movimiento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String tipo; // INGRESO, EGRESO

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "sucursal_id", nullable = false)
    private Long sucursalId;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, length = 100)
    private String categoria; // VENTA, COMPRA, SALARIO, SERVICIO, IMPUESTO

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (fecha == null) fecha = LocalDateTime.now();
    }
}
```

```java
@Entity
@Table(name = "balance")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Balance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sucursal_id", nullable = false)
    private Long sucursalId;

    @Column(nullable = false, length = 20)
    private String periodo; // 2026-01, 2026-Q1

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal ingresos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal egresos;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal utilidad;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (utilidad == null) utilidad = ingresos.subtract(egresos);
    }
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/finance/movimientos` | Listar movimientos |
| GET | `/api/finance/movimientos/{id}` | Movimiento por ID |
| POST | `/api/finance/movimientos` | Crear movimiento |
| GET | `/api/finance/movimientos/sucursal/{sucursalId}` | Por sucursal |
| GET | `/api/finance/balances` | Listar balances |
| GET | `/api/finance/balances/sucursal/{sucursalId}` | Balances por sucursal |
| POST | `/api/finance/balances` | Crear balance |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS movimiento (
    id          BIGSERIAL       PRIMARY KEY,
    tipo        VARCHAR(30)     NOT NULL,
    monto       DECIMAL(12,2)   NOT NULL,
    fecha       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sucursal_id BIGINT          NOT NULL,
    descripcion VARCHAR(500),
    categoria   VARCHAR(100)    NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS balance (
    id          BIGSERIAL       PRIMARY KEY,
    sucursal_id BIGINT          NOT NULL,
    periodo     VARCHAR(20)     NOT NULL,
    ingresos    DECIMAL(14,2)   NOT NULL,
    egresos     DECIMAL(14,2)   NOT NULL,
    utilidad    DECIMAL(14,2)   NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mov_sucursal ON movimiento(sucursal_id);
CREATE INDEX idx_mov_tipo ON movimiento(tipo);
CREATE INDEX idx_mov_fecha ON movimiento(fecha);
CREATE INDEX idx_balance_sucursal ON balance(sucursal_id);
CREATE INDEX idx_balance_periodo ON balance(periodo);
```

---

## 4. ms-customer (puerto 8084, db_customer)

### Entidades

```java
@Entity
@Table(name = "cliente")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Cliente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 15)
    private String rut;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String telefono;

    @Column(nullable = false, length = 50)
    private String tipo; // EMPRESA, PERSONA

    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Contacto> contactos = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        fechaRegistro = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

```java
@Entity
@Table(name = "contacto")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Contacto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnore
    private Cliente cliente;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 100)
    private String cargo;

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String telefono;
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/customers` | Listar clientes |
| GET | `/api/customers/{id}` | Cliente por ID con contactos |
| POST | `/api/customers` | Crear cliente con contactos |
| PUT | `/api/customers/{id}` | Actualizar cliente |
| DELETE | `/api/customers/{id}` | Eliminar cliente |
| GET | `/api/customers/tipo/{tipo}` | Clientes por tipo |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS cliente (
    id              BIGSERIAL       PRIMARY KEY,
    rut             VARCHAR(15)     NOT NULL UNIQUE,
    nombre          VARCHAR(200)    NOT NULL,
    email           VARCHAR(150),
    telefono        VARCHAR(20),
    tipo            VARCHAR(50)     NOT NULL,
    fecha_registro  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacto (
    id          BIGSERIAL       PRIMARY KEY,
    cliente_id  BIGINT          NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    nombre      VARCHAR(200)    NOT NULL,
    cargo       VARCHAR(100),
    email       VARCHAR(150),
    telefono    VARCHAR(20)
);

CREATE INDEX idx_cliente_rut ON cliente(rut);
CREATE INDEX idx_cliente_tipo ON cliente(tipo);
CREATE INDEX idx_contacto_cliente ON contacto(cliente_id);
```

---

# CORE INTELLIGENCE SERVICES

## 5. ms-data-ingestion (puerto 8090, db_ingestion)

### Descripción
Microservicio principal del Core. Extrae datos de los 4 Data Source Services vía REST usando WebClient (reactivo) y nombre lógico de Eureka. Consolida los datos para que KPI y Reporting los consuman.

### Dependencias adicionales (además de las comunes)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

### Entidades

```java
@Entity
@Table(name = "ingested_data")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IngestedData {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_service", nullable = false, length = 50)
    private String sourceService; // ms-sales, ms-inventory, ms-finance, ms-customer

    @Column(name = "raw_data", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String rawData;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 30)
    private String status; // SUCCESS, ERROR, PARTIAL

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
```

```java
@Entity
@Table(name = "ingestion_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IngestionLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_date", nullable = false)
    private LocalDateTime executionDate;

    @Column(name = "records_processed")
    private Integer recordsProcessed;

    @Column
    private Integer errors;

    @Column(name = "source_service", length = 50)
    private String sourceService;

    @Column(length = 30)
    private String status;

    @PrePersist
    protected void onCreate() {
        if (executionDate == null) executionDate = LocalDateTime.now();
    }
}
```

### WebClient Config

```java
@Configuration
public class WebClientConfig {

    @Bean
    @LoadBalanced
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
```

### Client classes (uno por Data Source)

```java
@Service
@RequiredArgsConstructor
public class SalesClient {
    private final WebClient.Builder webClientBuilder;

    public Mono<String> fetchSales() {
        return webClientBuilder.build()
            .get()
            .uri("http://ms-sales/api/sales")
            .retrieve()
            .bodyToMono(String.class)
            .onErrorReturn("[]");
    }
}
```

Crear clientes análogos para: `InventoryClient` (http://ms-inventory/api/inventory), `FinanceClient` (http://ms-finance/api/finance/movimientos), `CustomerClient` (http://ms-customer/api/customers).

### Service — lógica de ingesta

El servicio de ingesta debe:
1. Llamar en paralelo a los 4 Data Source Services con `Mono.zip()`
2. Persistir cada respuesta como un `IngestedData` con el sourceService y rawData (JSON)
3. Registrar un `IngestionLog` con el conteo de registros y errores
4. Retornar un resumen de la ingesta

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ingestion/run` | Ejecutar ingesta completa de los 4 DS |
| GET | `/api/ingestion/status` | Último estado de ingesta |
| GET | `/api/ingestion/data/{sourceService}` | Datos ingestados por fuente |
| GET | `/api/ingestion/logs` | Historial de ingestas |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS ingested_data (
    id              BIGSERIAL       PRIMARY KEY,
    source_service  VARCHAR(50)     NOT NULL,
    raw_data        JSONB           NOT NULL,
    timestamp       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(30)     NOT NULL DEFAULT 'SUCCESS'
);

CREATE TABLE IF NOT EXISTS ingestion_log (
    id                  BIGSERIAL   PRIMARY KEY,
    execution_date      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    records_processed   INT         DEFAULT 0,
    errors              INT         DEFAULT 0,
    source_service      VARCHAR(50),
    status              VARCHAR(30) DEFAULT 'SUCCESS'
);

CREATE INDEX idx_ingested_source ON ingested_data(source_service);
CREATE INDEX idx_ingested_timestamp ON ingested_data(timestamp);
CREATE INDEX idx_log_date ON ingestion_log(execution_date);
```

---

## 6. ms-kpis (puerto 8091, db_kpis)

### Descripción
Calcula indicadores clave de rendimiento usando el patrón Factory Method. Consume datos del ms-data-ingestion.

### Entidades

```java
@Entity
@Table(name = "indicador")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Indicador {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo; // KPI-001, KPI-002

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String tipo; // PORCENTUAL, ACUMULADO, PROMEDIO

    @Column(nullable = false, length = 30)
    private String unidad; // PORCENTAJE, CLP, UNIDADES

    @Column(length = 500)
    private String formula;

    @OneToMany(mappedBy = "indicador", cascade = CascadeType.ALL)
    private List<Objetivo> objetivos = new ArrayList<>();

    @OneToMany(mappedBy = "indicador", cascade = CascadeType.ALL)
    private List<Resultado> resultados = new ArrayList<>();
}
```

```java
@Entity
@Table(name = "periodo")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Periodo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer anio;

    @Column(nullable = false)
    private Integer mes;

    private Integer trimestre;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;
}
```

```java
@Entity
@Table(name = "objetivo")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Objetivo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicador_id", nullable = false)
    @JsonIgnore
    private Indicador indicador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id", nullable = false)
    private Periodo periodo;

    @Column(name = "valor_meta", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorMeta;

    @Column(name = "umbral_alerta", precision = 14, scale = 2)
    private BigDecimal umbralAlerta;
}
```

```java
@Entity
@Table(name = "resultado")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Resultado {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicador_id", nullable = false)
    @JsonIgnore
    private Indicador indicador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id", nullable = false)
    private Periodo periodo;

    @Column(name = "valor_real", nullable = false, precision = 14, scale = 2)
    private BigDecimal valorReal;

    @Column(name = "porcentaje_cumplimiento", precision = 6, scale = 2)
    private BigDecimal porcentajeCumplimiento;

    @Column(nullable = false, length = 30)
    private String estado; // CUMPLIDO, EN_RIESGO, CRITICO
}
```

### Factory Method

```java
public interface IKpiCalculator {
    BigDecimal calculate(List<BigDecimal> values);
    String getType();
}
```

```java
@Component
public class KpiPorcentual implements IKpiCalculator {
    @Override
    public BigDecimal calculate(List<BigDecimal> values) {
        if (values.size() < 2) return BigDecimal.ZERO;
        BigDecimal actual = values.get(0);
        BigDecimal objetivo = values.get(1);
        if (objetivo.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return actual.divide(objetivo, 4, RoundingMode.HALF_UP)
                     .multiply(BigDecimal.valueOf(100));
    }

    @Override
    public String getType() { return "PORCENTUAL"; }
}
```

```java
@Component
public class KpiAcumulado implements IKpiCalculator {
    @Override
    public BigDecimal calculate(List<BigDecimal> values) {
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public String getType() { return "ACUMULADO"; }
}
```

```java
@Component
public class KpiPromedio implements IKpiCalculator {
    @Override
    public BigDecimal calculate(List<BigDecimal> values) {
        if (values.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP);
    }

    @Override
    public String getType() { return "PROMEDIO"; }
}
```

```java
@Component
@RequiredArgsConstructor
public class KpiFactory {
    private final List<IKpiCalculator> calculators;

    public IKpiCalculator getCalculator(String tipo) {
        return calculators.stream()
            .filter(c -> c.getType().equalsIgnoreCase(tipo))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Tipo KPI no soportado: " + tipo));
    }
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/kpis` | Listar todos los indicadores |
| GET | `/api/kpis/{id}` | Indicador con objetivos y resultados |
| POST | `/api/kpis` | Crear indicador |
| POST | `/api/kpis/calcular` | Disparar cálculo de KPIs |
| GET | `/api/kpis/{id}/resultado` | Último resultado del indicador |
| GET | `/api/kpis/periodo/{periodoId}` | Resultados por período |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS indicador (
    id      BIGSERIAL       PRIMARY KEY,
    codigo  VARCHAR(30)     NOT NULL UNIQUE,
    nombre  VARCHAR(200)    NOT NULL,
    tipo    VARCHAR(50)     NOT NULL,
    unidad  VARCHAR(30)     NOT NULL,
    formula VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS periodo (
    id          BIGSERIAL   PRIMARY KEY,
    anio        INT         NOT NULL,
    mes         INT         NOT NULL,
    trimestre   INT,
    fecha_inicio DATE       NOT NULL,
    fecha_fin   DATE        NOT NULL
);

CREATE TABLE IF NOT EXISTS objetivo (
    id              BIGSERIAL       PRIMARY KEY,
    indicador_id    BIGINT          NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
    periodo_id      BIGINT          NOT NULL REFERENCES periodo(id),
    valor_meta      DECIMAL(14,2)   NOT NULL,
    umbral_alerta   DECIMAL(14,2)
);

CREATE TABLE IF NOT EXISTS resultado (
    id                      BIGSERIAL       PRIMARY KEY,
    indicador_id            BIGINT          NOT NULL REFERENCES indicador(id) ON DELETE CASCADE,
    periodo_id              BIGINT          NOT NULL REFERENCES periodo(id),
    valor_real              DECIMAL(14,2)   NOT NULL,
    porcentaje_cumplimiento DECIMAL(6,2),
    estado                  VARCHAR(30)     NOT NULL
);

CREATE INDEX idx_objetivo_indicador ON objetivo(indicador_id);
CREATE INDEX idx_objetivo_periodo ON objetivo(periodo_id);
CREATE INDEX idx_resultado_indicador ON resultado(indicador_id);
CREATE INDEX idx_resultado_periodo ON resultado(periodo_id);
```

---

## 7. ms-reporting (puerto 8092, db_reporting)

### Descripción
Genera reportes consolidados combinando datos de Data Ingestion y KPI. Almacena los reportes como JSONB.

### Entidades

```java
@Entity
@Table(name = "reporte")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Reporte {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String tipo; // VENTAS_POR_SUCURSAL, INVENTARIO_CONSOLIDADO, KPI_MENSUAL, BALANCE_FINANCIERO

    @Column(nullable = false, length = 300)
    private String titulo;

    @Column(name = "fecha_generacion", nullable = false)
    private LocalDateTime fechaGeneracion;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String parametros;

    @Column(nullable = false, length = 30)
    private String estado; // GENERADO, ERROR, EN_PROCESO

    @OneToMany(mappedBy = "reporte", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContenidoReporte> contenidos = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        fechaGeneracion = LocalDateTime.now();
        if (estado == null) estado = "EN_PROCESO";
    }
}
```

```java
@Entity
@Table(name = "contenido_reporte")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ContenidoReporte {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporte_id", nullable = false)
    @JsonIgnore
    private Reporte reporte;

    @Column(nullable = false, length = 100)
    private String seccion;

    @Column(name = "datos_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String datosJson;

    @Column
    private Integer orden;
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reports` | Listar reportes |
| GET | `/api/reports/{id}` | Reporte con contenido |
| POST | `/api/reports/generate` | Generar nuevo reporte (body: tipo + parámetros) |
| DELETE | `/api/reports/{id}` | Eliminar reporte |
| GET | `/api/reports/tipo/{tipo}` | Reportes por tipo |

### Flyway V1__create_tables.sql

```sql
CREATE TABLE IF NOT EXISTS reporte (
    id                  BIGSERIAL       PRIMARY KEY,
    tipo                VARCHAR(50)     NOT NULL,
    titulo              VARCHAR(300)    NOT NULL,
    fecha_generacion    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parametros          JSONB,
    estado              VARCHAR(30)     NOT NULL DEFAULT 'EN_PROCESO'
);

CREATE TABLE IF NOT EXISTS contenido_reporte (
    id          BIGSERIAL       PRIMARY KEY,
    reporte_id  BIGINT          NOT NULL REFERENCES reporte(id) ON DELETE CASCADE,
    seccion     VARCHAR(100)    NOT NULL,
    datos_json  JSONB           NOT NULL,
    orden       INT
);

CREATE INDEX idx_reporte_tipo ON reporte(tipo);
CREATE INDEX idx_reporte_fecha ON reporte(fecha_generacion);
CREATE INDEX idx_contenido_reporte ON contenido_reporte(reporte_id);
```

---

# INFRAESTRUCTURA

## 8. eureka-server (puerto 8761)

### Dependencia principal

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency>
```

NO incluir spring-boot-starter-data-jpa, postgresql, flyway ni swagger.

### Application

```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

### application.yml

```yaml
server:
  port: 8761

spring:
  application:
    name: eureka-server

eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
    service-url:
      defaultZone: http://localhost:8761/eureka
  server:
    wait-time-in-ms-when-sync-empty: 0
    enable-self-preservation: false
```

---

## 9. api-gateway (puerto 8080)

### Dependencias principales

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

NO incluir spring-boot-starter-web (gateway usa WebFlux, no MVC). NO incluir JPA ni PostgreSQL.

### Application

```java
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```

### application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: bff-route
          uri: lb://bff
          predicates:
            - Path=/api/dashboard/**,/api/kpis/**,/api/reports/**
        - id: sales-route
          uri: lb://ms-sales
          predicates:
            - Path=/api/sales/**
        - id: inventory-route
          uri: lb://ms-inventory
          predicates:
            - Path=/api/inventory/**
        - id: finance-route
          uri: lb://ms-finance
          predicates:
            - Path=/api/finance/**
        - id: customer-route
          uri: lb://ms-customer
          predicates:
            - Path=/api/customers/**
        - id: ingestion-route
          uri: lb://ms-data-ingestion
          predicates:
            - Path=/api/ingestion/**
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins: "*"
            allowedMethods: "*"
            allowedHeaders: "*"

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka}
  instance:
    prefer-ip-address: true
```

---

## 10. bff (puerto 8085)

### Descripción
Backend For Frontend. Orquesta llamadas a los 3 MS del Core Intelligence, agrega datos y retorna un JSON consolidado (Dashboard Data) para el frontend. Incluye Circuit Breaker con Resilience4j.

### Dependencias principales

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

NO incluir JPA ni PostgreSQL (BFF no tiene base de datos propia).

### Application

```java
@SpringBootApplication
@EnableDiscoveryClient
public class BffApplication {
    public static void main(String[] args) {
        SpringApplication.run(BffApplication.class, args);
    }
}
```

### WebClient Config

```java
@Configuration
public class WebClientConfig {
    @Bean
    @LoadBalanced
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
```

### Dashboard DTO (respuesta consolidada para el frontend)

```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardDataDTO {
    private DashboardSummary summary;
    private List<KpiDTO> kpis;
    private List<VentaPorSucursalDTO> ventasPorSucursal;
    private List<TendenciaDTO> tendencia;
    private boolean degraded; // true si algún servicio no respondió (fallback)
    private String degradedMessage;
    private LocalDateTime generatedAt;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardSummary {
    private BigDecimal ventasTotales;
    private BigDecimal inventarioValorizado;
    private BigDecimal margenFinanciero;
    private Integer clientesActivos;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class KpiDTO {
    private String codigo;
    private String nombre;
    private String tipo;
    private BigDecimal valorReal;
    private BigDecimal valorMeta;
    private BigDecimal porcentajeCumplimiento;
    private String estado;
    private String unidad;
}
```

### DashboardService (orquestación con Circuit Breaker)

```java
@Service
@RequiredArgsConstructor
public class DashboardService {
    private final WebClient.Builder webClientBuilder;

    @CircuitBreaker(name = "kpisService", fallbackMethod = "getKpisFallback")
    public List<KpiDTO> getKpis() {
        return webClientBuilder.build()
            .get()
            .uri("http://ms-kpis/api/kpis")
            .retrieve()
            .bodyToFlux(KpiDTO.class)
            .collectList()
            .block();
    }

    public List<KpiDTO> getKpisFallback(Throwable t) {
        return Collections.emptyList();
    }

    @CircuitBreaker(name = "reportingService", fallbackMethod = "getReportsFallback")
    public Object getReports() {
        return webClientBuilder.build()
            .get()
            .uri("http://ms-reporting/api/reports")
            .retrieve()
            .bodyToMono(Object.class)
            .block();
    }

    public Object getReportsFallback(Throwable t) {
        return Map.of("message", "Servicio de reportes no disponible", "degraded", true);
    }

    @CircuitBreaker(name = "ingestionService", fallbackMethod = "getIngestionFallback")
    public Object getIngestionStatus() {
        return webClientBuilder.build()
            .get()
            .uri("http://ms-data-ingestion/api/ingestion/status")
            .retrieve()
            .bodyToMono(Object.class)
            .block();
    }

    public Object getIngestionFallback(Throwable t) {
        return Map.of("message", "Servicio de ingesta no disponible", "degraded", true);
    }

    // Método principal que orquesta todo para el dashboard
    public DashboardDataDTO getDashboardData() {
        boolean degraded = false;
        String degradedMsg = null;

        List<KpiDTO> kpis;
        try {
            kpis = getKpis();
        } catch (Exception e) {
            kpis = Collections.emptyList();
            degraded = true;
            degradedMsg = "KPIs no disponibles";
        }

        return DashboardDataDTO.builder()
            .kpis(kpis)
            .degraded(degraded)
            .degradedMessage(degradedMsg)
            .generatedAt(LocalDateTime.now())
            .build();
    }
}
```

### Controller Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard consolidado (Dashboard Data JSON) |
| GET | `/api/kpis` | Proxy a ms-kpis con Circuit Breaker |
| GET | `/api/reports` | Proxy a ms-reporting con Circuit Breaker |
| POST | `/api/reports/generate` | Proxy a ms-reporting para generar reporte |
| GET | `/api/health/circuit-breakers` | Estado de los Circuit Breakers |

### application.yml

```yaml
server:
  port: 8085

spring:
  application:
    name: bff

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_URL:http://localhost:8761/eureka}
  instance:
    prefer-ip-address: true

resilience4j:
  circuitbreaker:
    instances:
      kpisService:
        register-health-indicator: true
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        automatic-transition-from-open-to-half-open-enabled: true
      reportingService:
        register-health-indicator: true
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
      ingestionService:
        register-health-indicator: true
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s

management:
  endpoints:
    web:
      exposure:
        include: health,info,circuitbreakers,circuitbreakerevents
  health:
    circuitbreakers:
      enabled: true
```

---

# DOCKER COMPOSE — Desarrollo local

### docker-compose-local.yml (levantar PostgreSQL + Eureka para desarrollo)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### init-databases.sql

```sql
CREATE DATABASE db_sales;
CREATE DATABASE db_inventory;
CREATE DATABASE db_finance;
CREATE DATABASE db_customer;
CREATE DATABASE db_ingestion;
CREATE DATABASE db_kpis;
CREATE DATABASE db_reporting;
```

---

# TESTS

Cada MS debe tener cobertura mínima de 60% con JUnit 5 + Mockito.

### Tests mínimos por MS de Data Source:

- `ServiceTest`: test de crear, buscar por ID, listar, validación de campo requerido (4 tests)
- `ControllerTest`: test de GET /api/{resource}, POST, GET /{id} con MockMvc (3 tests)

### Tests mínimos por MS del Core:

- `ms-data-ingestion`: test de ingesta con WebClient mockeado, test de manejo de error
- `ms-kpis`: test de KpiFactory (3 tipos), test de cálculo, test de repository query
- `ms-reporting`: test de generación por tipo, test de consolidación

### Tests del BFF:

- Test de orquestación de DashboardService con WebClient mockeado
- Test de fallback del Circuit Breaker (simular falla → verificar respuesta degradada)
- Test de DashboardController con MockMvc

---

# ORDEN DE DESARROLLO SUGERIDO

1. Levantar `docker-compose-local.yml` (PostgreSQL con 7 BDs)
2. Construir `eureka-server` y verificar dashboard en :8761
3. Construir `ms-sales` completo (referencia para los otros 3 DS)
4. Replicar patrón en `ms-inventory`, `ms-finance`, `ms-customer`
5. Construir `ms-data-ingestion` (necesita que al menos 1 DS esté corriendo)
6. Construir `ms-kpis` con Factory Method
7. Construir `ms-reporting`
8. Construir `api-gateway` (rutas a todos los MS)
9. Construir `bff` con Circuit Breaker (necesita que Core esté corriendo)
10. Tests unitarios
11. Dockerfiles + docker-compose por capa
