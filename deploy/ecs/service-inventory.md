# Inventario de servicios para migración a ECS Fargate

> Generado en Fase 0 (2026-07-02) a partir de: `deploy/ec2-{1,2,3,4}/docker-compose.yml`, `application.yml` de cada microservicio, `pom.xml` de cada módulo, y `frontend/grupoCordillera/nginx.conf`. Fuente de verdad — no asumir nada que contradiga este archivo o `DOCUMENTACION_TECNICA.md`.

## Hallazgo bloqueante antes de Fase 3

**Solo `api-gateway` tiene `spring-boot-starter-actuator` en su `pom.xml`.** Los otros 10 servicios (incluidos `bff` y `eureka-server`, que ya tienen `management.endpoints.web.exposure.include` configurado en su `application.yml` pero **sin la dependencia real** — configuración huérfana, mismo patrón de bug que otros ya documentados en `DOCUMENTACION_TECNICA.md`) no exponen `/actuator/health`. ECS `healthCheck` de contenedor y el Target Group del ALB (para `frontend`) dependen de que ese endpoint responda `200`.

**Acción requerida antes de Fase 3:** agregar `spring-boot-starter-actuator` a los 10 servicios restantes. Al ser un `pom.xml` padre común (`cordillera/pom.xml`), lo más simple es agregarlo ahí una sola vez (heredado por los 11 módulos) y luego `management.endpoints.web.exposure.include: health` como default razonable por servicio (algunos, como `bff`, ya quieren exponer más: `health,info,circuitbreakers,circuitbreakerevents`). Frontend (nginx) no lo necesita — su health check es `GET /`.

## Decisión pendiente de confirmar: Service Connect vs mantener Eureka

Los 11 microservicios usan hoy `spring-cloud-starter-netflix-eureka-client` y resolución `lb://<servicio>` (Spring Cloud LoadBalancer) para llamarse entre sí — `api-gateway` enruta a `lb://ms-sales`, `lb://ms-auth`, etc.; `bff` llama a `lb://ms-kpis`, `lb://ms-reporting`, `lb://ms-data-ingestion`.

Dato clave para la decisión: el bug documentado en §8 de `DOCUMENTACION_TECNICA.md` (Eureka registrando la IP interna del **bridge de Docker**, no ruteable entre hosts EC2) **desaparece solo con pasar a Fargate en modo `awsvpc`**, incluso sin tocar Eureka — en `awsvpc` cada tarea recibe una ENI real con IP de la VPC (ruteable), no una IP de red bridge local. Esto abre dos caminos igual de válidos:

1. **Camino "seguro" (menos cambios de código):** mantener `eureka-server` como un servicio ECS más, sin tocar la lógica `lb://` de los 11 servicios. Solo hay que apuntar `EUREKA_URL` al DNS de Service Connect de `eureka-server` (ej. `http://eureka-server.cordillera.local:8761/eureka/`) en vez de la IP fija `10.0.2.107` actual. Riesgo bajo, cero cambios en Java.
2. **Camino "pauta completa" (lo que pide el prompt):** migrar todas las llamadas `lb://` a URLs Service Connect directas y remover Eureka del flujo — requiere tocar `application.yml` (y posiblemente clases `WebClient`/`RestClient` config) de los 11 servicios, más quitar la dependencia de Eureka client del `pom.xml` raíz.

**Recomendación para Fase 2:** camino 1 como base (mantener Eureka, ya está probado y funcionando tras el trabajo de hoy), documentando explícitamente en la presentación que Service Connect + `awsvpc` ya resuelve el bug de raíz aunque Eureka siga activo — es un argumento igual de fuerte para la pauta sin arriesgar romper 11 servicios bajo presión de tiempo. Si sobra tiempo tras validar el camino 1, migrar 1-2 servicios (ej. `api-gateway`→`bff`) a Service Connect puro como demostración adicional, sin forzarlo en los 11.

## Tabla de servicios

| # | Servicio | Repo ECR | Puerto | CPU / Memoria propuesta (Fargate) | Depende de RDS | Variables de entorno (planas) | Secretos (Secrets Manager) | Health check |
|---|---|---|---|---|---|---|---|---|
| 1 | `eureka-server` | `grupocordillera/eureka-server` | 8761 | 0.25 vCPU / 512 MB | No | `SPRING_DOCKER_COMPOSE_ENABLED=false`, `JAVA_OPTS=-Xmx128m -Xms64m` | — | `/actuator/health` (requiere agregar actuator) |
| 2 | `api-gateway` | `grupocordillera/api-gateway` | 8080 | 0.5 vCPU / 1024 MB | No | `EUREKA_URL`, `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true`, `SPRING_DOCKER_COMPOSE_ENABLED=false`, `JAVA_OPTS=-Xmx160m -Xms64m` | — | `/actuator/health` (ya tiene actuator; hoy expone `gateway,health`) |
| 3 | `ms-auth` | `grupocordillera/ms-auth` | 8086 | 0.25 vCPU / 512 MB | Sí (`db_auth`) | `EUREKA_URL`, `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true`, `SPRING_FLYWAY_ENABLED=true`, `SPRING_JPA_HIBERNATE_DDL_AUTO=update`, `SPRING_DOCKER_COMPOSE_ENABLED=false`, `RESEND_FROM_EMAIL`, `FRONTEND_URL` (DNS del ALB), `SPRING_DATASOURCE_URL=jdbc:postgresql://<RDS_ENDPOINT>:5432/db_auth`, `SPRING_DATASOURCE_USERNAME=cordillera_admin`, `JAVA_OPTS=-Xmx160m -Xms64m` | `DB_PASSWORD`, `JWT_SECRET`, `RESEND_API_KEY` | `/actuator/health` (requiere agregar actuator) |
| 4 | `bff` | `grupocordillera/bff` | 8085 | 0.5 vCPU / 1024 MB | No | `EUREKA_URL`, `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true`, `SPRING_DOCKER_COMPOSE_ENABLED=false`, `JAVA_OPTS=-Xmx160m -Xms64m` | — | `/actuator/health` (requiere agregar actuator; ya tiene exposure de `circuitbreakers` configurado en yml, huérfano) |
| 5 | `ms-sales` | `grupocordillera/ms-sales` | 8081 | 0.25 vCPU / 512 MB | Sí (`db_sales`) | `EUREKA_URL`, `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true`, `SPRING_FLYWAY_ENABLED=true`, `SPRING_JPA_HIBERNATE_DDL_AUTO=update`, `SPRING_DOCKER_COMPOSE_ENABLED=false`, `SPRING_DATASOURCE_URL=jdbc:postgresql://<RDS_ENDPOINT>:5432/db_sales`, `SPRING_DATASOURCE_USERNAME=cordillera_admin`, `JAVA_OPTS=-Xmx96m -Xms48m` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 6 | `ms-inventory` | `grupocordillera/ms-inventory` | 8082 | 0.25 vCPU / 512 MB | Sí (`db_inventory`) | idem patrón #5 con `db_inventory` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 7 | `ms-finance` | `grupocordillera/ms-finance` | 8083 | 0.25 vCPU / 512 MB | Sí (`db_finance`) | idem patrón #5 con `db_finance` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 8 | `ms-customer` | `grupocordillera/ms-customer` | 8084 | 0.25 vCPU / 512 MB | Sí (`db_customer`) | idem patrón #5 con `db_customer` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 9 | `ms-data-ingestion` | `grupocordillera/ms-data-ingestion` | 8090 | 0.25 vCPU / 512 MB | Sí (`db_ingestion`) | idem patrón #5 con `db_ingestion` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 10 | `ms-kpis` | `grupocordillera/ms-kpis` | 8091 | 0.25 vCPU / 512 MB (candidato a autoscaling demo, Fase 6) | Sí (`db_kpis`) | idem patrón #5 con `db_kpis` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 11 | `ms-reporting` | `grupocordillera/ms-reporting` | 8092 | 0.25 vCPU / 512 MB | Sí (`db_reporting`) | idem patrón #5 con `db_reporting` | `DB_PASSWORD` | `/actuator/health` (requiere agregar actuator) |
| 12 | `frontend` | `grupocordillera/frontend` | 80 | 0.25 vCPU / 512 MB | No | — (nginx estático; `proxy_pass /api/` debe apuntar al DNS de Service Connect de `api-gateway`, hoy apunta a `http://api-gateway:8080` nombre de contenedor Docker Compose) | — | `/` (nginx sirve `index.html`, 200 siempre que el contenedor esté up) |

**Notas sobre `SPRING_DATASOURCE_URL`:** en producción EC2 actual se pasa como env var completa (`jdbc:postgresql://${RDS_ENDPOINT}:5432/db_X`), no se arma desde `DB_HOST`/`DB_USER`/`DB_PASS` del `application.yml` (esos son defaults de desarrollo local). Mantener el mismo patrón en las task definitions de ECS: una env var `SPRING_DATASOURCE_URL` completa por servicio, más `SPRING_DATASOURCE_USERNAME=cordillera_admin` plano y `SPRING_DATASOURCE_PASSWORD` como secreto.

**`RDS_ENDPOINT`** (`cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com`) no cambia — se reutiliza tal cual, ver evaluación de infraestructura en `DOCUMENTACION_TECNICA.md` §11 (a agregar tras esta fase).

**`JAVA_OPTS` (`-Xmx`/`-Xms`)** fueron ajustados para caber en instancias t3.micro (1GB RAM compartida entre 2-4 contenedores). Con Fargate, cada tarea tiene su memoria dedicada (512MB/1024MB según tabla) — se pueden subir estos límites de heap (ej. `-Xmx400m` para tareas de 512MB, dejando margen para el resto de la JVM/metaspace), pero no es obligatorio para que funcione; se puede dejar igual en el primer corte y ajustar si se observa memoria ociosa o `OutOfMemoryError`.
