# Informe Ejecutivo - Plataforma Grupo Cordillera

**Fecha de emision:** 11 mayo 2026  
**Equipo:** Fullstack 3 - Grupo Cordillera  
**Repositorio:** `dariomorales1/Fullstack3`  
**Rama principal:** `develop`

---

## 1. Descripcion general del proyecto

La Plataforma Grupo Cordillera es un sistema de monitoreo empresarial basado en microservicios, orientado a la Alta Gerencia. Consolida informacion de ventas, inventario, finanzas y clientes para generar KPIs, reportes analiticos y un dashboard ejecutivo.

La solucion utiliza una arquitectura desacoplada con:

- registro de servicios en Eureka
- entrada unificada por API Gateway
- orquestacion selectiva a traves de un BFF
- autenticacion JWT en `ms-auth`
- frontend React con vistas operativas y exportacion de informacion

---

## 2. Stack tecnologico

| Capa | Tecnologia | Version |
|---|---|---|
| Lenguaje backend | Java | 21 |
| Framework backend | Spring Boot | 4.0.5 |
| Nube de servicios | Spring Cloud | 2025.1.1 |
| ORM | Hibernate / Spring Data JPA | 7.x |
| Migraciones BD | Flyway | 11.x |
| Base de datos | PostgreSQL | 16 |
| Autenticacion | JWT (JJWT) | 0.12.6 |
| Seguridad | Spring Security | 7.x |
| Comunicacion reactiva | Spring WebFlux / WebClient | 4.0.5 |
| Circuit Breaker | Resilience4j | 3.x |
| Registro de servicios | Netflix Eureka Server/Client | 5.0.x |
| Build backend | Maven multi-modulo | 3.x |
| Framework frontend | React | 19.2.x |
| Bundler frontend | Vite | 8.0.x |
| Estilos | Tailwind CSS | 4.x |
| Enrutamiento frontend | React Router DOM | 7.15.x |
| Iconos | Lucide React | 1.14.x |
| Contenedores | Docker / Docker Compose | - |

---

## 3. Arquitectura actual

```text
Frontend React :5173
        |
   [API Gateway :8080]
        |
   +----+-------------------------------+
   |                                    |
   |                             Data Sources
   |                       +------+------+------+------+
   |                       |      |      |      |      |
   |                    sales   inv    fin    cust   auth*
   |
 [BFF :8085]
   |
   +-----------+-------------+
   |           |             |
 [ms-kpis] [ms-reporting] [ms-data-ingestion]
```

`* ms-auth` es consumido directamente por el frontend en `http://localhost:8086`.

### Flujo principal

1. El frontend consume `dashboard`, `kpis` y `reports` a traves del `api-gateway`, que deriva esas rutas al `bff`.
2. El `bff` orquesta llamadas hacia `ms-kpis`, `ms-reporting` y `ms-data-ingestion`.
3. `ms-data-ingestion` consolida datos desde `ms-sales`, `ms-inventory`, `ms-finance` y `ms-customer`.
4. Las vistas operativas `sales`, `inventory`, `finance` y `customers` se consumen por `api-gateway` directamente hacia sus microservicios.
5. La autenticacion y recuperacion de credenciales se resuelven mediante `ms-auth`.

### Nota operativa local

Para estabilizar el funcionamiento en Docker local, el `api-gateway` y el `bff` usan actualmente rutas explicitas a `host.docker.internal` para algunos destinos. Eureka sigue presente como parte de la arquitectura, pero el enrutamiento local no depende exclusivamente de discovery en este estado del proyecto.

---

## 4. Estructura del monorepo

```text
Fullstack3/
|-- docker-compose.yml
`-- cordillera/
    |-- pom.xml
    |-- compose.yaml
    |-- init-databases.sql
    |-- API_ENDPOINTS.md
    |-- INFORME_EJECUTIVO.md
    |
    |-- data-sources/
    |   |-- ms-sales/
    |   |-- ms-inventory/
    |   |-- ms-finance/
    |   `-- ms-customer/
    |
    |-- core-intelligence/
    |   |-- ms-data-ingestion/
    |   |-- ms-kpis/
    |   `-- ms-reporting/
    |
    |-- infraestructure/
    |   |-- eureka-server/
    |   |-- api-gateway/
    |   |-- bff/
    |   `-- ms-auth/
    |
    `-- frontend/
        `-- grupoCordillera/
```

---

## 5. Microservicios

### 5.1 Data Sources

| MS | Puerto | BD | Entidades principales | Responsabilidad |
|---|---|---|---|---|
| ms-sales | 8081 | db_sales | Sale, SaleDetail | CRUD de ventas |
| ms-inventory | 8082 | db_inventory | Product, Stock | CRUD de productos y stock |
| ms-finance | 8083 | db_finance | Movement, Balance | Movimientos y balances |
| ms-customer | 8084 | db_customer | Customer, Contact | Clientes y contactos |

### 5.2 Core Intelligence

| MS | Puerto | BD | Responsabilidad | Patron principal |
|---|---|---|---|---|
| ms-data-ingestion | 8090 | db_ingestion | Ingesta paralela desde Data Sources | WebClient + agregacion |
| ms-kpis | 8091 | db_kpis | Calculo y consulta de KPIs | Factory Method |
| ms-reporting | 8092 | db_reporting | Generacion y consulta de reportes | Factory Method |

### 5.3 Infraestructura

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| eureka-server | 8761 | Registro y descubrimiento de servicios |
| api-gateway | 8080 | Punto de entrada unico, CORS y enrutamiento |
| bff | 8085 | Orquestacion reactiva y respuestas consolidadas |
| ms-auth | 8086 | Autenticacion JWT y recuperacion de credenciales |

---

## 6. Patrones de diseno implementados

| Patron | Donde se aplica |
|---|---|
| Factory Method | `ms-kpis` para resolver calculadores por tipo |
| Factory Method | `ms-reporting` para resolver generadores por tipo de reporte |
| Repository Pattern | Todos los microservicios con persistencia JPA |
| Circuit Breaker | `bff` con Resilience4j hacia servicios de inteligencia |
| BFF | `bff` como capa de agregacion para dashboard, kpis y reportes |
| Service Discovery | Registro de servicios en Eureka |
| API Gateway | Enrutamiento centralizado con Spring Cloud Gateway |

---

## 7. Seguridad y CORS

- Autenticacion JWT con firma HS256 en `ms-auth`.
- Backend stateless con Spring Security.
- Passwords almacenadas con BCrypt.
- Endpoints publicos principales:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - flujo de recuperacion de password
- Endpoints protegidos:
  - consumo operativo del frontend con token Bearer
- CORS centralizado en `api-gateway`.
- El `api-gateway` deduplica headers CORS para evitar respuestas con `Access-Control-Allow-Origin` duplicado.

---

## 8. Base de datos

Cada microservicio mantiene su propia base de datos PostgreSQL.

| Base de datos | MS propietario | Tablas principales |
|---|---|---|
| db_sales | ms-sales | sale, sale_detail |
| db_inventory | ms-inventory | product, stock |
| db_finance | ms-finance | movement, balance |
| db_customer | ms-customer | customer, contact |
| db_ingestion | ms-data-ingestion | ingested_data, ingestion_log |
| db_kpis | ms-kpis | indicador, periodo, objetivo, resultado |
| db_reporting | ms-reporting | reporte, contenido_reporte |
| db_auth | ms-auth | users |

Las migraciones siguen gestionadas con Flyway por servicio.

---

## 9. Frontend

**Stack:** React 19 + Vite 8 + Tailwind CSS 4 + React Router DOM 7 + Lucide React

### Estado actual

| Componente | Estado |
|---|---|
| Rutas publicas y privadas | Completo |
| AuthContext y manejo de token | Completo |
| Layout principal (Sidebar, AppLayout, TopHeader) | Completo |
| axiosInstance e interceptores | Completo |
| Login, registro, forgot password, reset password | Completo |
| DashboardPage | Completo |
| SalesPage | Completo |
| InventoryPage | Completo |
| FinancePage | Completo |
| CustomersPage | Completo |
| ReportsPage | Completo |
| KpisPage | Completo |
| APIs del frontend por modulo | Completo |
| Hooks de consumo por vista | Completo |
| Exportacion a Excel | Completo |

### Capacidades funcionales implementadas

- Dashboard con exportacion de datos consolidados.
- Ventas con filtros por rango, sucursal y estado.
- Ventas con formulario `New Sale` para registrar nuevas ventas.
- Inventario con filtro por estado.
- Inventario con formulario `Add Product` para crear productos.
- Inventario con exportacion operacional.
- Finanzas con alta de movimientos desde `New Movement`.
- Finanzas con descarga de datos e impresion.
- Reportes con exportacion, recarga visual y mensaje de disponibilidad futura para alertas PRO.
- KPIs con exportacion y filtros avanzados aplicados sobre la grilla.

---

## 10. Integracion y despliegue local

El repositorio incluye `compose.yaml` dentro de `cordillera/` y `docker-compose.yml` en la raiz de `Fullstack3/`.

### Estado actual de despliegue local

- `compose.yaml` fue alineado para usar:
  - red nombrada `cordillera-net`
  - volumen nombrado `cordillera-pgdata`
- `api-gateway` concentra CORS y rutas de acceso del frontend.
- `bff` consume actualmente `ms-kpis`, `ms-reporting` y `ms-data-ingestion` por URL explicita de host en entorno Docker local.
- `api-gateway` enruta:
  - `dashboard`, `kpis`, `reports` hacia `bff`
  - `sales`, `inventory`, `finance`, `customers`, `ingestion` hacia sus servicios correspondientes

### Comando general

```bash
docker compose down -v
docker compose up --build
```

---

## 11. Historial de versiones

### v0.1.0 - Inicializacion del proyecto
**Fecha:** 16-17 abril 2026

- Creacion del monorepo Maven y estructura modular.
- Base comun de Spring Boot, Spring Cloud y Java 21.

### v0.2.0 - Data Sources
**Fecha:** 20-22 abril 2026

- Implementacion inicial de `ms-sales`, `ms-inventory`, `ms-finance` y `ms-customer`.
- CRUD REST, JPA y Flyway para los servicios de origen.

### v0.3.0 - Data Ingestion
**Fecha:** 22 abril 2026

- Implementacion de `ms-data-ingestion`.
- Consumo paralelo de Data Sources con WebClient.

### v0.4.0 - KPIs
**Fecha:** 22 abril 2026

- Implementacion de `ms-kpis`.
- Calculo de indicadores con Factory Method.

### v0.5.0 - Reporting
**Fecha:** 22 abril 2026

- Implementacion de `ms-reporting`.
- Reportes consolidados con generadores especializados.

### v0.6.0 - BFF y dashboard consolidado
**Fecha:** 23 abril 2026

- `bff` con `Mono.zip()` y Circuit Breaker.
- Consolidacion de dashboard, kpis y reportes.

### v0.7.0 - Dockerizacion y ms-auth
**Fecha:** 4-6 mayo 2026

- Dockerizacion del stack.
- Incorporacion de `ms-auth` con JWT.
- Registro de servicios en Eureka.

### v1.0.0 - Integracion funcional de frontend e infraestructura
**Fecha:** 11 mayo 2026

- Correccion de CORS en `api-gateway` y deduplicacion de headers.
- Enrutamiento explicito en `api-gateway` para estabilizar el acceso local.
- Ajuste de clientes del `bff` para consumo local via `host.docker.internal`.
- Integracion operativa de todas las vistas del frontend.
- Exportacion a Excel en dashboard, inventario, finanzas, reportes y KPIs.
- Formularios funcionales para crear ventas, productos y movimientos financieros.
- Correccion en `ms-inventory` para asociar `Stock` con `Product` al guardar.
- Alineacion de `compose.yaml` con nombres de red y volumen persistente.

---

## 12. Metricas del proyecto

| Indicador | Valor estimado |
|---|---|
| Total microservicios | 10 |
| Bases de datos independientes | 8 |
| Frontend con modulos operativos | 7 vistas principales + autenticacion |
| Endpoints REST | 40+ |
| Patrones de diseno implementados | 7 |
| Exportaciones operativas | 5 modulos |

---

## 13. Estado actual y pendientes

### Estado actual

- El frontend navega y consume correctamente los modulos principales.
- Los errores de CORS que afectaban dashboard, reportes y demas modulos fueron resueltos.
- Las paginas operativas ya permiten consultar y, en los casos implementados, registrar informacion nueva.
- La exportacion de informacion ya esta disponible desde los modulos ejecutivos principales.

### Pendientes recomendados

- Externalizar las URLs `host.docker.internal` a variables de entorno o propiedades.
- Homogeneizar completamente el despliegue local usando una sola definicion de Compose para evitar mezclas de redes.
- Agregar health checks adicionales y validacion de readiness para todos los microservicios.
- Incorporar pruebas automatizadas de integracion para gateway, bff y flujos CRUD del frontend.
- Revisar optimizacion de bundle del frontend para reducir la advertencia de tamano emitida por Vite.

---

## 14. Conclusion ejecutiva

La plataforma ya se encuentra en un estado funcional integrado para demostracion y operacion local. El sistema dispone de autenticacion, microservicios desacoplados, agregacion de inteligencia de negocio, frontend operativo y exportacion de informacion ejecutiva.

El foco siguiente ya no es construir la base funcional, sino endurecer la operacion: estandarizar el despliegue Docker, parametrizar rutas locales, reforzar pruebas de integracion y preparar el stack para una ejecucion mas cercana a produccion.
