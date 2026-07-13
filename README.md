<div align="center">

<!-- Banner -->
<img src="https://img.shields.io/badge/%20-DUOC%20UC-003B71?style=for-the-badge&labelColor=003B71" alt="Duoc UC"/>
<img src="https://img.shields.io/badge/Escuela%20de-Informática%20y%20Telecomunicaciones-AC4FC6?style=for-the-badge&labelColor=AC4FC6" alt="Escuela"/>

<br/><br/>

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="12" fill="#0f172a" stroke="#ffffff"/>
  <path d="M14 33L21 20L26 28L29 24L34 33H14Z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26 28L23 25L26 28Z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  
</svg>

</div>

# Grupo Cordillera

### Plataforma de Monitoreo Empresarial

<br/>

<img src="https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java 21"/>
<img src="https://img.shields.io/badge/Spring%20Boot-4.0.5-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot"/>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
<img src="https://img.shields.io/badge/Docker-Compose%20v2-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
<img src="https://img.shields.io/badge/AWS-ECS%20Fargate-FF9900?style=flat-square&logo=amazonecs&logoColor=white" alt="ECS"/>
<img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="Actions"/>

<br/><br/>

| | |
|---|---|
| **Asignatura** | ISY1101 — Introducción a Herramientas DevOps |
| **Semestre** | 2026-1 · Duoc UC |
| **Equipo** | Rodrigo Jara · Darío Morales · Felipe Ulloa |

<br/>

[📖 Documentación Técnica](docs/DOCUMENTACION_TECNICA.md) · [🚀 Cómo desplegar](#-despliegue-rápido) · [🏗️ Arquitectura](#-arquitectura) · [📂 Estructura del repo](#-estructura-del-repositorio)

---

</div>

<br/>

## 📋 Sobre el proyecto

**Grupo Cordillera** centraliza indicadores de **ventas, inventario, finanzas y clientes** para la alta gerencia de un holding retail, consolidando datos de múltiples sucursales en un dashboard ejecutivo único.

El sistema se compone de **12 servicios** (11 microservicios Spring Boot + 1 frontend React) organizados en tres capas funcionales, desplegados sobre **AWS ECS Fargate** con pipeline de CI/CD completamente automatizado.

> **Evolución del proyecto a lo largo del semestre:**
>
> | Evaluación | Hito principal |
> |---|---|
> | **EP1** | Infraestructura base AWS (VPC, 4 EC2, RDS) + despliegue manual con Docker Compose |
> | **EP2** | Contenedorización de los 12 servicios + pipeline CI/CD con GitHub Actions + Amazon ECR |
> | **EP3** | Migración a ECS Fargate como orquestador + Service Connect + autoscaling + ALB + Secrets Manager |

<br/>

## 👥 Equipo y responsabilidades

<table>
  <tr>
    <th>Integrante</th>
    <th>Módulo</th>
    <th>Responsabilidad principal</th>
  </tr>
  <tr>
    <td><strong>Rodrigo Jara</strong></td>
    <td><img src="https://img.shields.io/badge/-Infraestructura-003B71?style=flat-square" alt="infra"/></td>
    <td>VPC, subredes, Security Groups, clúster ECS, ALB, roles IAM</td>
  </tr>
  <tr>
    <td><strong>Darío Morales</strong></td>
    <td><img src="https://img.shields.io/badge/-Data%20Sources-2E8B57?style=flat-square" alt="data"/></td>
    <td>Microservicios de datos, Dockerfiles, Task Definitions, pipeline de despliegue</td>
  </tr>
  <tr>
    <td><strong>Felipe Ulloa</strong></td>
    <td><img src="https://img.shields.io/badge/-Core%20Intelligence%20%2B%20Frontend-AC4FC6?style=flat-square" alt="core"/></td>
    <td>Service Connect, autoscaling, frontend + ALB, CI/CD, documentación</td>
  </tr>
</table>

<br/>

## 🏗️ Arquitectura

### Visión general

El sistema tiene **12 servicios** distribuidos en 4 capas:

```
                            ┌─────────────────────────────┐
                            │        INTERNET              │
                            └──────────────┬──────────────┘
                                           │ :80
                                           ▼
                        ┌──────────────────────────────────────┐
                        │   Application Load Balancer (ALB)     │
                        │          cordillera-alb                │
                        └──────────────────┬───────────────────┘
                                           │
              ╔════════════════════════════════════════════════════════╗
              ║          ECS CLUSTER  ·  cordillera-cluster            ║
              ║          (Fargate · Service Connect)                    ║
              ║                                                        ║
              ║   ┌──────────┐    ┌──────────────┐    ┌──────────┐    ║
              ║   │ frontend │───►│ api-gateway   │───►│ ms-auth  │    ║
              ║   │  (nginx) │    │    :8080      │    │  :8086   │    ║
              ║   └──────────┘    └──────┬───────┘    └──────────┘    ║
              ║                          │                             ║
              ║          ┌───────────────┼───────────────┐             ║
              ║          ▼               ▼               ▼             ║
              ║   ┌────────────┐  ┌────────────┐  ┌──────────────┐    ║
              ║   │    bff     │  │  ms-kpis   │  │ ms-reporting │    ║
              ║   │   :8085   │  │   :8091    │  │    :8092     │    ║
              ║   └────────────┘  └────────────┘  └──────────────┘    ║
              ║                                                        ║
              ║   ┌──────────┐ ┌──────────────┐ ┌────────────┐        ║
              ║   │ ms-sales │ │ms-inventory  │ │ ms-finance │  ...   ║
              ║   │  :8081   │ │   :8082      │ │   :8083    │        ║
              ║   └──────────┘ └──────────────┘ └────────────┘        ║
              ╚═══════════════════════════╤════════════════════════════╝
                                          │ JDBC
                                          ▼
                              ┌───────────────────────┐
                              │   RDS PostgreSQL 16    │
                              │    (8 bases lógicas)   │
                              └───────────────────────┘
```

### Servicios y puertos

<table>
  <tr>
    <th colspan="4" style="text-align:center">
      <img src="https://img.shields.io/badge/🔧%20Infraestructura-003B71?style=flat-square" alt="infra"/>
    </th>
  </tr>
  <tr>
    <td><code>frontend</code> :80</td>
    <td><code>api-gateway</code> :8080</td>
    <td><code>ms-auth</code> :8086</td>
    <td><code>eureka-server</code> :8761 ⁽*⁾</td>
  </tr>
  <tr>
    <th colspan="4" style="text-align:center">
      <img src="https://img.shields.io/badge/🧠%20Core%20Intelligence-AC4FC6?style=flat-square" alt="core"/>
    </th>
  </tr>
  <tr>
    <td><code>bff</code> :8085</td>
    <td><code>ms-kpis</code> :8091</td>
    <td><code>ms-reporting</code> :8092</td>
    <td><code>ms-data-ingestion</code> :8090</td>
  </tr>
  <tr>
    <th colspan="4" style="text-align:center">
      <img src="https://img.shields.io/badge/📊%20Data%20Sources-2E8B57?style=flat-square" alt="data"/>
    </th>
  </tr>
  <tr>
    <td><code>ms-sales</code> :8081</td>
    <td><code>ms-inventory</code> :8082</td>
    <td><code>ms-finance</code> :8083</td>
    <td><code>ms-customer</code> :8084</td>
  </tr>
</table>

> ⁽*⁾ `eureka-server` está desplegado con `desiredCount=0` en ECS. Se reemplazó por **ECS Service Connect** como mecanismo de descubrimiento de servicios (ver [documentación](docs/DOCUMENTACION_TECNICA.md#93-ecs-service-connect--por-qué-se-abandonó-eureka)).

<br/>

## 🛠️ Stack tecnológico

<table>
  <tr>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Java%2021-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java"/><br/>
      <sub>Backend</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Spring%20Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring"/><br/>
      <sub>Framework</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/><br/>
      <sub>Frontend</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/><br/>
      <sub>Build tool</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TW"/><br/>
      <sub>Estilos</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PG"/><br/>
      <sub>Base de datos</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/><br/>
      <sub>Contenedores</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-ECR-FF9900?style=flat-square&logo=amazonaws&logoColor=white" alt="ECR"/><br/>
      <sub>Registry</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-ECS-FF9900?style=flat-square&logo=amazonecs&logoColor=white" alt="ECS"/><br/>
      <sub>Orquestador</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="GHA"/><br/>
      <sub>CI/CD</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-CloudWatch-FF4F8B?style=flat-square&logo=amazoncloudwatch&logoColor=white" alt="CW"/><br/>
      <sub>Monitoreo</sub>
    </td>
    <td align="center" width="96">
      <img src="https://img.shields.io/badge/-Nginx-009639?style=flat-square&logo=nginx&logoColor=white" alt="Nginx"/><br/>
      <sub>Reverse Proxy</sub>
    </td>
  </tr>
</table>

<br/>

## 📂 Estructura del repositorio

```
Fullstack3/
│
├── 📁 cordillera/                        ← Monorepo Maven (código fuente)
│   ├── pom.xml                           ← Parent POM (Spring Boot 4.0.5 + Cloud 2025.1.1)
│   │
│   ├── 📁 data-sources/                  ← Módulo agregador: fuentes de datos
│   │   ├── ms-sales/
│   │   ├── ms-inventory/
│   │   ├── ms-finance/
│   │   └── ms-customer/
│   │
│   ├── 📁 core-intelligence/             ← Módulo agregador: inteligencia de negocio
│   │   ├── ms-data-ingestion/
│   │   ├── ms-kpis/
│   │   └── ms-reporting/
│   │
│   ├── 📁 infraestructure/               ← Módulo agregador: infraestructura compartida
│   │   ├── eureka-server/
│   │   ├── api-gateway/
│   │   ├── bff/
│   │   └── ms-auth/
│   │
│   ├── 📁 frontend/grupoCordillera/      ← React + Vite + Tailwind
│   │   ├── nginx.conf                    ← Reverse proxy hacia api-gateway
│   │   ├── Dockerfile                    ← Multi-stage: Node → Nginx
│   │   └── src/
│   │
│   └── API_ENDPOINTS.md                  ← Documentación de endpoints por MS
│
├── 📁 deploy/                            ← Todo lo relacionado con despliegue
│   ├── 📁 ec2-1/docker-compose.yml       ← Compose de EC2-1 (frontend + gateway + auth)
│   ├── 📁 ec2-2/docker-compose.yml       ← Compose de EC2-2 (eureka + bff)
│   ├── 📁 ec2-3/docker-compose.yml       ← Compose de EC2-3 (ingestion + kpis + reporting)
│   ├── 📁 ec2-4/docker-compose.yml       ← Compose de EC2-4 (sales + inventory + finance + customer)
│   ├── deploy-all.sh                     ← Script de despliegue manual
│   ├── reset_sequences.sql               ← Fix de secuencias Postgres
│   │
│   ├── 📁 ecs/                           ← Configuración de ECS Fargate
│   │   ├── README.md                     ← Arquitectura y operación del clúster
│   │   ├── task-definitions/             ← JSON de los 12 servicios
│   │   ├── aws-resources-created.md      ← Cronología de recursos AWS
│   │   └── infra-reuse-evaluation.md     ← Qué se reutilizó de EC2
│   │
│   └── 📁 evidencia/                     ← Evidencia de pruebas
│       ├── resumen-autoscaling.md        ← Prueba de carga k6 + escalado
│       └── resiliencia-circuit-breaker.md ← Timeline de resiliencia
│
├── 📁 docs/                              ← 📖 Documentación del proyecto
│   └── DOCUMENTACION_TECNICA.md          ← Documentación técnica completa
│
├── 📁 .github/workflows/
│   └── ci-cd.yml                         ← Pipeline CI/CD (build → ECR → ECS)
│
└── docker-compose.yml                    ← Compose local (desarrollo)
```

<br/>

## 🚀 Despliegue rápido

### Pre-requisitos

<img src="https://img.shields.io/badge/Java-21+-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java"/>
<img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node"/>
<img src="https://img.shields.io/badge/Docker-24+-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
<img src="https://img.shields.io/badge/Docker%20Compose-v2-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Compose"/>

### Opción 1 — Desarrollo local (Docker Compose)

```bash
# 1. Clonar el repositorio
git clone https://github.com/dariomorales1/Fullstack3.git
cd Fullstack3

# 2. Compilar el monorepo
cd cordillera
./mvnw clean package -DskipTests
cd ..

# 3. Levantar todo con Compose
docker compose up -d

# 4. Verificar
curl http://localhost/             # Frontend
curl http://localhost:8080/actuator/health   # Gateway
curl http://localhost:8761/         # Eureka
```

> ⏱️ El primer build toma ~10 minutos (descarga de dependencias Maven + npm). Los siguientes son más rápidos gracias al caché de Docker.

### Opción 2 — Producción (AWS ECS Fargate)

El despliegue a producción es **automático**: cualquier push a la rama `master` dispara el pipeline completo.

```
git push origin master
```

El pipeline ejecuta:
1. ✅ Build backend (Maven) + frontend (npm) en paralelo
2. 🐳 Construcción de 12 imágenes Docker multi-stage
3. 📦 Push a Amazon ECR con tags `:latest` y `:<commit-sha>`
4. 🔄 Registro de nuevas Task Definitions en ECS
5. 🚀 `update-service --force-new-deployment` en los 12 servicios
6. ⏳ `wait services-stable` — confirma que cada servicio arrancó correctamente
7. 🛡️ Deployment Circuit Breaker — rollback automático si algo falla

<br/>

## ⚙️ Pipeline CI/CD

```
 Push a master
       │
       ▼
 ┌───────────┐   ┌────────────┐
 │  Backend   │   │  Frontend   │     ← Build en paralelo
 │ mvn verify │   │ npm build   │
 └─────┬─────┘   └──────┬─────┘
       └────────┬────────┘
                ▼
       ┌─────────────────┐
       │   Docker Build   │           ← 12 imágenes multi-stage
       │   + Push ECR     │           ← Tags: :latest + :<sha>
       └────────┬────────┘
                ▼
       ┌─────────────────┐
       │   Deploy ECS     │           ← register-task-def × 12
       │   + Wait Stable  │           ← update-service × 12
       │   + Circuit      │           ← Rollback automático
       │     Breaker      │              si falla el healthcheck
       └─────────────────┘
```

<br/>

## 🔐 Gestión de secretos

| Secreto | Almacenamiento | Uso |
|---|---|---|
| Credenciales RDS | **AWS Secrets Manager** | Inyectado en runtime vía Execution Role |
| Clave JWT | **AWS Secrets Manager** | Firma de tokens en `ms-auth` |
| API key Resend | **AWS Secrets Manager** | Envío de correos transaccionales |
| AWS Access Keys | **GitHub Secrets** | Autenticación del pipeline con AWS |
| SSH Key (EC2) | **GitHub Secrets** | Despliegue legacy (entorno EC2) |

> 🔒 **Ninguna credencial se versiona en el repositorio.** Las Task Definitions referencian secretos por ARN, no por valor.

<br/>

## 📈 Autoscaling

Autoscaling configurado con **Target Tracking** en los 3 servicios con mayor variabilidad de carga:

| Servicio | Métrica | Umbral | Rango |
|---|---|---|---|
| `api-gateway` | CPU promedio | 60% | 1 → 4 tareas |
| `bff` | CPU promedio | 60% | 1 → 4 tareas |
| `ms-kpis` | CPU + Memoria | 60% / 70% | 1 → 4 tareas |

**Prueba de carga con k6:**

| Parámetro | Resultado |
|---|---|
| Usuarios virtuales | 50 |
| Duración | 3 minutos |
| Requests totales | 3.664 |
| Tasa de error | **0,00%** ✅ |
| P95 latencia | 5,45s |
| Escalado observado | 1 → 4 tareas en < 1 min |

<br/>

## 📊 Monitoreo

| Componente | Herramienta | Detalle |
|---|---|---|
| Logs por servicio | **CloudWatch Logs** | `/ecs/cordillera/<servicio>` — un log group por MS |
| Métricas de cluster | **Container Insights** | CPU, memoria, red, tareas por servicio |
| Dashboard | **CloudWatch Dashboard** | `cordillera-dashboard` — vista consolidada de los 12 servicios |

<br/>

## 🧪 Pruebas de resiliencia

### ✅ Auto-healing (tarea caída)

Se forzó la caída de `ms-reporting`. ECS repuso la tarea automáticamente en **3-4 minutos** sin intervención manual.

### ✅ Circuit Breaker (imagen rota)

Se apuntó `ms-reporting` a un tag inexistente. El Deployment Circuit Breaker **revirtió automáticamente en ~12 minutos**, confirmando rollback sin intervención humana (segunda corrida, 2026-07-03).

<br/>

## 🗃️ Infraestructura AWS

<table>
  <tr>
    <th>Recurso</th>
    <th>Detalle</th>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-VPC-FF9900?style=flat-square&logo=amazonaws" alt="VPC"/></td>
    <td><code>cordillera-vpc</code> — 10.0.0.0/16, 1 subred pública + 2 privadas</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-EC2-FF9900?style=flat-square&logo=amazonec2" alt="EC2"/></td>
    <td>4× t3.micro (Amazon Linux 2023) — entorno legacy EP1/EP2</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-ECS-FF9900?style=flat-square&logo=amazonecs" alt="ECS"/></td>
    <td><code>cordillera-cluster</code> — 12 servicios Fargate + Service Connect</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-RDS-527FFF?style=flat-square&logo=amazonrds" alt="RDS"/></td>
    <td>PostgreSQL 16, <code>db.t3.micro</code>, 8 bases de datos lógicas</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-ALB-FF9900?style=flat-square&logo=awselasticloadbalancing" alt="ALB"/></td>
    <td><code>cordillera-alb</code> → Target Group <code>frontend</code></td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-ECR-FF9900?style=flat-square&logo=amazonaws" alt="ECR"/></td>
    <td>12 repositorios bajo <code>grupocordillera/</code></td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-Secrets%20Manager-DD344C?style=flat-square&logo=amazonaws" alt="SM"/></td>
    <td>RDS, JWT, Resend — referenciados por ARN en Task Definitions</td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/-CloudWatch-FF4F8B?style=flat-square&logo=amazoncloudwatch" alt="CW"/></td>
    <td>Logs + Container Insights + Dashboard <code>cordillera-dashboard</code></td>
  </tr>
</table>

> **Región:** `us-east-2` (Ohio)

<br/>

## 📖 Documentación

La documentación técnica completa del proyecto se encuentra en:

📁 [`docs/DOCUMENTACION_TECNICA.md`](docs/DOCUMENTACION_TECNICA.md)

Cubre en detalle: arquitectura, contenedorización, Docker Compose, infraestructura AWS (EC2 + ECS), Amazon ECR, pipeline CI/CD, gestión de secretos, autoscaling, monitoreo, validación funcional, pruebas de resiliencia, decisiones técnicas justificadas, incidentes resueltos y lecciones aprendidas.

Documentación adicional dentro del repositorio:

| Documento | Ubicación |
|---|---|
| Arquitectura y operación de ECS | [`deploy/ecs/README.md`](deploy/ecs/README.md) |
| Endpoints de cada microservicio | [`cordillera/API_ENDPOINTS.md`](cordillera/API_ENDPOINTS.md) |
| Prueba de carga y autoscaling | [`deploy/evidencia/resumen-autoscaling.md`](deploy/evidencia/resumen-autoscaling.md) |
| Prueba de resiliencia | [`deploy/evidencia/resiliencia-circuit-breaker.md`](deploy/evidencia/resiliencia-circuit-breaker.md) |
| Recursos AWS creados | [`deploy/ecs/aws-resources-created.md`](deploy/ecs/aws-resources-created.md) |

<br/>

## 💡 Decisiones técnicas clave

| Decisión | Justificación |
|---|---|
| **ECS Fargate** sobre EKS | Elimina administración de nodos; integración directa con IAM, ALB, CloudWatch |
| **Service Connect** sobre Eureka | Eureka era inestable bajo Fargate; Service Connect provee DNS interno nativo |
| **ECR** sobre Docker Hub | Privado por defecto, IAM automático, misma región AWS |
| **NAT instance** sobre NAT Gateway | Ahorro de ~$32/mes usando EC2-1 como NAT (aceptable para entorno académico) |
| **Multi-stage build** | Imágenes ~4× más livianas (JRE alpine + JAR vs JDK completo) |
| **Swap 2 GB** en cada EC2 | Absorbe picos de arranque de la JVM con solo 1 GB de RAM |
| **Pipeline redespliega los 12 servicios** | Previsibilidad sobre velocidad marginal de deploy selectivo |
| **Circuit Breaker siempre activo** | No existe caso donde convenga mantener un despliegue roto sirviendo tráfico |

<br/>

---

<div align="center">

<img src="https://img.shields.io/badge/Grupo%20Cordillera-ISY1101%20·%20Duoc%20UC%20·%20julio%202026-003B71?style=for-the-badge&labelColor=003B71" alt="Footer"/>

<br/><br/>

<sub>Hecho con ☕ y muchos <code>docker compose up -d</code></sub>

</div>
