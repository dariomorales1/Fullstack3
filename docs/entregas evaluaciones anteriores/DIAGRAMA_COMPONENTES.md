# Diagrama de Componentes — Grupo Cordillera

Usa el bloque Mermaid de abajo para generar el diagrama. Pégalo en cualquier editor compatible (Mermaid Live, GitHub, Notion, etc.).

---

## Arquitectura del sistema

```mermaid
graph TD
    %% Usuario
    USER([Usuario / Navegador])

    %% Frontend
    subgraph FRONTEND["Frontend — React 19 / Vite :5173"]
        FE[SPA React\nDashboard · KPIs · Ventas\nClientes · Inventario · Informes]
    end

    %% Gateway
    subgraph INFRA["Infraestructura"]
        GW[API Gateway\nSpring Cloud Gateway\n:8080]
        EUR[Eureka Server\nService Registry\n:8761]
        AUTH[ms-auth\nJWT Authentication\n:8086]
    end

    %% BFF
    subgraph BFF_LAYER["BFF — Backend for Frontend :8085"]
        BFF[BFF\nAgrega: KPIs · Reporting · Ingestion\nResiliencia: Resilience4j Circuit Breaker]
    end

    %% Core Intelligence
    subgraph CORE["Core Intelligence"]
        KPIS[ms-kpis\n:8091\nIndicadores y resultados]
        INGEST[ms-data-ingestion\n:8090\nIngesta y normalización]
        REPORT[ms-reporting\n:8092\nGeneración de informes\nFactory Method Pattern]
    end

    %% Data Sources
    subgraph DATASOURCES["Data Sources"]
        SALES[ms-sales\n:8081]
        INV[ms-inventory\n:8082]
        FIN[ms-finance\n:8083]
        CUST[ms-customer\n:8084]
    end

    %% Base de datos
    subgraph DB["Persistencia — PostgreSQL 16 RDS"]
        DB_AUTH[(db_auth)]
        DB_SALES[(db_sales)]
        DB_INV[(db_inventory)]
        DB_FIN[(db_finance)]
        DB_CUST[(db_customer)]
        DB_KPIS[(db_kpis)]
        DB_ING[(db_ingestion)]
        DB_REP[(db_reporting)]
    end

    %% Flujo principal
    USER -->|HTTPS| FE
    FE -->|REST /api/*| GW
    GW -->|/api/auth/**| AUTH
    GW -->|/api/dashboard\n/api/kpis\n/api/reports| BFF
    GW -->|/api/sales| SALES
    GW -->|/api/inventory| INV
    GW -->|/api/finance| FIN
    GW -->|/api/customers| CUST
    GW -->|/api/ingestion| INGEST

    %% BFF llama a Core Intelligence
    BFF -->|WebClient| KPIS
    BFF -->|WebClient| INGEST
    BFF -->|WebClient| REPORT

    %% Ingestion consume Data Sources
    INGEST -->|WebClient| SALES
    INGEST -->|WebClient| INV
    INGEST -->|WebClient| FIN
    INGEST -->|WebClient| CUST

    %% Registro en Eureka
    GW -.->|registro| EUR
    BFF -.->|registro| EUR
    AUTH -.->|registro| EUR
    KPIS -.->|registro| EUR
    INGEST -.->|registro| EUR
    REPORT -.->|registro| EUR
    SALES -.->|registro| EUR
    INV -.->|registro| EUR
    FIN -.->|registro| EUR
    CUST -.->|registro| EUR

    %% Persistencia JPA
    AUTH --- DB_AUTH
    SALES --- DB_SALES
    INV --- DB_INV
    FIN --- DB_FIN
    CUST --- DB_CUST
    KPIS --- DB_KPIS
    INGEST --- DB_ING
    REPORT --- DB_REP
```

---

## Descripción de los flujos principales

| Flujo | Ruta |
|---|---|
| Login | Frontend → Gateway → ms-auth → db_auth |
| Dashboard / KPIs | Frontend → Gateway → BFF → ms-kpis → db_kpis |
| Ingesta de datos | Frontend → Gateway → BFF → ms-data-ingestion → ms-sales/inventory/finance/customer |
| Generación de informes | Frontend → Gateway → BFF → ms-reporting → db_reporting |
| CRUD Ventas | Frontend → Gateway → ms-sales → db_sales |
| CRUD Clientes | Frontend → Gateway → ms-customer → db_customer |
| CRUD Inventario | Frontend → Gateway → ms-inventory → db_inventory |
| CRUD Finanzas | Frontend → Gateway → ms-finance → db_finance |

---

## Tecnologías por capa

| Componente | Tecnología |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Recharts, Axios |
| API Gateway | Spring Cloud Gateway (reactivo) |
| Service Registry | Eureka Server |
| BFF | Spring Boot 3.5.6, WebClient, Resilience4j |
| Microservicios | Spring Boot 3.5.6, Java 21, Spring Data JPA |
| Autenticación | JWT (ms-auth) |
| Base de datos | PostgreSQL 16 (RDS en AWS) |
| Contenerización | Docker, AWS ECR |
| Infraestructura | AWS VPC, EC2 t3.micro, RDS |
