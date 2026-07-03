# Grupo Cordillera — Plataforma de Gestión Empresarial

Sistema fullstack de microservicios para la gestión de ventas, clientes, inventario, KPIs e informes ejecutivos.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 3.5.6 · Spring Cloud |
| Base de datos | PostgreSQL 16 |
| Service registry | Eureka Server |
| API Gateway | Spring Cloud Gateway |
| Frontend | React 19 · Vite · Tailwind CSS |
| Tests backend | JUnit 5 · Mockito · JaCoCo |
| Tests frontend | Vitest · Testing Library · jsdom |
| Infraestructura | AWS (VPC · EC2 t3.micro · RDS) · Docker · ECR |

---

## Estructura del monorepo

```
cordillera/
├── infraestructure/
│   ├── eureka-server/       # Registro de servicios         :8761
│   ├── api-gateway/         # Punto de entrada único        :8080
│   ├── ms-auth/             # Autenticación JWT             :8086
│   └── bff/                 # Backend for Frontend          :8085
│
├── core-intelligence/
│   ├── ms-kpis/             # Indicadores y resultados      :8091
│   ├── ms-data-ingestion/   # Ingesta de datos              :8090
│   └── ms-reporting/        # Generación de informes        :8092
│
├── data-sources/
│   ├── ms-sales/            # Ventas                        :8081
│   ├── ms-inventory/        # Inventario                    :8082
│   ├── ms-finance/          # Finanzas                      :8083
│   └── ms-customer/         # Clientes                      :8084
│
└── frontend/
    └── grupoCordillera/     # SPA React                     :5173
```

---

## Requisitos previos

- Java 21
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16 (o acceso a RDS)
- Docker (opcional, para levantar en contenedores)

---

## Levantar el proyecto

### Backend

Desde `cordillera/`:

```bash
# Compilar todo el monorepo
mvn clean install -DskipTests

# Orden de arranque recomendado:
# 1. Eureka Server
cd infraestructure/eureka-server && mvn spring-boot:run

# 2. ms-auth
cd infraestructure/ms-auth && mvn spring-boot:run

# 3. Microservicios de datos (en paralelo)
cd data-sources/ms-sales      && mvn spring-boot:run
cd data-sources/ms-inventory  && mvn spring-boot:run
cd data-sources/ms-finance    && mvn spring-boot:run
cd data-sources/ms-customer   && mvn spring-boot:run

# 4. Core intelligence (en paralelo)
cd core-intelligence/ms-data-ingestion && mvn spring-boot:run
cd core-intelligence/ms-kpis           && mvn spring-boot:run
cd core-intelligence/ms-reporting      && mvn spring-boot:run

# 5. BFF y Gateway
cd infraestructure/bff         && mvn spring-boot:run
cd infraestructure/api-gateway && mvn spring-boot:run
```

### Frontend

Desde `cordillera/frontend/grupoCordillera/`:

```bash
npm install
npm run dev
```

Abre http://localhost:5173

---

## Tests

### Backend

Desde `cordillera/`:

```bash
# Todos los microservicios
mvn test

# Por microservicio
mvn test -pl core-intelligence/ms-kpis
mvn test -pl core-intelligence/ms-reporting
mvn test -pl core-intelligence/ms-data-ingestion
mvn test -pl infraestructure/ms-auth
mvn test -pl data-sources/ms-customer
mvn test -pl data-sources/ms-sales

# Reporte de cobertura JaCoCo (HTML en target/site/jacoco/index.html)
mvn test jacoco:report -pl core-intelligence/ms-kpis
mvn test jacoco:report -pl core-intelligence/ms-reporting
```

Coberturas obtenidas:

| Microservicio | Cobertura |
|---|---|
| ms-kpis | 74% |
| ms-reporting | >60% |

### Frontend

Desde `cordillera/frontend/grupoCordillera/`:

```bash
# Ejecutar todos los tests (74 tests)
npm test

# Con reporte de cobertura (HTML en coverage/index.html)
npm run test:coverage

# Modo watch
npm run test:watch
```

Cobertura frontend: **84% statements · 88% lines**

Archivos de test cubiertos:

| Área | Archivos |
|---|---|
| Utils | `formatters.test.js` |
| API | `authApi`, `customersApi`, `salesApi`, `kpisApi`, `reportsApi`, `dashboardApi` |
| Hooks | `useCustomers`, `useSales`, `useKpis`, `useReports` |
| Context | `AuthContext` |
| Componentes | `KpiCard`, `StatusBadge` |
| Router | `ProtectedRoute` |

---

## Puertos de los servicios

| Servicio | Puerto |
|---|---|
| Eureka Server | 8761 |
| API Gateway | 8080 |
| ms-auth | 8086 |
| BFF | 8085 |
| ms-sales | 8081 |
| ms-inventory | 8082 |
| ms-finance | 8083 |
| ms-customer | 8084 |
| ms-data-ingestion | 8090 |
| ms-kpis | 8091 |
| ms-reporting | 8092 |
| Frontend (dev) | 5173 |

---

## Variables de entorno requeridas

Cada microservicio requiere las siguientes variables (configuradas en `application.yml` o como env vars):

```
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<db>
SPRING_DATASOURCE_USERNAME=<usuario>
SPRING_DATASOURCE_PASSWORD=<contraseña>
JWT_SECRET=<clave-secreta>
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://localhost:8761/eureka
```
