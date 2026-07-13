# Arquitectura y configuración del clúster — Grupo Cordillera (IE9)

> Migración de despliegue: 4 EC2 + Docker Compose → AWS ECS Fargate + ALB + Autoscaling + CI/CD. Todos los datos de este documento están verificados contra AWS real (`aws ecs describe-services`, `aws ec2 describe-route-tables`, `aws elbv2 describe-load-balancers`, `aws iam get-role`), no son valores asumidos.

---

## 1. Arquitectura final seleccionada: ECS Fargate

Se migró desde 4 EC2 + Docker Compose hacia **AWS ECS con capacity type Fargate** (serverless, sin gestión de nodos), reemplazando por completo el mecanismo de despliegue manual por SSH.

**Por qué ECS y no EKS:**
- El equipo no tenía experiencia previa con Kubernetes; ECS permite cumplir el 100% de la pauta (Target Tracking, ALB, ECR, Service Connect) sin la sobrecarga operativa de administrar un plano de control EKS en una ventana de tiempo corta.
- Fargate elimina la gestión de instancias/AMI/parcheo que sí existía en el modelo EC2 anterior (instancias t3.micro con 8GB de disco ajustado, rotación manual de logs Docker).
- El proyecto ya usaba Docker Compose como unidad de despliegue por servicio — ECS Task Definitions es el salto natural (1 task definition ≈ 1 servicio del `docker-compose.yml` anterior), mientras que EKS habría exigido reescribir todo como manifiestos Kubernetes desde cero.

---

## 2. Configuración del clúster

### 2.1 Capacity Providers
Capacity type: **Fargate** puro en los 12 servicios (`launchType: FARGATE`, sin `capacityProviderStrategy`) — no se usó `FARGATE_SPOT`.

### 2.2 Redes, subredes y Security Groups

Red reutilizada completa de la infraestructura EC2 existente, con una subred pública nueva agregada para dar cobertura multi-AZ al ALB:

| Recurso | ID | Detalle |
|---|---|---|
| VPC | `vpc-0b9c0a321dc30fa83` | `10.0.0.0/16` (`cordillera-vpc`) |
| Subred pública 2a (ALB) | `subnet-0d026163d43190d68` | `10.0.1.0/24`, us-east-2a |
| Subred pública 2b (ALB, **nueva**) | `subnet-04fcc3db49c063a8b` | `10.0.4.0/24`, us-east-2b, `MapPublicIpOnLaunch=true` |
| Subred privada 2a (tareas ECS) | `subnet-0c37930ff9a14e070` | `10.0.2.0/24`, us-east-2a |
| Subred privada 2b (tareas ECS + RDS) | `subnet-01ee6cc30cb65eee9` | `10.0.3.0/24`, us-east-2b |
| Route table privada | `rtb-03c7217fc4d221f6d` (`cordillera-rt-private`) | `0.0.0.0/0 → i-05d008dd7dd644af4` (NAT instance EC2-1), asociada a ambas subredes privadas — verificado activo |

Security Groups:

| SG | ID | Aplica a |
|---|---|---|
| SG-DATABASE | `sg-0835efe9646e1028c` | RDS — regla agregada permitiendo 5432 desde el SG de tareas ECS |
| SG-PUBLIC (legado EC2) | `sg-0f02d2dd03261cc21` | EC2-1, se mantiene mientras el entorno EC2 sigue vivo en paralelo |
| SG de tareas ECS | `sg-05aaf94b0ea27a976` (`cordillera-ecs-tasks-sg`) | Asignado a las 12 tareas ECS |
| SG del ALB | `sg-0267285fc37855075` (`cordillera-alb-sg`) | Asignado al Load Balancer |

### 2.3 Roles IAM

| Rol | Función | Detalle |
|---|---|---|
| Task Execution Role | Pull de imágenes ECR, logs a CloudWatch, lectura de secretos | `arn:aws:iam::215682485633:role/cordilleraEcsTaskExecutionRole` — policy administrada `AmazonECSTaskExecutionRolePolicy` + inline `cordilleraSecretsAccess` + `cordilleraLogsAccess` |
| Task Role | Permisos de la app en runtime hacia APIs de AWS | No configurado (`taskRoleArn: null` en las 12 task definitions) — ningún microservicio llama SDK de AWS directo en runtime; Resend se usa vía API HTTP con key desde Secrets Manager |
| Node Role | No aplica en Fargate (no hay EC2 gestionadas por el usuario) | — |

---

## 3. Justificación técnica de las decisiones arquitectónicas

**Se abandonó Eureka en el entorno ECS.** Se migró primero manteniendo Eureka también en ECS (menor cambio percibido), pero bajo Service Connect `eureka-server` entraba en ciclos de re-registro (`lease doesn't exist, registering resource`), causando 503 intermitentes en `/api/auth/login` y otros endpoints. Se descartó CPU/memoria como causa (6-13% medido en CloudWatch) y se corrigieron 3 bugs reales en el camino:

1. Namespace HTTP de Service Connect sin DNS real resoluble por `resolver` dinámico de nginx.
2. `clientAliases[].dnsName` con nombre corto en vez de FQDN.
3. `EUREKA_INSTANCE_INSTANCE_ID` colisionando entre tareas por compartir la IP link-local del metadata endpoint (`169.254.172.2`).

Ninguno de los tres resolvió la inestabilidad por sí solo. Decisión final: abandonar Eureka por completo (`EUREKA_CLIENT_ENABLED=false` en las 12 task definitions), usando URLs directas de Service Connect. Verificado con 100% de respuestas 200/201 y cero 503 en pruebas repetidas contra los 6 endpoints principales.

**Bug adicional encontrado en el pivote:** URLs hardcodeadas `host.docker.internal` en 3 clientes del `bff` (`KpisClient`, `IngestionClient`, `ReportingClient`) que nunca funcionaron en ningún entorno, enmascaradas por `onErrorResume`. Corregidas y externalizadas a variables de entorno (`MS_KPIS_URL`, etc.).

**Por qué esto importa para la exposición:** la migración no fue solo "copiar configuración a ECS" — expuso bugs latentes del diseño original (incluida la lógica de descubrimiento de servicios) que no se manifestaban de la misma forma en EC2.

---

## 4. Cómo la solución garantiza escalabilidad, alta disponibilidad, tolerancia a fallos y automatización

### 4.1 Escalabilidad
Target Tracking (Application Auto Scaling) en `api-gateway`, `bff` y `ms-kpis`: CPU al 60% en los tres, memoria adicional al 70% en `ms-kpis`. `min=1, max=4`.

Prueba de carga real: `k6`, 50 VUs sostenidos 3 minutos contra `/api/kpis` vía ALB → 3.664 requests, **0.00% de error**, p95 5.45s. `ms-kpis` escaló de 1→2 tareas en 34 segundos. Siguió escalando hasta el máximo (4 tareas) incluso después de terminada la carga, por el pico de CPU del cold-start de JVM en las tareas nuevas retroalimentando la métrica — el techo `maxCapacity` contuvo el sobreescalado sin intervención manual.

### 4.2 Alta disponibilidad
- ALB desplegado en **2 AZ reales**: us-east-2a (`subnet-0d026163d43190d68`) y us-east-2b (`subnet-04fcc3db49c063a8b`, subred creada específicamente para esta migración).
- Tareas ECS configuradas en ambas subredes privadas (us-east-2a y us-east-2b) — ECS puede reubicar una tarea reemplazada en cualquiera de las 2 zonas.
- Tareas backend sin IP pública (`assignPublicIp: DISABLED`), solo alcanzables vía Service Connect.
- Salida a internet desde ambas subredes privadas confirmada activa vía NAT instance (necesaria para pull de ECR, Secrets Manager y CloudWatch Logs).
- **Matiz honesto:** con `desiredCount=1` en 9 de los 12 servicios (todos salvo `api-gateway`, `bff`, `ms-kpis`), la cobertura multi-AZ es "dónde puede reubicarse la tarea tras un fallo", no "redundancia simultánea en ambas zonas" para esos 9 servicios.

### 4.3 Tolerancia a fallos
- **Caída de tarea** (probado en `ms-reporting`): ECS repuso la tarea automáticamente en 3-4 minutos sin intervención manual, garantizado por el `desiredCount` declarativo.
- **Deploy con imagen rota** (probado en `ms-reporting`, tag inexistente): la revisión estable nunca dejó de servir tráfico (cero downtime). El `deploymentCircuitBreaker` automático no llegó a marcar el deployment como `FAILED` dentro de los ~11 minutos observados con `desiredCount=1`; se forzó un revert manual. Resultado presentado tal cual ocurrió — evidencia honesta en vez de una afirmación de rollback 100% automático no confirmada.

### 4.4 Automatización operativa
- CI/CD: `.github/workflows/ci-cd.yml` — push a `main` dispara build → push a ECR → `register-task-definition` + `update-service --force-new-deployment` + `wait services-stable` en los 12 servicios.
- Secretos vía AWS Secrets Manager (RDS, JWT, Resend), sin credenciales en texto plano en el repo.
- Observabilidad: CloudWatch Logs por servicio, Container Insights habilitado, dashboard centralizado.

---

## 5. Checklist de screenshots para la presentación

Orden sugerido para ir tomándolas de corrido en una sola sesión en la consola AWS (región **us-east-2**, cuenta `215682485633`):

| # | Qué mostrar | Ruta en la consola AWS |
|---|---|---|
| 1 | Clúster ECS y capacity provider Fargate | **ECS** → *Clusters* → `cordillera-cluster` → pestaña **Infrastructure** |
| 2 | Los 12 servicios corriendo | **ECS** → `cordillera-cluster` → pestaña **Services** (lista completa con `Desired`/`Running` count) |
| 3 | Task Definition de un servicio (CPU/memoria, imagen ECR, roles) | **ECS** → *Task definitions* → seleccionar una (ej. `api-gateway`) → última revisión |
| 4 | Networking de un servicio (VPC, subredes, SG asignados) | **ECS** → `cordillera-cluster` → servicio `api-gateway` → pestaña **Networking** |
| 5 | Service Connect / DNS interno | **ECS** → `cordillera-cluster` → servicio `api-gateway` → pestaña **Service Connect** (o **Configuration**) |
| 6 | Subredes de la VPC con sus AZ | **VPC** → *Subnets* → filtrar por `vpc-0b9c0a321dc30fa83` |
| 7 | Route table privada con la ruta hacia la NAT instance | **VPC** → *Route tables* → `rtb-03c7217fc4d221f6d` → pestaña **Routes** |
| 8 | Security Groups (tareas ECS y ALB) | **VPC** → *Security Groups* → `sg-05aaf94b0ea27a976` y `sg-0267285fc37855075` → pestaña **Inbound rules** |
| 9 | Roles IAM (Task Execution Role y sus políticas) | **IAM** → *Roles* → `cordilleraEcsTaskExecutionRole` → pestaña **Permissions** |
| 10 | ALB y sus AZ | **EC2** → *Load Balancers* → `cordillera-alb` → pestaña **Availability Zones** (y **Listeners** para mostrar el forwarding al target group) |
| 11 | Target Group del frontend | **EC2** → *Target Groups* → `cordillera-frontend-tg` → pestaña **Targets** (estado `healthy`) |
| 12 | Política de Autoscaling (Target Tracking) | **ECS** → servicio `ms-kpis` → pestaña **Auto Scaling** (o **ECS** → *Clusters* → servicio → **Health and metrics** según la vista) |
| 13 | Métricas de escalado real (RunningTaskCount subiendo) | **CloudWatch** → *Dashboards* → `cordillera-dashboard`, idealmente capturada durante o justo después de correr la prueba `k6` |
| 14 | Historial de deployments (evidencia de resiliencia) | **ECS** → servicio `ms-reporting` → pestaña **Deployments** (mostrar el evento de tarea repuesta y el intento con imagen rota) |
| 15 | Logs en vivo de un contenedor | **CloudWatch** → *Log groups* → `/ecs/cordillera/ms-kpis` (o cualquiera) → abrir el log stream más reciente |
| 16 | Secretos gestionados (sin revelar valores) | **Secrets Manager** → lista de secretos (RDS, JWT, Resend) |
| 17 | Pipeline CI/CD corriendo exitosamente | **GitHub** → repo → pestaña **Actions** → una corrida reciente en verde, con los pasos build → push ECR → deploy expandidos |
| 18 | Frontend accesible públicamente | Navegador → URL del ALB (`http://<DNS-de-cordillera-alb>`) mostrando la app cargada |

**Para la demo en vivo** (no son screenshots previas, son capturas de pantalla completa/grabación durante la exposición):
- Terminal con el loop de `aws ecs describe-services --query '[desiredCount,runningCount]'` mientras corre la carga de `k6`.
- El push a `main` disparando el workflow en GitHub Actions en tiempo real.
- `aws ecs stop-task` matando una tarea y su reposición automática en la consola ECS refrescando.

