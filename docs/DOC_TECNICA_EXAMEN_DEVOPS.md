# Documentación Técnica — Plataforma Grupo Cordillera

> **Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
> **Carrera:** Ingeniería en Informática — Duoc UC  
> **Integrantes:** Rodrigo Jara · Darío Morales · Felipe Ulloa  
> **Repositorio:** [github.com/dariomorales1/Fullstack3](https://github.com/dariomorales1/Fullstack3)  
> **Rama principal:** `master`  
> **Región AWS:** us-east-2 (Ohio)  
> **Última actualización:** julio de 2026

---

## Tabla de contenido

1. [Resumen del proyecto](#1-resumen-del-proyecto)
2. [Integrantes y responsabilidades](#2-integrantes-y-responsabilidades)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura de microservicios](#4-arquitectura-de-microservicios)
5. [Contenedorización con Docker](#5-contenedorización-con-docker)
6. [Docker Compose](#6-docker-compose)
7. [Infraestructura AWS — Entorno EC2](#7-infraestructura-aws--entorno-ec2)
8. [Amazon ECR — Registro de imágenes](#8-amazon-ecr--registro-de-imágenes)
9. [Migración a AWS ECS Fargate](#9-migración-a-aws-ecs-fargate)
10. [Pipeline CI/CD con GitHub Actions](#10-pipeline-cicd-con-github-actions)
11. [Gestión de secretos](#11-gestión-de-secretos)
12. [Escalabilidad y autoscaling](#12-escalabilidad-y-autoscaling)
13. [Observabilidad y monitoreo](#13-observabilidad-y-monitoreo)
14. [Validación funcional](#14-validación-funcional)
15. [Pruebas de resiliencia](#15-pruebas-de-resiliencia)
16. [Decisiones técnicas](#16-decisiones-técnicas)
17. [Incidentes relevantes y resoluciones](#17-incidentes-relevantes-y-resoluciones)
18. [Archivos clave del repositorio](#18-archivos-clave-del-repositorio)
19. [Mejoras futuras](#19-mejoras-futuras)
20. [Lecciones aprendidas](#20-lecciones-aprendidas)

---

## 1. Resumen del proyecto

Grupo Cordillera es una plataforma de monitoreo empresarial para la alta gerencia de un holding con múltiples sucursales. Centraliza KPIs de ventas, inventario, finanzas y clientes en un dashboard único, consolidando esos datos en indicadores y reportes ejecutivos.

La arquitectura se basa en un monorepo Maven (`Fullstack3/cordillera/`) que contiene **11 microservicios Spring Boot** y un **frontend React**, organizados en 3 módulos agregadores más el frontend:

```
cordillera/
├── data-sources/              (módulo agregador)
│   ├── ms-sales                :8081
│   ├── ms-inventory            :8082
│   ├── ms-finance              :8083
│   └── ms-customer             :8084
├── core-intelligence/          (módulo agregador)
│   ├── ms-data-ingestion       :8090
│   ├── ms-kpis                 :8091
│   └── ms-reporting            :8092
├── infraestructure/            (módulo agregador)
│   ├── eureka-server           :8761
│   ├── api-gateway             :8080
│   ├── bff                     :8085
│   └── ms-auth                 :8086
└── frontend/grupoCordillera    (React + Vite, servido por Nginx en :80)
```

El proyecto evolucionó a lo largo de tres evaluaciones parciales:

- **EP1:** infraestructura base en AWS (VPC, EC2, RDS) y despliegue manual con Docker Compose sobre 4 instancias EC2.
- **EP2:** contenedorización completa de los 12 servicios, pipeline CI/CD con GitHub Actions, registro de imágenes en Amazon ECR y despliegue automatizado vía SSH con ProxyJump.
- **EP3:** migración a AWS ECS Fargate como orquestador de contenedores, con Service Connect, autoscaling, ALB, Secrets Manager, CloudWatch y Deployment Circuit Breaker.

---

## 2. Integrantes y responsabilidades

| Nombre | Módulo a cargo | Aporte principal |
|---|---|---|
| Rodrigo Jara | Infraestructura | Diseño y aprovisionamiento de la red (VPC, subredes, Security Groups), configuración del clúster ECS, ALB y roles IAM |
| Darío Morales | Data Sources | Adaptación de los microservicios de datos a Fargate, Dockerfiles, Task Definitions y soporte del pipeline de despliegue |
| Felipe Ulloa | Core Intelligence y Frontend | Configuración de Service Connect, autoscaling, integración del frontend con el ALB, pipeline CI/CD y documentación |

---

## 3. Stack tecnológico

| Componente | Tecnología | Versión / Detalle |
|---|---|---|
| Lenguaje backend | Java | 21 |
| Framework backend | Spring Boot | 4.0.5 |
| Spring Cloud | Spring Cloud | 2025.1.1 |
| API Gateway | Spring Cloud Gateway | 5.0.1 (WebFlux) |
| Service Discovery (EC2) | Netflix Eureka | `spring-cloud-starter-netflix-eureka-client/server` |
| Service Discovery (ECS) | ECS Service Connect | Namespace Cloud Map `cordillera-dns.local` |
| Resiliencia | Resilience4j | Circuit breaker en BFF |
| Autenticación | JWT | jjwt 0.12.6 — emitido por `ms-auth` |
| ORM | Spring Data JPA / Hibernate | Paquete `model/` en cada MS |
| Migraciones | Flyway | Usado en `ms-auth`; otros MS usan `ddl-auto=update` |
| Base de datos | PostgreSQL | 16 (AWS RDS) |
| Frontend | React + Vite + Tailwind CSS v4 | JavaScript (sin TypeScript) |
| Contenedores | Docker + Docker Compose v2 | Multi-stage builds |
| Registro de imágenes | Amazon ECR | 12 repositorios |
| Orquestador | AWS ECS Fargate | Clúster `cordillera-cluster` |
| Balanceador | Application Load Balancer | `cordillera-alb` |
| CI/CD | GitHub Actions | `.github/workflows/ci-cd.yml` |
| Secretos | AWS Secrets Manager + GitHub Secrets | RDS, JWT, Resend API key |
| Monitoreo | Amazon CloudWatch | Logs + Container Insights + Dashboard |
| Prueba de carga | k6 (Grafana Labs) | 50 VUs, 3 min |

Paquete base de cada microservicio: `cl.fullstack3.ms{nombre}` (sin guiones, ej. `cl.fullstack3.mskpis`).

---

## 4. Arquitectura de microservicios

### 4.1 Diagrama general (entorno EC2)

```
Internet
   │
   ▼  :80 (HTTP)
┌──────────────────────────────────────┐
│  EC2-1 (pública)                      │
│  ┌────────────────┐                   │
│  │  frontend       │ Nginx :80        │── sirve SPA + proxy_pass /api/ ──┐
│  └────────────────┘                   │                                   │
│  ┌────────────────┐                   │                                   ▼
│  │  api-gateway    │ :8080  ◄─────────┼── enruta /api/** por Path predicate
│  └───────┬────────┘                   │   hacia lb://<servicio> vía Eureka
│  ┌───────▼────────┐                   │
│  │  ms-auth        │ :8086            │── JDBC ──► RDS (db_auth)
│  └────────────────┘                   │
└──────────────┬───────────────────────┘
               │ VPC privada (10.0.0.0/16)
   ┌───────────┼───────────────────────────────┐
   ▼                                            ▼
EC2-2 (10.0.2.107)                      EC2-3 (10.0.2.118)
 eureka-server :8761                     ms-data-ingestion :8090
 bff           :8085                     ms-kpis           :8091
                                         ms-reporting      :8092

                                        EC2-4 (10.0.2.100)
                                         ms-sales     :8081
                                         ms-inventory :8082
                                         ms-finance   :8083
                                         ms-customer  :8084
                                              │
                                              ▼ JDBC
                                        RDS PostgreSQL
                                        (8 bases lógicas)
```

### 4.2 Servicios y puertos

| Servicio | Puerto | EC2 | Responsable |
|---|---|---|---|
| frontend | 80 | EC2-1 | Felipe + Darío |
| api-gateway | 8080 | EC2-1 | Rodrigo |
| ms-auth | 8086 | EC2-1 | Rodrigo |
| eureka-server | 8761 | EC2-2 | Rodrigo |
| bff | 8085 | EC2-2 | Rodrigo |
| ms-data-ingestion | 8090 | EC2-3 | Felipe |
| ms-kpis | 8091 | EC2-3 | Felipe |
| ms-reporting | 8092 | EC2-3 | Felipe |
| ms-sales | 8081 | EC2-4 | Darío |
| ms-inventory | 8082 | EC2-4 | Darío |
| ms-finance | 8083 | EC2-4 | Darío |
| ms-customer | 8084 | EC2-4 | Darío |

### 4.3 Comunicación entre servicios

- Todos los microservicios se registran en **Eureka** (`eureka-server:8761` en EC2-2) y se descubren por nombre de aplicación (`lb://ms-sales`, `lb://ms-auth`, etc.) en el entorno EC2.
- El **API Gateway** es el único componente con rutas HTTP públicas, definidas en `application.yml` bajo el prefijo `spring.cloud.gateway.server.webflux.routes`.
- El **frontend** nunca llama directo a los microservicios: todo pasa por `Nginx (:80) → proxy_pass /api/ → api-gateway:8080 → lb://<servicio>`.
- El **BFF** (`bff:8085`) agrega datos de `ms-kpis`, `ms-reporting` y `ms-data-ingestion` para las vistas de dashboard, también vía Eureka.
- Cada microservicio de negocio tiene su propia base de datos lógica PostgreSQL. `ms-auth` maneja autenticación JWT de forma independiente.

---

## 5. Contenedorización con Docker

### 5.1 Estrategia: multi-stage build

Todos los servicios utilizan **multi-stage build** para reducir el tamaño de la imagen final:

- **Stage 1 (build):** `eclipse-temurin:21-jdk-alpine` — compila el JAR con Maven.
- **Stage 2 (runtime):** `eclipse-temurin:21-jre-alpine` — solo el JRE y el JAR.

Sin multi-stage, la imagen final incluiría el JDK completo (~350 MB), Maven y todos los artefactos de compilación. Con multi-stage, la imagen final contiene solo JRE alpine (~80 MB) más el JAR (~50 MB), logrando imágenes aproximadamente 4 veces más livianas y un pull más rápido en cada despliegue.

### 5.2 Dockerfile backend (patrón compartido por los 11 MS)

```dockerfile
# Stage 1 — Compilación
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copiar descriptores de módulos primero (cache de dependencias)
COPY mvnw mvnw
COPY .mvn/ .mvn/
RUN chmod +x mvnw
COPY pom.xml pom.xml
COPY data-sources/pom.xml data-sources/pom.xml
# ... (todos los pom.xml del monorepo)

RUN ./mvnw dependency:go-offline -B -pl data-sources/ms-sales -am -q

# Copiar fuentes y compilar
COPY data-sources/ms-sales/src/ data-sources/ms-sales/src/
RUN ./mvnw package -DskipTests -B -pl data-sources/ms-sales -am -q

# Stage 2 — Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/data-sources/ms-sales/target/*.jar app.jar
EXPOSE 8081
ENV JAVA_OPTS="-Xmx160m -Xms64m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

> **¿Por qué `-Xmx160m`?** Las EC2 son t3.micro con 1 GB de RAM y ejecutan múltiples servicios en paralelo. Sin límite de heap la JVM puede consumir toda la RAM disponible y colapsar el nodo.

### 5.3 Dockerfile frontend

El frontend usa un patrón diferente: **Node para build, Nginx para servir.**

```dockerfile
# Stage 1 — Build React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build           # genera /app/dist con los estáticos

# Stage 2 — Servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.4 Nginx como reverse proxy

El `nginx.conf` cumple dos roles: servir la SPA y hacer proxy de las llamadas API hacia el Gateway.

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA routing
    }

    location /api/ {
        proxy_pass http://api-gateway:8080;  # proxy al gateway
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

El `resolver 127.0.0.11 valid=10s;` y `proxy_pass` con variable se agregaron después de detectar que Nginx cachea la IP interna de Docker de `api-gateway` al arrancar, causando 502 Bad Gateway si el contenedor del gateway se recrea fuera de `docker compose up`.

---

## 6. Docker Compose

### 6.1 Docker Compose local (desarrollo)

El archivo raíz `docker-compose.yml` levanta **todos los servicios en una sola máquina** para desarrollo local:

- `postgres:16-alpine` con init script que crea las 8 bases de datos.
- Health checks en postgres y eureka para gestionar el orden de arranque.
- `depends_on` con condiciones (`service_healthy`, `service_started`).
- Red bridge compartida `cordillera-net`.
- Variables de entorno con valores por defecto.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 5
    volumes:
      - ./cordillera/init-databases.sql:/docker-entrypoint-initdb.d/init.sql

  eureka-server:
    build:
      context: ./cordillera
      dockerfile: infraestructure/eureka-server/Dockerfile
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8761/actuator/health || exit 1"]

  ms-sales:
    build:
      context: ./cordillera
      dockerfile: data-sources/ms-sales/Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
      eureka-server:
        condition: service_healthy
```

### 6.2 Docker Compose por EC2 (producción AWS)

Para producción se generaron **4 docker-compose separados**, uno por EC2, usando imágenes pre-construidas desde ECR:

| Archivo | EC2 | Servicios |
|---|---|---|
| `deploy/ec2-1/docker-compose.yml` | EC2-1 pública | api-gateway, ms-auth, frontend |
| `deploy/ec2-2/docker-compose.yml` | EC2-2 privada | eureka-server, bff |
| `deploy/ec2-3/docker-compose.yml` | EC2-3 privada | ms-data-ingestion, ms-kpis, ms-reporting |
| `deploy/ec2-4/docker-compose.yml` | EC2-4 privada | ms-sales, ms-inventory, ms-finance, ms-customer |

**Diferencia clave entre ambos entornos:**

| Aspecto | Local | Producción AWS |
|---|---|---|
| Imágenes | `build:` (compila local) | `image:` (pull desde ECR) |
| Base de datos | contenedor `postgres` local | RDS endpoint externo |
| Eureka URL | `http://eureka-server:8761` | `http://10.0.2.107:8761` |
| Secretos | valores hardcoded de desarrollo | variables de entorno del sistema |

---

## 7. Infraestructura AWS — Entorno EC2

### 7.1 VPC y subredes

Se creó una VPC dedicada `cordillera-vpc` con arquitectura de subredes públicas y privadas:

```
VPC: 10.0.0.0/16  (cordillera-vpc)
│
├── Subred pública  10.0.1.0/24  us-east-2a
│   └── EC2-1 (bastion + NAT + Frontend + Gateway)
│
├── Subred privada  10.0.2.0/24  us-east-2a
│   ├── EC2-2  10.0.2.107  (Eureka + BFF)
│   ├── EC2-3  10.0.2.118  (Core Intelligence)
│   └── EC2-4  10.0.2.100  (Data Sources)
│
└── Subred privada  10.0.3.0/24  us-east-2b
    └── RDS subnet group (requerido multi-AZ)
```

| Recurso | ID | CIDR / Detalle |
|---|---|---|
| VPC | `vpc-0b9c0a321dc30fa83` | `10.0.0.0/16` (`cordillera-vpc`) |
| Internet Gateway | `igw-003eb7d09a3f99334` | Salida a internet para la subred pública |
| Subred pública | `subnet-0d026163d43190d68` | `10.0.1.0/24` — us-east-2a — EC2-1 |
| Subred privada 2a | `subnet-0c37930ff9a14e070` | `10.0.2.0/24` — us-east-2a — EC2-2, 3, 4 |
| Subred privada 2b | `subnet-01ee6cc30cb65eee9` | `10.0.3.0/24` — us-east-2b — RDS |
| Route table pública | `rtb-0baa825f3d82e3170` | `0.0.0.0/0 → IGW` |
| Route table privada | `rtb-03c7217fc4d221f6d` | `0.0.0.0/0 → EC2-1` (NAT instance) |

### 7.2 Instancias EC2

Las 4 instancias son **t3.micro** con Amazon Linux 2023:

| Nombre | Instance ID | IP privada | IP pública | Rol |
|---|---|---|---|---|
| cordillera-ec2-1-public | `i-05d008dd7dd644af4` | 10.0.1.58 | Elastic IP (variable) | frontend + api-gateway + ms-auth + bastion + NAT |
| cordillera-ec2-2-eureka-bff | `i-0ca0519f821489086` | 10.0.2.107 | — | eureka-server + bff |
| cordillera-ec2-3-core | `i-03a2918d757fc81bb` | 10.0.2.118 | — | ms-data-ingestion + ms-kpis + ms-reporting |
| cordillera-ec2-4-datasources | `i-0fdd7a0e7d39e6d9f` | 10.0.2.100 | — | ms-sales + ms-inventory + ms-finance + ms-customer |

Todas las instancias tienen volumen root EBS de **8 GB** y swap de **2 GB** configurado en el User Data de arranque. El aprovisionamiento automático incluye:

```bash
dnf install -y docker git
systemctl enable docker && systemctl start docker
usermod -aG docker ec2-user

# Docker Compose v2
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose

# Swap 2GB (crítico para Java en 1GB RAM)
dd if=/dev/zero of=/swapfile bs=128M count=16
mkswap /swapfile && swapon /swapfile
```

### 7.3 Security Groups

| Security Group | ID | Aplica a | Reglas clave |
|---|---|---|---|
| SG-PUBLIC | `sg-0f02d2dd03261cc21` | EC2-1 | 80, 443, 8080, 8761 desde `0.0.0.0/0`; SSH:22 restringido a IP/32 específica |
| SG-PRIVATE | `sg-014a8e82c80fae331` | EC2-2, 3, 4 | SSH:22 y 8761 desde SG-PUBLIC; 8081-8092 entre SG-PUBLIC y SG-PRIVATE |
| SG-DATABASE | `sg-0835efe9646e1028c` | RDS | 5432 solo desde SG-PUBLIC y SG-PRIVATE |

> **Principio de mínimo privilegio:** las EC2 privadas no son accesibles desde internet. Solo EC2-1 tiene IP pública. La base de datos solo acepta conexiones desde los microservicios.

### 7.4 EC2-1 como NAT instance

EC2-1 tiene un doble rol: **bastion host** (punto de entrada SSH) y **NAT instance** (permite que las EC2 privadas descarguen imágenes Docker de ECR sin exponerlas a internet).

```bash
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p
iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE
```

> **Nota:** la interfaz de red en Amazon Linux 2023 es `ens5`, no `eth0`. La route table privada tiene `0.0.0.0/0 → EC2-1`.

### 7.5 RDS PostgreSQL

| Atributo | Valor |
|---|---|
| Identifier | `cordillera-rds` |
| Endpoint | `cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com:5432` |
| Engine | PostgreSQL 16, `db.t3.micro` |
| Usuario | `cordillera_admin` |
| Parameter group | `cordillera-pg16` — `max_connections=200` |
| Bases de datos lógicas | `db_auth`, `db_sales`, `db_inventory`, `db_finance`, `db_customer`, `db_ingestion`, `db_kpis`, `db_reporting` |

Las 8 bases de datos lógicas fueron creadas manualmente; no existe init-script automático en RDS. El `max_connections` se elevó a 200 (el default ~81 no alcanza para 9 microservicios con pool HikariCP simultáneo).

### 7.6 Acceso SSH

| Atributo | Valor |
|---|---|
| Key pair (AWS) | `cordillera-key` |
| Patrón de acceso | SSH directo a EC2-1 (bastion). Para EC2-2/3/4 usar `ProxyJump` |

```bash
# Acceso directo al bastion
ssh -i ~/.ssh/cordillera-key.pem ec2-user@<IP-EC2-1>

# Salto a EC2 privada vía ProxyJump
ssh -i ~/.ssh/cordillera-key.pem -J ec2-user@<IP-EC2-1> ec2-user@10.0.2.107
```

---

## 8. Amazon ECR — Registro de imágenes

Amazon ECR (Elastic Container Registry) es el registro privado de imágenes Docker utilizado en lugar de Docker Hub.

**Registry:** `215682485633.dkr.ecr.us-east-2.amazonaws.com`

### 8.1 Repositorios

```
grupocordillera/
├── ms-sales
├── ms-inventory
├── ms-finance
├── ms-customer
├── ms-data-ingestion
├── ms-kpis
├── ms-reporting
├── eureka-server
├── api-gateway
├── bff
├── ms-auth
└── frontend
```

12 repositorios en total, uno por servicio.

### 8.2 Versionado de imágenes

Cada push genera **dos tags** por imagen:

- `:latest` — siempre apunta a la versión más reciente.
- `:<git-sha>` — hash del commit, permite rollback exacto a una revisión específica.

```bash
image="215682485633.dkr.ecr.us-east-2.amazonaws.com/grupocordillera/ms-kpis"
docker build -t $image:latest -t $image:$GITHUB_SHA .
docker push $image:latest
docker push $image:$GITHUB_SHA
```

### 8.3 Autenticación EC2 → ECR

Las EC2 se autentican en ECR con sus credenciales IAM:

```bash
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  215682485633.dkr.ecr.us-east-2.amazonaws.com
```

### 8.4 ¿Por qué ECR y no Docker Hub?

| Criterio | ECR | Docker Hub |
|---|---|---|
| Privacidad | Privado por defecto | Público por defecto (free) |
| Autenticación en EC2 | IAM automático | Credenciales manuales |
| Latencia | Mismo datacenter (us-east-2) | Externo |
| Integración | Nativa con AWS (IAM, VPC) | Requiere configuración extra |

ECR se eligió porque las EC2 se autentican automáticamente con IAM roles y la latencia de pull es mínima al estar en la misma región.

---

## 9. Migración a AWS ECS Fargate

### 9.1 Motivación

Al cierre de EP2, el despliegue sobre 4 instancias EC2 con Docker Compose cumplía el objetivo de contenedorización, pero no constituía un clúster de orquestación real: no existía reposición automática de contenedores caídos, el escalamiento era inexistente y cada cambio de imagen requería que el pipeline se conectara una a una a las cuatro máquinas vía SSH para reiniciar los contenedores. La EP3 exigía demostrar competencias de orquestación: clúster ECS/EKS, autoscaling verificable, pipeline automatizado y evidencia de tolerancia a fallos.

Se optó por **ECS Fargate** sobre EKS porque Fargate elimina la administración de nodos (no hay que dimensionar ni parchar instancias EC2 para el clúster), se integra directamente con IAM, ALB, CloudWatch y Secrets Manager, y reduce la superficie de configuración para un proyecto académico con plazo y presupuesto acotados.

### 9.2 Arquitectura ECS resultante

```
Internet
   │
   ▼  :80 (HTTP)
┌───────────────────────────────────────────────────┐
│  Application Load Balancer (cordillera-alb)        │
│  Target Group → frontend (Nginx)                   │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼  ECS Service Connect (cordillera-dns.local)
┌───────────────────────────────────────────────────────────────┐
│  ECS Cluster: cordillera-cluster (Fargate)                     │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │  frontend    │  │  api-gateway  │  │  ms-auth        │        │
│  │  (público)   │  │  (privado)    │  │  (privado)      │        │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘         │
│         │                │                                       │
│         │   proxy /api/  │   Service Connect DNS                 │
│         └───────────────►│──────────────────────────►           │
│                          │                                       │
│  ┌────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐   │
│  │  bff   │  │  ms-kpis  │  │ ms-report. │  │ ms-data-ingest.│  │
│  └────────┘  └──────────┘  └───────────┘  └────────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ ms-sales  │  │ ms-inventory  │  │ ms-finance  │  │ms-customer│ │
│  └──────────┘  └──────────────┘  └────────────┘  └───────────┘ │
│                                                                  │
│  eureka-server (desiredCount=0, conservado pero desactivado)     │
└──────────────────────────────┬───────────────────────────────────┘
                               │ JDBC
                               ▼
                        RDS PostgreSQL
                        (8 bases lógicas)
```

Características clave:

- **1 ALB público** (`cordillera-alb`) con un único Target Group hacia el servicio `frontend` (Nginx).
- **12 servicios ECS** (Fargate, `awsvpc`), todos los backend son **privados** (`assignPublicIp: DISABLED`, sin target group propio).
- **ECS Service Connect** sobre un namespace Cloud Map `DNS_PRIVATE` (`cordillera-dns.local`) para toda la comunicación interna.
- **Autoscaling** (Target Tracking) en `api-gateway`, `bff` y `ms-kpis`.
- **Deployment Circuit Breaker** con rollback automático en los 12 servicios.
- **RDS PostgreSQL reutilizada** del entorno EC2 (misma instancia, nuevo SG rule desde las tareas ECS).

### 9.3 ECS Service Connect — por qué se abandonó Eureka

Esta fue la decisión de arquitectura más importante de la migración.

**Plan inicial:** mantener Eureka también en ECS, asumiendo que sería el cambio de menor esfuerzo. Bajo Service Connect, sin embargo, `eureka-server` entró en un ciclo continuo de renovación de arriendos fallida, generando más de 190 ocurrencias de error en 5 minutos y provocando que endpoints como `/api/auth/login` respondieran intermitentemente entre 200 y 503.

Se identificaron y corrigieron tres problemas reales, pero ninguno resolvió la inestabilidad por sí solo:

1. **Namespace HTTP sin DNS real:** Service Connect no publicaba registros DNS consultables por resolución dinámica; Nginx hace consultas DNS UDP que el namespace no respondía. Se cambió a `proxy_pass` estático.
2. **Alias sin FQDN:** los `clientAliases[].dnsName` usaban nombres cortos en vez de `<servicio>.cordillera-dns.local`.
3. **`instanceId` colisionando:** el hostname autodetectado resolvía a la IP link-local `169.254.172.2` en todas las tareas. Se fijó explícitamente como `${service}.cordillera-dns.local:${port}`.

**Decisión final:** abandonar Eureka completamente en ECS. Service Connect ya resuelve nombres de servicio con DNS interno, haciendo a Eureka redundante. Las 12 Task Definitions pasaron a `EUREKA_CLIENT_ENABLED=false`, con `api-gateway` y `bff` apuntando a URLs directas de Service Connect. `eureka-server` quedó con `desiredCount=0`.

**Resultado:** pruebas repetidas (3x cada una) contra los endpoints principales mostraron **100% de respuestas exitosas, cero 503**.

### 9.4 Application Load Balancer

Se desplegó un único ALB público (`cordillera-alb`) con un Target Group (`cordillera-frontend-tg`) dirigido al servicio `frontend`. Se concentró todo el tráfico externo en un solo balanceador porque el patrón de acceso siempre pasa primero por el frontend, que sirve la SPA y hace de proxy hacia el Gateway vía Nginx; exponer un segundo Target Group no aportaba una ruta de acceso adicional real y sí sumaba superficie de ataque.

### 9.5 Roles IAM

ECS Fargate distingue dos roles por tarea:

- **Execution Role:** usado por el agente de ECS para autenticarse en ECR (pull de imágenes) y leer secretos desde Secrets Manager antes de iniciar el contenedor.
- **Task Role:** usado por la aplicación en runtime para interactuar con otros servicios AWS. Se mantuvo con permisos mínimos.

Separar ambos roles sigue el principio de menor privilegio: el rol de ejecución solo necesita permisos sobre ECR, CloudWatch Logs y Secrets Manager.

---

## 10. Pipeline CI/CD con GitHub Actions

### 10.1 Evolución del pipeline

El pipeline evolucionó entre EP2 y EP3:

| Aspecto | EP2 (EC2 + Docker Compose) | EP3 (ECS Fargate) |
|---|---|---|
| Disparador | `push` a `develop` | `push` a `master` |
| Despliegue | SSH + ProxyJump + `docker compose up -d` | `register-task-definition` + `update-service` |
| Verificación | `curl` a healthcheck | `wait services-stable` |
| Rollback | Manual | Deployment Circuit Breaker automático |
| Credenciales | SSH key + AWS CLI | Solo AWS CLI (sin SSH) |

### 10.2 Flujo del pipeline actual (EP3)

```
Push a master
      │
      ▼
┌─────────────────────┐    ┌─────────────────────┐
│   build-backend      │    │   build-frontend     │   (en paralelo)
│   ./mvnw clean verify│    │   npm ci + npm build │
└──────────┬──────────┘    └──────────┬───────────┘
           └──────────┬───────────────┘
                      │ (ambos deben pasar)
                      ▼
           ┌──────────────────────┐
           │    push-images        │
           │  Login ECR            │
           │  docker build × 12    │
           │  docker push :latest  │
           │  docker push :<sha>   │
           └──────────┬───────────┘
                      ▼
           ┌──────────────────────┐
           │  deploy-ecs           │
           │                       │
           │  Por cada servicio:   │
           │  1. register-task-def │
           │  2. update-service    │
           │     --force-new-dep.  │
           │  3. wait services-    │
           │     stable            │
           └──────────────────────┘
```

### 10.3 Etapas del pipeline

| Etapa | Descripción |
|---|---|
| **Build** | Compilación de los 11 microservicios backend con Maven y build del frontend con npm, en paralelo |
| **Docker Build** | Construcción de las 12 imágenes usando Dockerfiles multi-stage |
| **Docker Push a ECR** | Publicación de cada imagen con dos tags: `:latest` y `:<git-sha>` |
| **Update Task Definition** | Por cada servicio, se registra una nueva revisión de su Task Definition con la imagen recién publicada |
| **Deploy / Force New Deployment** | Se actualiza cada servicio ECS con `update-service --force-new-deployment` |
| **Wait Services Stable** | El pipeline espera a que ECS confirme estado estable antes de continuar |
| **Deployment Circuit Breaker** | Si un despliegue no logra pasar sus health checks, revierte automáticamente a la revisión anterior |

### 10.4 Deployment Circuit Breaker

Se habilitó el Deployment Circuit Breaker con rollback automático en las 12 definiciones de servicio. Si una nueva revisión no alcanza el estado saludable esperado, ECS detecta el despliegue fallido y revierte el servicio a la última revisión estable sin intervención manual.

### 10.5 GitHub Secrets requeridos

| Secret | Propósito |
|---|---|
| `AWS_ACCESS_KEY_ID` | Autenticar AWS CLI en el runner |
| `AWS_SECRET_ACCESS_KEY` | Autenticar AWS CLI en el runner |
| `EC2_SSH_KEY` | Clave privada PEM para SSH (entorno EC2) |
| `EC2_1_HOST` | IP del bastion público |
| `EC2_2_HOST` | `10.0.2.107` — Eureka + BFF |
| `EC2_3_HOST` | `10.0.2.118` — Core Intelligence |
| `EC2_4_HOST` | `10.0.2.100` — Data Sources |
| `RDS_ENDPOINT` | Endpoint del RDS PostgreSQL |
| `DB_PASSWORD` | Password del RDS |
| `JWT_SECRET` | Clave de firma de tokens |
| `RESEND_API_KEY` | API de envío de emails |

### 10.6 Mejora respecto a EP2

La diferencia principal es que ahora el orquestador valida el resultado del despliegue (`wait services-stable` + circuit breaker) en lugar de que el pipeline simplemente asuma éxito tras ejecutar un `docker compose up` remoto. Esto cierra una brecha real de EP2: antes, un despliegue podía reportarse como exitoso en GitHub Actions aunque el contenedor recién iniciado estuviera fallando en el servidor.

---

## 11. Gestión de secretos

### 11.1 AWS Secrets Manager

Tres secretos sensibles se almacenaron en AWS Secrets Manager:

- Credenciales de conexión a RDS (usuario y password).
- Clave de firma de tokens JWT (emitidos por `ms-auth`).
- API key del servicio de envío de correo (Resend).

Las Task Definitions referencian estos secretos mediante el bloque `secrets`, que inyecta el valor como variable de entorno dentro del contenedor solo en el momento del arranque, resuelto por el Execution Role. En ningún punto del código fuente, del Dockerfile ni de la Task Definition aparece el valor real de una credencial: solo el ARN del secreto correspondiente.

### 11.2 GitHub Secrets

El pipeline de GitHub Actions necesita credenciales para autenticarse contra AWS. Estas se mantienen como GitHub Secrets a nivel de repositorio.

### 11.3 Buenas prácticas aplicadas

- Ninguna credencial se versiona en el repositorio: ni en `application.yml`, ni en los Dockerfiles, ni en los workflows.
- El Execution Role de cada tarea solo tiene permiso de lectura sobre los secretos que ese servicio en particular necesita.
- La documentación referencia las credenciales por nombre o propósito, nunca por su valor.
- El cambio de un secreto no requiere modificar ni redesplegar el código: basta con actualizar el valor en Secrets Manager y forzar un nuevo despliegue del servicio.

---

## 12. Escalabilidad y autoscaling

### 12.1 Configuración de Target Tracking

El autoscaling se configuró mediante políticas de **Target Tracking**, el mecanismo nativo de ECS que ajusta el número de tareas para mantener una métrica dentro de un valor objetivo.

| Servicio | Métrica objetivo | Umbral | Min / Max tareas |
|---|---|---|---|
| api-gateway | CPU promedio | 60% | 1 / 4 |
| bff | CPU promedio | 60% | 1 / 4 |
| ms-kpis | CPU promedio + memoria promedio | 60% CPU / 70% memoria | 1 / 4 |

Los demás servicios (`ms-sales`, `ms-inventory`, `ms-finance`, `ms-customer`, `ms-auth`, `ms-data-ingestion`, `ms-reporting`) se dejaron con `desiredCount` fijo en 1, ya que reciben tráfico más acotado y predecible.

### 12.2 Justificación de los umbrales

Se eligieron `api-gateway`, `bff` y `ms-kpis` porque son los tres servicios que concentran el tráfico de todas las consultas del dashboard: el Gateway recibe cada petición pública, el BFF agrega llamadas a tres servicios distintos por cada vista, y `ms-kpis` calcula los indicadores que consume esa misma vista.

El umbral de **60% de CPU** se fijó por debajo del típico 70-80% porque el arranque de una tarea nueva en Fargate no es instantáneo: entre que Target Tracking detecta la superación del umbral y la tarea nueva está lista pasa al menos medio minuto (arranque de JVM, compilación JIT, inicialización de Hibernate y Flyway). Un umbral más alto dejaría menos margen para absorber picos mientras la tarea adicional se inicializa.

En `ms-kpis` se agregó **memoria como segunda métrica** (70%) porque ese servicio construye estructuras de agregación en memoria al calcular indicadores sobre rangos amplios de datos, y ese comportamiento no siempre se refleja primero en la CPU.

### 12.3 Prueba de carga con k6

Se ejecutó una prueba de carga contra `/api/kpis` a través del ALB:

| Parámetro | Valor |
|---|---|
| Herramienta | k6 (Grafana Labs) |
| Usuarios virtuales | 50 |
| Duración | 3 minutos sostenidos |
| Requests procesados | 3.664 |
| Tasa de error | **0,00%** |
| Percentil 95 | 5,45 segundos |

**Comportamiento de autoscaling observado:** `ms-kpis` escaló automáticamente de 1 a 2 tareas en 34 segundos, y continuó escalando hasta el máximo configurado de 4 tareas incluso después de terminada la carga real.

Ese comportamiento post-carga se atribuyó al costo de CPU real del arranque en frío de cada tarea nueva (JVM cold start), que retroalimentaba la métrica promedio del servicio. El techo de `maxCapacity=4` contuvo el sobreescalado sin intervención humana, validando que el límite superior está bien configurado.

---

## 13. Observabilidad y monitoreo

### 13.1 CloudWatch Logs

Cada uno de los 12 servicios escribe su salida estándar en un log group independiente bajo el prefijo `/ecs/cordillera/`, siguiendo el criterio de separación por servicio. A diferencia del entorno EC2 donde los logs requerían acceso SSH, cualquier integrante del equipo con permisos de lectura en CloudWatch puede consultar los logs de un servicio puntual sin conectarse a ninguna máquina.

### 13.2 Container Insights y dashboard

Se habilitó **Container Insights** sobre el clúster, lo que agrega automáticamente métricas de CPU, memoria, red y número de tareas por servicio sin instrumentación adicional en el código. Sobre esas métricas se construyó el dashboard `cordillera-dashboard`, que reúne en una sola vista el consumo de los 12 servicios y sirve como punto de partida para detectar si algún servicio se acerca a su límite de recursos.

### 13.3 Alertas

En esta entrega el foco de observabilidad estuvo en dejar disponibles logs y métricas consultables. Se deja como mejora futura la creación de alarmas de CloudWatch (por ejemplo, número de tareas no saludables o CPU sostenida cerca del máximo) con notificación hacia un canal del equipo.

---

## 14. Validación funcional

### 14.1 Endpoints probados

Tras completar la migración, se ejecutaron pruebas repetidas (3 veces cada una) contra los endpoints principales a través del ALB:

| Endpoint | Resultado |
|---|---|
| `POST /api/auth/login` | 200 ✅ |
| `GET /api/sales` | 200 ✅ |
| `GET /api/kpis` | 200 ✅ |
| `GET /api/inventory` | 200 ✅ |
| `GET /api/customers` | 200 ✅ |
| `GET /api/finance/movements` | 200 ✅ |

**Resultado:** 100% de respuestas 200/201, sin ningún 503.

### 14.2 Frontend accesible públicamente

El frontend responde a través de la URL pública del ALB (`cordillera-alb`), sirviendo la SPA de React y proxyeando las llamadas `/api/` hacia el api-gateway por la red interna.

### 14.3 Comunicación front → back verificada

Se revisaron los logs de CloudWatch de `api-gateway` y `bff` durante las pruebas para confirmar que las peticiones atravesaban ambos componentes antes de llegar al microservicio de datos, descartando respuestas desde caché o datos simulados.

### 14.4 Despliegue automático tras commit

Se verificó el flujo completo del pipeline con un push real a `master`: el workflow construyó y publicó las imágenes, registró nuevas revisiones de Task Definition y forzó el despliegue en los servicios, confirmando el estado estable de cada uno.

---

## 15. Pruebas de resiliencia

Se ejecutaron dos escenarios de prueba sobre `ms-reporting`, documentados con timeline real de eventos.

### 15.1 Escenario 1: caída de una tarea (health check fallido)

Se forzó la caída de una tarea mediante un health check fallido. ECS repuso la tarea de forma automática en un rango de **3 a 4 minutos**, sin intervención manual. El `desiredCount=1` declarativo del servicio fue la garantía: ECS converge hacia el estado deseado en cuanto detecta que la cantidad de tareas saludables es menor a la declarada.

### 15.2 Escenario 2: imagen de despliegue inexistente

Se apuntó `ms-reporting` a un tag deliberadamente roto (`ms-reporting:tag-inexistente`).

**Primera corrida (2026-07-02):** la revisión estable anterior nunca dejó de servir tráfico (cero downtime), pero el Deployment Circuit Breaker no llegó a marcar el deployment como `FAILED` dentro de los ~11 minutos observados. Se forzó el revert manualmente, sin confirmar el rollback automático.

**Segunda corrida (2026-07-03):** mismo procedimiento contra un tag inexistente. Esta vez **el circuit breaker sí revirtió automáticamente, sin ningún comando manual, en 11 minutos 44 segundos**, quedando `rolloutState=COMPLETED` en la revisión buena a los ~13m50s totales.

**Conclusión:** el rollback automático funciona; la corrida anterior se detuvo manualmente justo antes de alcanzar el umbral interno de fallos (`failedTasks=3`) que ECS necesita para declarar el deployment `FAILED` con `desiredCount=1`. El proceso completo toma **aproximadamente 12 minutos**, no es instantáneo.

---

## 16. Decisiones técnicas

### ¿Por qué ECS Fargate y no EKS?

Fargate elimina la administración de nodos (no hay que dimensionar ni parchar instancias EC2 para el clúster), se integra directamente con IAM, ALB, CloudWatch y Secrets Manager, y reduce la superficie de configuración para un proyecto académico con plazo de una semana y presupuesto acotado.

### ¿Por qué ECR y no Docker Hub?

ECR es privado por defecto, las EC2 se autentican automáticamente con IAM, y la latencia de pull es mínima al estar en la misma región AWS.

### ¿Por qué VPC propia y no la default?

La VPC default tiene todas las subredes públicas. El proyecto requiere separar la capa de datos (RDS) y los servicios internos de internet. Con una VPC propia: RDS nunca tiene IP pública, las EC2 privadas no son alcanzables desde internet, y el tráfico entre servicios queda en la red interna.

### ¿Por qué EC2-1 como NAT instance y no NAT Gateway?

NAT Gateway cuesta ~$32/mes en cargos base. EC2-1 como NAT instance aprovecha la instancia ya existente. La desventaja es que si EC2-1 cae, las privadas pierden salida a internet, lo cual es aceptable en un entorno académico.

### ¿Por qué t3.micro y no t2.micro?

`t2.micro` ya no es elegible para Free Tier en esta cuenta AWS. `t3.micro` tiene mejor rendimiento de CPU burst y es Free Tier eligible.

### ¿Por qué swap de 2 GB en cada EC2?

Con solo 1 GB de RAM, la JVM de Spring Boot consume ~300-400 MB por servicio al arrancar. Sin swap, al levantar múltiples servicios el kernel OOM Killer termina procesos. El swap en EBS gp2 absorbe los picos de arranque.

### ¿Por qué multi-stage build en los Dockerfiles?

Imágenes ~4x más livianas (JRE alpine + JAR vs. JDK completo + Maven + artefactos), lo que reduce el tiempo de pull en cada despliegue.

### ¿Por qué Service Connect y no Eureka en ECS?

Service Connect provee descubrimiento de servicios nativo con DNS interno y health checks propios. Mantener Eureka como segundo mecanismo resultó redundante y activamente perjudicial por la inestabilidad observada bajo el modelo de networking de Fargate.

### ¿Por qué un solo ALB apuntando al frontend?

El patrón de acceso siempre pasa primero por el frontend (que sirve la SPA y hace proxy hacia el Gateway vía Nginx). Un segundo Target Group para api-gateway no aportaría una ruta de acceso adicional real y sumaría superficie de ataque.

---

## 17. Incidentes relevantes y resoluciones

### 17.1 Bug de login: `POST /api/auth/login` → 404

**Causa:** `GatewayRoutesConfig.java` definía un `@Bean RouteLocator` programático con rutas hardcodeadas a `http://host.docker.internal:PUERTO` (leftover de pruebas locales) que era el único enrutador activo. Las 18 rutas en `application.yml` nunca funcionaron porque Spring Cloud Gateway 5.x movió el prefijo de configuración a `spring.cloud.gateway.server.webflux.*`.

**Fix:** se eliminó `GatewayRoutesConfig.java` y se corrigió el prefijo en `application.yml`. Verificado con `/actuator/gateway/routes`.

### 17.2 Crash-loop de microservicios por incompatibilidad Spring Boot / Cloud

**Causa:** el parent pom tenía `spring-boot-starter-parent:3.5.6`, pero `spring-cloud-dependencies:2025.1.1` requiere Spring Boot **4.0.2+**, causando `BeanDefinitionOverrideException`.

**Fix:** parent pom actualizado a `4.0.5`. Efecto colateral: migración de 9 archivos de test a la nueva API de Boot 4 (`@MockBean` → `@MockitoBean`).

### 17.3 Disco lleno (8 GB) en las 4 EC2

**Causa:** el driver `json-file` de Docker sin `max-size`/`max-file`. Logs de contenedores crecieron sin límite hasta `no space left on device`.

**Fix:** `/etc/docker/daemon.json` con `{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}`.

### 17.4 Conectividad 500/503 entre EC2 diferentes

**Causa:** `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true` hacía que cada microservicio se registrara con la IP interna de su contenedor Docker (`172.19.0.x`), válida solo dentro de su propio host. Cuando `api-gateway` (EC2-1) intentaba conectarse a un servicio en EC2-4 vía esa IP, no era enrutable.

**Fix:** se agregó `EUREKA_INSTANCE_IP_ADDRESS=<IP privada del host>` en los 4 docker-compose de producción.

### 17.5 Páginas en blanco (Sales, Finance, KPIs, Inventory)

**Causa:** `SalesPage.jsx`, `FinancePage.jsx`, `KpisPage.jsx` e `InventoryPage.jsx` pasaban `<DataTable columns={columns} />` pero la variable `columns` nunca estaba declarada. Esto lanza un `ReferenceError` durante el render y el `useEffect` nunca se ejecuta. `npm run build` (Vite) no detecta estas referencias indefinidas al no haber TypeScript ni ESLint bloqueante.

**Fix:** se declararon las definiciones de `columns` en los 4 archivos.

### 17.6 POST (crear registros) fallaba con 500 en todos los microservicios

**Causa:** las 8 bases de datos se sembraron con `INSERT INTO tabla (id, ...) VALUES (1, ...)` con IDs explícitos, pero las secuencias (`SERIAL`/`IDENTITY`) seguían arrancando desde 1. Al crear un registro nuevo, Hibernate pedía el siguiente valor de la secuencia, chocando con filas existentes: `duplicate key value violates unique constraint`.

**Fix:** script SQL genérico que recorre secuencias y ejecuta `setval(secuencia, MAX(id), true)` por cada tabla en las 8 bases de datos.

### 17.7 URLs hardcodeadas en BFF

**Causa:** `KpisClient.java`, `IngestionClient.java` y `ReportingClient.java` tenían constantes `http://host.docker.internal:PORT`, una URL que nunca funcionó en ningún entorno, enmascarada por `onErrorResume` de WebClient.

**Fix:** se externalizaron a `@Value("${services.ms-kpis.url}")` y equivalentes, configurables por variable de entorno.

### 17.8 Nginx mostraba la página default

**Causa:** un `nginx` nativo (systemd) instalado manualmente en EC2-1 tomaba el puerto 80 antes que el contenedor Docker.

**Fix:** `systemctl disable nginx`.

---

## 18. Archivos clave del repositorio

| Archivo | Contenido |
|---|---|
| `cordillera/pom.xml` | Parent Maven — versión de Spring Boot/Cloud, dependencias comunes |
| `.github/workflows/ci-cd.yml` | Pipeline completo de CI/CD |
| `deploy/ec2-{1,2,3,4}/docker-compose.yml` | Topología de despliegue real por instancia EC2 |
| `deploy/deploy-all.sh` | Script de despliegue manual alternativo |
| `deploy/ecs/README.md` | Arquitectura, servicios y despliegue del entorno ECS Fargate |
| `deploy/ecs/task-definitions/*.json` | Task Definitions de los 12 servicios ECS |
| `deploy/ecs/aws-resources-created.md` | Cronología de cada recurso AWS creado en la migración |
| `deploy/ecs/infra-reuse-evaluation.md` | Evaluación de qué infraestructura EC2 se reutilizó en ECS |
| `deploy/evidencia/resumen-autoscaling.md` | Detalle de la prueba de carga y comportamiento del autoscaling |
| `deploy/evidencia/resiliencia-circuit-breaker.md` | Timeline de las pruebas de resiliencia |
| `deploy/reset_sequences.sql` | Script para resincronizar secuencias de Postgres tras seeds |
| `cordillera/infraestructure/api-gateway/src/main/resources/application.yml` | Rutas del Gateway |
| `cordillera/infraestructure/ms-auth/src/main/resources/application.yml` | Config JWT, Flyway, Resend |
| `cordillera/frontend/grupoCordillera/nginx.conf` | Proxy del frontend hacia el Gateway |
| `cordillera/frontend/grupoCordillera/src/pages/*.jsx` | Páginas React del dashboard |
| `cordillera/API_ENDPOINTS.md` | Documentación de endpoints por microservicio |

---

## 19. Mejoras futuras

- Configurar **alarmas de CloudWatch** con notificación activa sobre las métricas de Container Insights (tareas no saludables, CPU sostenida cerca del máximo).
- Evaluar un **despliegue selectivo** por servicio según los archivos modificados en el commit, en vez de redesplegar los 12 servicios ante cualquier cambio.
- Incorporar **HTTPS en el ALB** una vez que el proyecto cuente con un dominio propio.
- Repetir la prueba de imagen rota con un `desiredCount` mayor a 1 para confirmar si el Deployment Circuit Breaker reacciona más rápido con más señal disponible.
- Crear **VPC Interface Endpoints** para ECR, Secrets Manager y CloudWatch Logs, eliminando la dependencia de EC2-1 como NAT instance para las tareas Fargate.
- Agregar **migraciones Flyway completas** (`CREATE TABLE`) en todos los microservicios, reemplazando `hibernate.ddl-auto=update`.

---

## 20. Lecciones aprendidas

- **Migrar infraestructura no obliga a migrar todos los mecanismos:** intentar mantener Eureka "por si acaso" en ECS costó más tiempo de diagnóstico que haber decidido reemplazarlo desde el principio.

- **Health check y circuit breaker no sustituyen una prueba de resiliencia real:** solo al forzar deliberadamente una imagen rota se descubrió que el circuit breaker no reaccionaba dentro del tiempo esperado con `desiredCount=1`.

- **Documentar exactamente lo que ocurrió, incluyendo lo que no funcionó, es más útil que reportar solo resultados favorables.** Cada incidente resuelto en esta documentación evita re-investigar desde cero.

- **Reutilizar infraestructura ya validada** (VPC, RDS, ECR) reduce el riesgo de una migración al limitar las variables nuevas introducidas a la vez.

- **El driver de logs de Docker necesita rotación desde el primer despliegue.** Sin `max-size`/`max-file`, un contenedor con log verboso puede agotar un volumen de 8 GB en pocas horas.

- **`npm run build` no detecta variables indefinidas en JSX** (sin TypeScript ni ESLint bloqueante). Si una página queda en blanco con 200 pero sin llamadas de red, revisar la consola del navegador.

- **Las secuencias de Postgres deben sincronizarse** después de seeds con ID explícito. Sin `setval()`, el primer `INSERT` desde la aplicación chocará con un ID ya existente.

---

## Flujo completo de trabajo DevOps

```
Desarrollador                GitHub                          AWS
     │                          │                              │
     │── git push master ──────►│                              │
     │                          │                              │
     │                    [Actions inicia]                     │
     │                          │                              │
     │                    build-backend                        │
     │                    (mvn verify)                         │
     │                          │                              │
     │                    build-frontend                       │
     │                    (npm build)                          │
     │                          │                              │
     │                    push-images                          │
     │                    docker build ────────────────────────►│ ECR
     │                    docker push                           │ (12 repos)
     │                          │                              │
     │                    deploy-ecs                            │
     │                    register-task-definition ────────────►│ ECS
     │                    update-service --force-new-deployment │
     │                    wait services-stable                  │
     │                          │                              │
     │                    [Circuit Breaker activo]              │
     │                    Si falla → rollback automático        │
     │                          │                              │
     │◄── Pipeline verde ───────│                              │
     │                          │                              │
     │       http://cordillera-alb.us-east-2.elb.amazonaws.com │
     │                                  ◄──────────────────────── App corriendo
```

**Beneficios concretos del proceso DevOps implementado:**

- **Reproducibilidad:** la misma imagen que pasó los tests es exactamente la que corre en producción.
- **Trazabilidad:** cada imagen lleva el tag del commit que la generó, permitiendo rollback exacto.
- **Consistencia:** todos los entornos corren el mismo contenedor, eliminando "funciona en mi máquina".
- **Velocidad:** un push activa 12 despliegues coordinados sin intervención humana.
- **Seguridad:** los secretos nunca están en el código, viven en Secrets Manager y GitHub Secrets.
- **Resiliencia:** el orquestador repone tareas caídas y revierte despliegues fallidos automáticamente.

---

*Grupo Cordillera — ISY1101 Introducción a Herramientas DevOps — Duoc UC — julio 2026*
