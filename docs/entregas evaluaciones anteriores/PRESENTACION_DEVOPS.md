# Presentación DevOps — Grupo Cordillera
## DSY1106 Desarrollo Fullstack III — DUOC UC 2026
### Integrantes: Felipe Ulloa · Rodrigo Jara · Dario Morales

---

## Índice

1. [Contexto del Proyecto](#1-contexto-del-proyecto)
2. [Arquitectura de Microservicios](#2-arquitectura-de-microservicios)
3. [Construcción de Contenedores](#3-construcción-de-contenedores)
4. [Docker Compose](#4-docker-compose)
5. [Infraestructura AWS](#5-infraestructura-aws)
6. [Amazon ECR — Registro de Imágenes](#6-amazon-ecr--registro-de-imágenes)
7. [Pipeline CI/CD con GitHub Actions](#7-pipeline-cicd-con-github-actions)
8. [Flujo Completo de Trabajo DevOps](#8-flujo-completo-de-trabajo-devops)
9. [Decisiones Técnicas Adoptadas](#9-decisiones-técnicas-adoptadas)
10. [Importancia del Proceso en el Ciclo DevOps](#10-importancia-del-proceso-en-el-ciclo-devops)

---

## 1. Contexto del Proyecto

**Grupo Cordillera** es una plataforma de monitoreo empresarial para la Alta Gerencia de un holding con múltiples sucursales. Centraliza KPIs de ventas, inventario, finanzas y clientes en un dashboard único.

### Stack tecnológico real

| Capa | Tecnología |
|------|-----------|
| Backend | Java 21 + Spring Boot 4.0.5 + Spring Cloud 2025.1.1 |
| Frontend | React 19 + Vite 8 + Tailwind CSS |
| Base de Datos | PostgreSQL 16 |
| Contenedores | Docker + Docker Compose v2 |
| Registry | Amazon ECR |
| CI/CD | GitHub Actions |
| Infraestructura | AWS us-east-2 (Ohio) |

---

## 2. Arquitectura de Microservicios

El sistema tiene **12 servicios** distribuidos en 4 capas:

```
Cliente (browser)
    │
    ▼
┌─────────────────────────────────────┐  EC2-1 (pública · 3.133.80.5)
│  Frontend React (Nginx :80)         │
│  API Gateway Spring Cloud (:8080)   │
│  ms-auth JWT (:8086)                │
└──────────────┬──────────────────────┘
               │ (subred privada)
               ▼
┌──────────────────────────────┐  EC2-2 (privada · 10.0.2.107)
│  Eureka Server (:8761)       │  ← Service Discovery
│  BFF + Circuit Breaker(:8085)│  ← Orquestación + Resilience4j
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────────────────────────────┐
│   EC2-3      │  │   EC2-4 (privada · 10.0.2.100)       │
│  Core Intel. │  │   Data Sources                        │
│  :8090 8091  │  │   ms-sales     :8081                  │
│  :8092       │  │   ms-inventory :8082                  │
└──────┬───────┘  │   ms-finance   :8083                  │
       │          │   ms-customer  :8084                  │
       └──────────┴───────────┬───────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  RDS PostgreSQL │
                    │  db.t3.micro    │
                    │  8 bases lógicas│
                    └─────────────────┘
```

### Servicios y puertos

| Servicio | Puerto | EC2 | Responsable |
|---------|--------|-----|-------------|
| frontend | 80 | EC2-1 | Felipe + Dario |
| api-gateway | 8080 | EC2-1 | Rodrigo |
| ms-auth | 8086 | EC2-1 | Rodrigo |
| eureka-server | 8761 | EC2-2 | Rodrigo |
| bff | 8085 | EC2-2 | Rodrigo |
| ms-data-ingestion | 8090 | EC2-3 | Felipe |
| ms-kpis | 8091 | EC2-3 | Felipe |
| ms-reporting | 8092 | EC2-3 | Felipe |
| ms-sales | 8081 | EC2-4 | Dario |
| ms-inventory | 8082 | EC2-4 | Dario |
| ms-finance | 8083 | EC2-4 | Dario |
| ms-customer | 8084 | EC2-4 | Dario |

---

## 3. Construcción de Contenedores

### 3.1 Estrategia: Multi-stage Build

Todos los servicios backend usan **multi-stage build** para reducir el tamaño de imagen final:

- **Stage 1 (build):** `eclipse-temurin:21-jdk-alpine` — compila el JAR con Maven
- **Stage 2 (runtime):** `eclipse-temurin:21-jre-alpine` — solo el JRE + el JAR

**Ventaja:** la imagen final no incluye el JDK ni las dependencias de build → imagen ~3x más liviana.

### 3.2 Dockerfile Backend (patrón compartido)

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

> **Por qué `-Xmx160m`:** las EC2 son t3.micro con 1 GB de RAM y corren múltiples servicios en paralelo. Sin límite de heap la JVM puede consumir toda la RAM y colapsar el nodo.

### 3.3 Dockerfile Frontend

El frontend usa un patrón diferente: **Node para build → Nginx para servir.**

```dockerfile
# Stage 1 — Build React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                  # instala dependencias exactas del lockfile
COPY . .
RUN npm run build           # genera /app/dist con los estáticos

# Stage 2 — Servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.4 Nginx como Reverse Proxy

El `nginx.conf` cumple dos roles: servir la SPA y hacer proxy de las llamadas API al Gateway:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA routing
    }

    location /api/ {
        proxy_pass http://api-gateway:8080; # proxy al gateway (misma red Docker)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 4. Docker Compose

### 4.1 Docker Compose local (desarrollo)

El archivo raíz `docker-compose.yml` levanta **todos los servicios en una sola máquina** para desarrollo local. Incluye:

- `postgres:16-alpine` con init script que crea las 8 bases de datos
- Health checks en postgres y eureka para gestionar el orden de arranque
- `depends_on` con condiciones (`service_healthy`, `service_started`)
- Red bridge compartida `cordillera-net`
- Variables de entorno con valores por defecto

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

### 4.2 Docker Compose por EC2 (producción AWS)

Para producción se generaron **4 docker-compose separados**, uno por EC2, usando imágenes pre-construidas desde ECR:

| Archivo | EC2 | Servicios |
|---------|-----|----------|
| `deploy/ec2-1/docker-compose.yml` | EC2-1 pública | api-gateway, ms-auth, frontend |
| `deploy/ec2-2/docker-compose.yml` | EC2-2 privada | eureka-server, bff |
| `deploy/ec2-3/docker-compose.yml` | EC2-3 privada | ms-data-ingestion, ms-kpis, ms-reporting |
| `deploy/ec2-4/docker-compose.yml` | EC2-4 privada | ms-sales, ms-inventory, ms-finance, ms-customer |

**Diferencia clave entre local y producción:**

| Aspecto | Local | Producción |
|---------|-------|-----------|
| Imágenes | `build:` (compila local) | `image:` (pull desde ECR) |
| Base de datos | `postgres` container local | RDS endpoint externo |
| Eureka URL | `http://eureka-server:8761` | `http://10.0.2.107:8761` |
| Secretos | valores hardcoded de dev | variables de entorno del sistema |

---

## 5. Infraestructura AWS

### 5.1 VPC — Red Virtual Privada

Se creó una VPC dedicada `cordillera-vpc` con arquitectura de subredes públicas/privadas:

```
VPC: 10.0.0.0/16  (cordillera-vpc)
│
├── Subred pública  10.0.1.0/24  us-east-2a
│   └── EC2-1 (bastion + NAT + Frontend + Gateway)
│       Elastic IP: 3.133.80.5
│
├── Subred privada  10.0.2.0/24  us-east-2a
│   ├── EC2-2  10.0.2.107  (Eureka + BFF)
│   ├── EC2-3  10.0.2.118  (Core Intelligence)
│   ├── EC2-4  10.0.2.100  (Data Sources)
│   └── RDS    (PostgreSQL 16)
│
└── Subred privada  10.0.3.0/24  us-east-2b
    └── RDS subnet group (requerido multi-AZ)
```

### 5.2 Security Groups (Firewall virtual)

| Security Group | Reglas inbound | Aplica a |
|----------------|---------------|---------|
| SG-PUBLIC | SSH:22 desde Mi IP · HTTP:80 · HTTPS:443 · TCP:8080 · TCP:8761 desde internet | EC2-1 |
| SG-PRIVATE | SSH:22 desde SG-PUBLIC · TCP:8081-8092 desde SG-PUBLIC y SG-PRIVATE · TCP:8761 entre privadas | EC2-2,3,4 |
| SG-DATABASE | TCP:5432 solo desde SG-PRIVATE y SG-PUBLIC | RDS |

> **Principio de mínimo privilegio:** Las EC2 privadas no son accesibles desde internet. Solo EC2-1 tiene IP pública. La base de datos solo acepta conexiones desde los microservicios.

### 5.3 EC2-1 como NAT Instance

EC2-1 tiene un doble rol: es el **bastion host** (punto de entrada SSH) y la **NAT instance** (permite que las EC2 privadas descarguen imágenes Docker de ECR sin exponerlas a internet).

Configuración en User Data al lanzar la instancia:
```bash
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

Y la Route Table privada tiene: `0.0.0.0/0 → EC2-1 (i-05d008dd7dd644af4)`

### 5.4 RDS PostgreSQL 16

- **Instancia:** `db.t3.micro` — Free Tier
- **Endpoint:** `cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com`
- **Sin acceso público** — solo accesible desde SG-PRIVATE y SG-PUBLIC
- **8 bases de datos lógicas** en una sola instancia: `db_auth`, `db_sales`, `db_inventory`, `db_finance`, `db_customer`, `db_ingestion`, `db_kpis`, `db_reporting`

### 5.5 User Data (aprovisionamiento automático)

Al lanzar cada EC2, se inyecta un script que instala automáticamente:

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

---

## 6. Amazon ECR — Registro de Imágenes

Amazon ECR (Elastic Container Registry) es el servicio privado de Docker Hub de AWS.

### 6.1 Repositorios creados

Registry: `215682485633.dkr.ecr.us-east-2.amazonaws.com`

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

### 6.2 Versionado de imágenes

Cada push genera **dos tags** por imagen:
- `:latest` — siempre apunta a la versión más reciente
- `:<git-sha>` — hash del commit, permite rollback exacto

```bash
image="215682485633.dkr.ecr.us-east-2.amazonaws.com/grupocordillera/ms-kpis"
docker build -t $image:latest -t $image:$GITHUB_SHA .
docker push $image:latest
docker push $image:$GITHUB_SHA
```

### 6.3 Autenticación EC2 → ECR

Las EC2 se autentican en ECR con sus credenciales IAM (AWS CLI preinstalado en Amazon Linux 2023):

```bash
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  215682485633.dkr.ecr.us-east-2.amazonaws.com
```

---

## 7. Pipeline CI/CD con GitHub Actions

### 7.1 Flujo general

```
Push a develop
      │
      ▼
┌─────────────────────┐    ┌─────────────────────┐
│   build-backend     │    │   build-frontend     │
│                     │    │                      │
│  ./mvnw clean verify│    │  npm ci              │
│  (build + tests)    │    │  npm run build       │
└──────────┬──────────┘    └──────────┬───────────┘
           │                          │
           └──────────┬───────────────┘
                      │ (ambos deben pasar)
                      ▼
           ┌──────────────────────┐
           │    push-images       │
           │                      │
           │  Login ECR           │
           │  docker build        │
           │  docker push :latest │
           │  docker push :<sha>  │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │      deploy          │
           │                      │
           │  SSH → EC2-1         │
           │  ProxyJump → EC2-2,3,4│
           │  docker compose pull │
           │  docker compose up -d│
           └──────────────────────┘
```

### 7.2 Archivo de workflow

**Triggers:**
```yaml
on:
  push:
    branches: [develop]      # CI/CD automático
  pull_request:
    branches: [main]         # Solo build+test, no deploy
```

**Jobs definidos:**
```yaml
jobs:
  build-backend:   # mvn clean verify
  build-frontend:  # npm ci + npm run build
  push-images:     # docker build + push ECR (solo en push a develop)
  deploy:          # SSH deploy (solo en push a develop, requiere ambos builds)
```

### 7.3 Deploy via SSH con ProxyJump

El pipeline accede a las EC2 privadas saltando por EC2-1 (bastion):

```yaml
- name: Configurar SSH
  run: |
    echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/cordillera-key.pem
    chmod 600 ~/.ssh/cordillera-key.pem
    cat >> ~/.ssh/config <<EOF
    Host bastion
      HostName 3.133.80.5
      User ec2-user
      IdentityFile ~/.ssh/cordillera-key.pem

    Host ec2-3
      HostName 10.0.2.118
      ProxyJump bastion      # ← salta por EC2-1
    EOF

- name: Deploy EC2-3
  run: |
    ssh ec2-3 "
      docker compose pull
      docker compose up -d
    "
```

### 7.4 Secrets configurados en GitHub

| Secret | Propósito |
|--------|----------|
| `AWS_ACCESS_KEY_ID` | Autenticar AWS CLI en el runner |
| `AWS_SECRET_ACCESS_KEY` | Autenticar AWS CLI en el runner |
| `EC2_SSH_KEY` | Clave privada PEM para SSH a las EC2 |
| `EC2_1_HOST` | `3.133.80.5` — bastion público |
| `EC2_2_HOST` | `10.0.2.107` — Eureka+BFF |
| `EC2_3_HOST` | `10.0.2.118` — Core Intelligence |
| `EC2_4_HOST` | `10.0.2.100` — Data Sources |
| `RDS_ENDPOINT` | Endpoint del RDS PostgreSQL |
| `DB_PASSWORD` | Password del RDS |
| `JWT_SECRET` | Clave de firma de tokens |
| `RESEND_API_KEY` | API de envío de emails |

---

## 8. Flujo Completo de Trabajo DevOps

```
Desarrollador                GitHub                  AWS
     │                          │                     │
     │── git push develop ──────►│                     │
     │                          │                     │
     │                    [Actions inicia]             │
     │                          │                     │
     │                    build-backend               │
     │                    (mvn verify)                │
     │                          │                     │
     │                    build-frontend              │
     │                    (npm build)                 │
     │                          │                     │
     │                    push-images                 │
     │                    docker build ───────────────►│ ECR
     │                    docker push                 │ (12 repos)
     │                          │                     │
     │                    deploy                      │
     │                    SSH → EC2-1 ───────────────►│
     │                    ProxyJump → EC2-2 ──────────►│
     │                    ProxyJump → EC2-3 ──────────►│
     │                    ProxyJump → EC2-4 ──────────►│
     │                          │   docker compose pull│
     │                          │   docker compose up -d
     │                          │                     │
     │◄── Pipeline verde ───────│                     │
     │                          │                     │
     │         http://3.133.80.5  ◄──────────────────── App corriendo
```

---

## 9. Decisiones Técnicas Adoptadas

### ¿Por qué ECR y no Docker Hub?

| Criterio | ECR | Docker Hub |
|---------|-----|-----------|
| Privacidad | Privado por defecto | Público por defecto (free) |
| Autenticación en EC2 | IAM automático | Credenciales manuales |
| Latencia | Mismo datacenter (us-east-2) | Externo |
| Integración | Nativa con AWS (IAM, VPC) | Requiere configuración extra |

**Decisión:** ECR porque las EC2 se autentican automáticamente con IAM roles y la latencia de pull es mínima al estar en la misma región.

### ¿Por qué una VPC propia y no la default?

La VPC default de AWS tiene todas las subredes públicas. El proyecto requiere separar la capa de datos (RDS) y los servicios internos de internet. Con una VPC propia:
- RDS nunca tiene IP pública
- EC2 privadas no son alcanzables desde internet
- El tráfico entre servicios queda en la red interna de AWS

### ¿Por qué EC2-1 como NAT Instance y no NAT Gateway?

**NAT Gateway** de AWS cuesta ~$32/mes solo en cargos base. **EC2-1 como NAT instance** aprovecha la instancia ya existente (Free Tier / costo compartido). La desventaja es que si EC2-1 cae, las privadas pierden salida a internet — aceptable para un entorno académico.

### ¿Por qué t3.micro y no t2.micro?

`t2.micro` ya no es elegible para Free Tier en esta cuenta AWS. `t3.micro` tiene **mejor rendimiento de CPU burst** (créditos T3 vs T2) y es Free Tier eligible en la cuenta utilizada.

### ¿Por qué swap de 2GB en cada EC2?

Las EC2 t3.micro tienen **1 GB de RAM**. La JVM de Spring Boot consume ~300-400 MB por servicio al arrancar. Sin swap, al intentar levantar múltiples servicios en una misma EC2, el kernel OOM Killer termina procesos. El swap en un EBS gp2 es suficiente para absorber los picos de arranque.

### ¿Por qué multi-stage build en los Dockerfiles?

Sin multi-stage, la imagen final incluiría el JDK completo (~350 MB), Maven, y todos los artefactos de compilación. Con multi-stage, la imagen final solo tiene JRE alpine (~80 MB) + el JAR (~50 MB). Resultado: imágenes ~4x más livianas → pull más rápido en deploy.

---

## 10. Importancia del Proceso en el Ciclo DevOps

### El problema sin DevOps

Sin este pipeline, el proceso de despliegue sería:
1. Desarrollador compila en su laptop (8-15 min)
2. Copia el JAR manualmente por SCP al servidor
3. Reinicia el servicio manualmente
4. Repite para cada uno de los 12 servicios
5. Sin garantía de que lo que se desplegó es lo mismo que pasó los tests

**Resultado:** deploys lentos, inconsistentes y propensos a error humano.

### El proceso con DevOps implementado

```
Desarrollador hace git push
        │
        │  (automático, ~15-20 min total)
        ▼
Tests pasan → Imagen construida → Publicada en ECR → Desplegada en 4 EC2
```

**Beneficios concretos:**
- **Reproducibilidad:** la misma imagen que pasó los tests es exactamente la que corre en producción
- **Trazabilidad:** cada imagen lleva el tag del commit que la generó → rollback exacto
- **Consistencia:** todos los entornos corren el mismo contenedor, elimina "funciona en mi máquina"
- **Velocidad:** un push activa 12 deploys coordinados en paralelo sin intervención humana
- **Seguridad:** los secretos nunca están en el código, viven en GitHub Secrets y AWS IAM

### Relación con el ciclo DevOps

```
Plan → Code → Build → Test → Release → Deploy → Operate → Monitor
                 ↑                        ↑          ↑
              Maven/npm           GitHub Actions   Docker Compose
              Docker build           ECR push      restart policy
```

El pipeline automatiza las fases **Build → Test → Release → Deploy**, dejando al equipo libre para **Code** y **Plan**.

---

## Resumen de Entregables

| Entregable | Estado | Ubicación |
|-----------|--------|-----------|
| Dockerfiles backend (11 servicios) | ✅ | `cordillera/{módulo}/{servicio}/Dockerfile` |
| Dockerfile frontend | ✅ | `cordillera/frontend/grupoCordillera/Dockerfile` |
| nginx.conf (reverse proxy) | ✅ | `cordillera/frontend/grupoCordillera/nginx.conf` |
| Docker Compose local | ✅ | `docker-compose.yml` (raíz) |
| Docker Compose producción (×4) | ✅ | `deploy/ec2-{1,2,3,4}/docker-compose.yml` |
| Script deploy manual | ✅ | `deploy/deploy-all.sh` |
| Pipeline CI/CD | ✅ | `.github/workflows/ci-cd.yml` |
| VPC + Subredes + IGW + NAT | ✅ | AWS us-east-2 |
| 4 EC2 t3.micro | ✅ | AWS us-east-2 |
| RDS PostgreSQL 16 | ✅ | AWS us-east-2 |
| 12 repositorios ECR | ✅ | AWS us-east-2 |

---

*Grupo Cordillera — DSY1106 Desarrollo Fullstack III — DUOC UC — Mayo 2026*
