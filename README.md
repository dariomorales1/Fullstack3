# Pedidos360 — Plataforma cloud-native de pedidos y despacho

Sistema fullstack de microservicios para gestión de pedidos, catálogo, notificaciones,
reportería y auditoría de una red de PyMEs. Proyecto de **DSY1107 Desarrollo Cloud Native I**
(EVA3 — Encargo Kafka 12% · EFT — Caso Pedidos360 40%).

> Este repositorio migró desde el sistema previo "Grupo Cordillera". El historial anterior
> permanece en git; los documentos legacy están en `docs/legacy-cordillera/` y los assets de
> marca reutilizables en `brand/`.

---

## Stack objetivo

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 3.5.6 (monorepo Maven, 8 microservicios) |
| Frontend | Angular 18+ · MSAL (Azure AD) — *pendiente Fase 6* |
| Identidad (IDaaS) | Azure AD / Entra External ID (OAuth2 / OpenID Connect) |
| API Manager | Azure API Management (APIM) |
| Colas (commands) | RabbitMQ (colas + DLQ + exchanges direct/topic) |
| Streaming (events) | Apache Kafka + Zookeeper + Kafka-UI |
| Base de datos | PostgreSQL 16 (local) / Azure Database for PostgreSQL (cloud) |
| Orquestación local | Docker Compose |

## Microservicios (`backend/`)

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| `ms-bff` | 8085 | Valida JWT del IDaaS y enruta a los microservicios |
| `ms-orders` | 8081 | CRUD pedidos + estados; produce a Kafka y RabbitMQ |
| `ms-catalog` | 8082 | CRUD productos y stock |
| `ms-notify` | 8083 | Consumidor RabbitMQ (email/push/cocina/factura) |
| `ms-report` | 8084 | Consumidor Kafka (KPIs en tiempo real) |
| `ms-audit` | 8086 | Consumidor Kafka (timeline de auditoría) |
| `ms-admin-rabbit` | 8087 | Administra colas, exchanges y bindings de RabbitMQ |
| `ms-admin-kafka` | 8088 | Administra tópicos, configuraciones y consumer groups de Kafka |

Estados de pedido: `CREADO → ACEPTADO → EN_PREPARACIÓN → DESPACHADO → ENTREGADO / CANCELADO`
(no se puede despachar sin aceptar).

---

## Cómo levantar (estado actual — Fase 0)

### 1. Infraestructura (Docker)

```bash
docker compose -f infra/docker-compose.yml up -d
```

| Servicio | URL / Puerto | Credenciales |
|---|---|---|
| PostgreSQL | localhost:5432 | pedidos360 / pedidos360 |
| RabbitMQ (AMQP) | localhost:5672 | pedidos360 / pedidos360 |
| RabbitMQ (UI) | http://localhost:15672 | pedidos360 / pedidos360 |
| Kafka (broker) | localhost:9092 | — |
| Kafka-UI | http://localhost:8090 | — |

### 2. Backend

```bash
cd backend
./mvnw clean install          # compila los 8 microservicios
./mvnw spring-boot:run -pl ms-orders   # ejecutar un servicio (ejemplo)
```

Verificación rápida de un servicio: `GET http://localhost:8081/api/orders/ping`
y Swagger UI en `http://localhost:8081/swagger-ui.html`.

### 3. Frontend

Pendiente (Fase 6 — Angular). Ver `frontend/README.md`.

---

## Roadmap por fases

- [x] **Fase 0** — Scaffold: monorepo Pedidos360 + infra docker-compose base + 8 esqueletos Spring Boot.
- [ ] **Fase 1** — Topología de mensajería (clúster RabbitMQ 2 nodos, Kafka 3 ZK + 3 brokers).
- [ ] **Fase 2** — Core de negocio: `ms-orders` + `ms-catalog` + BD + CRUD + estados + OpenAPI.
- [ ] **Fase 3** — RabbitMQ: producer/consumer, DLQ, `ms-admin-rabbit`, exchanges direct+topic.
- [ ] **Fase 4** — Kafka: productores/consumidores con DTO, DLT, consumer groups, `ms-admin-kafka`.
- [ ] **Fase 5** — Seguridad: validación JWT (oauth2 resource server) + autorización por rol.
- [ ] **Fase 6** — Frontend Angular + MSAL (login, guards por rol, pantallas).
- [ ] **Fase 7** — Nube Azure: Azure AD (tenant), APIM, despliegue en contenedores.
- [ ] **Fase 8** — Informe + presentación.
