# Despliegue ECS Fargate — Grupo Cordillera

Migración de la plataforma desde EC2 + Docker Compose hacia **AWS ECS Fargate**, con Application Load Balancer, ECS Service Connect para comunicación interna, autoscaling por Target Tracking y CI/CD vía GitHub Actions. Iniciada 2026-07-02 dentro de una ventana de validación de 48h (ver `deploy/ecs/aws-resources-created.md` para el detalle cronológico de cada recurso creado).

> El despliegue original en EC2 (`deploy/ec2-{1,2,3,4}/docker-compose.yml`) **no se tocó ni se apagó** durante esta migración — ambos entornos convivieron hasta validar ECS end-to-end.

## Arquitectura

```
                                   Internet
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │  Application Load Balancer         │
                    │  cordillera-alb (público)           │
                    │  Target Group: cordillera-frontend-tg│
                    └──────────────────┬───────────────┘
                                       │ :80
                                       ▼
                    ┌──────────────────────────────────┐
                    │  ECS Service: frontend (nginx)      │
                    │  Fargate 0.25vCPU/512MB · 1 tarea    │
                    └──────────────────┬───────────────┘
                                       │ proxy_pass estático
                                       │ (Service Connect DNS)
                                       ▼
                    ┌──────────────────────────────────┐
                    │  api-gateway.cordillera-dns.local:8080│
                    │  Spring Cloud Gateway · autoscaling   │
                    └──────────────────┬───────────────┘
                                       │ rutas directas por env var
                                       │ ROUTE_*_URI
                    ┌──────────────────┼───────────────────────────────┐
                    ▼                  ▼                               ▼
              bff:8085           ms-auth:8086                  ms-sales:8081
        (autoscaling)                                          ms-inventory:8082
                    │                                           ms-finance:8083
                    │ MS_*_URL (Service Connect)                 ms-customer:8084
                    ▼
        ms-kpis:8091 (autoscaling) · ms-reporting:8092 · ms-data-ingestion:8090
                    │
                    ▼
              RDS PostgreSQL 16 (reutilizado del entorno EC2, mismo Security Group + nueva regla desde ECS tasks SG)
```

Todos los servicios backend (excepto `frontend`) son **privados** — no tienen target group en el ALB ni IP pública (`assignPublicIp: DISABLED`). Se resuelven entre sí exclusivamente por **ECS Service Connect** sobre el namespace privado `cordillera-dns.local` (Cloud Map, tipo `DNS_PRIVATE`), usando URLs directas (`http://<servicio>.cordillera-dns.local:<puerto>`) inyectadas como variables de entorno en cada task definition.

**Nota de diseño importante:** el proyecto originalmente usaba **Netflix Eureka** para descubrimiento de servicios (heredado del entorno EC2). En ECS se evaluó mantenerlo, pero se detectó inestabilidad real (`eureka-server` entrando en ciclos de re-registro/expiración de leases bajo Service Connect, causando 503 intermitentes). Se decidió **abandonar Eureka completamente en ECS** y migrar a URLs directas de Service Connect (`EUREKA_CLIENT_ENABLED=false` en las 12 task definitions). El servicio `eureka-server` se dejó desplegado con `desiredCount=0` (no se eliminó, por si se necesita comparar o revertir). Detalle completo de la investigación en `DOCUMENTACION_TECNICA.md` §12.

## Servicios (12 total)

| Servicio | Puerto | CPU / Memoria | Autoscaling (min-max) | Tipo |
|---|---|---|---|---|
| `frontend` | 80 | 256 / 512 | fijo (1) | Público (ALB) |
| `api-gateway` | 8080 | 512 / 1024 | **1-4** (CPU 60%) | Privado (Service Connect) |
| `bff` | 8085 | 512 / 1024 | **1-4** (CPU 60%) | Privado |
| `ms-auth` | 8086 | 256 / 512 | fijo (1) | Privado |
| `ms-sales` | 8081 | 256 / 512 | fijo (1) | Privado |
| `ms-inventory` | 8082 | 256 / 512 | fijo (1) | Privado |
| `ms-finance` | 8083 | 256 / 512 | fijo (1) | Privado |
| `ms-customer` | 8084 | 256 / 512 | fijo (1) | Privado |
| `ms-kpis` | 8091 | 256 / 512 | **1-4** (CPU 60% + memoria 70%) | Privado |
| `ms-reporting` | 8092 | 256 / 512 | fijo (1) | Privado |
| `ms-data-ingestion` | 8090 | 256 / 512 | fijo (1) | Privado |
| `eureka-server` | 8761 | 512 / 1024 | fijo (0 — apagado, no se usa) | Privado (legacy, no usado) |

Políticas de autoscaling (Target Tracking, `scaleOutCooldown=60s`, `scaleInCooldown=120s`) solo en los 3 servicios con mayor probabilidad de ser cuello de botella bajo carga: `api-gateway`, `bff`, `ms-kpis`. Evidencia de funcionamiento real en `deploy/evidencia/resumen-autoscaling.md`.

## Cómo desplegar

El único flujo soportado es **CI/CD automático** vía GitHub Actions (`.github/workflows/ci-cd.yml`), disparado por push a `main`:

1. Build + push de las 12 imágenes a ECR (`grupocordillera/<servicio>:latest`, y `frontend:ecs`/`frontend:ecs-<sha>` con `Dockerfile.ecs` específico para el entorno ECS).
2. Por cada uno de los 12 servicios: `describe-task-definition` de la revisión actual → swap de la imagen con `jq` → `register-task-definition` (nueva revisión) → `update-service --force-new-deployment`.
3. `aws ecs wait services-stable` por servicio, con manejo consciente del circuit breaker (`deploymentCircuitBreaker.rollback=true` en las 12 definiciones — si un despliegue falla repetidamente, ECS revierte a la última revisión estable sin downtime; ver `deploy/evidencia/resiliencia-circuit-breaker.md`).
4. Verificación final: `curl` al frontend vía ALB.

**Despliegue manual de un solo servicio** (fuera de CI/CD, para hotfixes puntuales):

```bash
# 1. Build y push de la imagen
docker build -t <ecr-repo>/<servicio>:latest .
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 215682485633.dkr.ecr.us-east-2.amazonaws.com
docker push 215682485633.dkr.ecr.us-east-2.amazonaws.com/grupocordillera/<servicio>:latest

# 2. Forzar redeploy (reusa la misma revisión de task def, solo repull de :latest)
aws ecs update-service --cluster cordillera-cluster --service <servicio> \
  --force-new-deployment --region us-east-2

# 3. Esperar estabilización
aws ecs wait services-stable --cluster cordillera-cluster --services <servicio> --region us-east-2
```

**Regenerar task definitions desde cero** (cambios de CPU/memoria/env vars): editar `generate-task-defs.sh` y volver a correrlo — genera los 12 JSON en `task-definitions/` y los registra con `register-task-definition`.

## Cómo ver logs

Cada servicio tiene su propio log group en CloudWatch Logs, formato `/ecs/cordillera/<servicio>`:

```bash
aws logs tail /ecs/cordillera/ms-kpis --region us-east-2 --follow
aws logs tail /ecs/cordillera/api-gateway --region us-east-2 --since 30m
```

Dashboard consolidado (CPU/memoria por servicio, RequestCount/5XX del ALB, latencia, RunningTaskCount): **`cordillera-dashboard`** en CloudWatch — [link a la consola](https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#dashboards:name=cordillera-dashboard). Container Insights está habilitado en el clúster `cordillera-cluster`.

## URLs

- **Frontend / entrada pública:** `http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com`
- **API (vía el mismo ALB, proxied por nginx → api-gateway):** `http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com/api/...`

## Recursos AWS clave

| Recurso | Nombre/Id |
|---|---|
| Clúster ECS | `cordillera-cluster` |
| ALB | `cordillera-alb` (`cordillera-alb-1476500823.us-east-2.elb.amazonaws.com`) |
| Target Group | `cordillera-frontend-tg` (puerto 80, healthcheck `/`) |
| Namespace Service Connect | `cordillera-dns.local` (Cloud Map `DNS_PRIVATE`, `ns-sp6fvam7cj2qtgfg`) |
| Execution Role | `cordilleraEcsTaskExecutionRole` (+ política inline `cordilleraLogsAccess` para `logs:CreateLogGroup`) |
| Secrets | AWS Secrets Manager (credenciales RDS, JWT, Resend) |
| RDS | reutilizado del entorno EC2 (PostgreSQL 16), mismo Security Group + regla nueva desde el SG de tareas ECS |

Detalle completo y cronológico de cada recurso creado (con comandos reales) en `aws-resources-created.md`. Evaluación de qué infraestructura EC2 se reutilizó vs. se creó desde cero en `infra-reuse-evaluation.md`.

## Ventana de costos

Este entorno se levantó dentro de una ventana de validación de 48h (inicio ~2026-07-02 18:49 UTC). Si no se decide continuar operándolo, se debe apagar antes de **2026-07-04 18:49 UTC** para no incurrir en costos no contemplados (ver memoria de proyecto `ecs_migration_window`). El entorno EC2 original permanece intacto como fallback.
