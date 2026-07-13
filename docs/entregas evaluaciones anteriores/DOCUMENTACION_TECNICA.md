# Documentación Técnica — Grupo Cordillera (DSY1106)

> Última actualización: 2026-07-03. Este documento refleja el **estado real verificado** del código y la infraestructura en AWS a esa fecha (no el `BACKEND_SPEC.md` original, que quedó desactualizado). Si algo diverge de lo aquí escrito, confiar en el código/infraestructura real y actualizar este archivo.
>
> **⚠️ A partir del 2026-07-03, toda la infraestructura de cómputo (EC2, ECS, RDS) fue DETENIDA (no eliminada) para no seguir consumiendo créditos AWS mientras no se necesita, hasta el examen (~2026-07-10). Ver §13 para el estado exacto y el procedimiento de reactivación antes de usar cualquier URL/IP de este documento.**

## 1. Resumen del proyecto

Plataforma de monitoreo empresarial basada en microservicios. Monorepo Maven ubicado en `Fullstack3/cordillera/`, con 11 microservicios Spring Boot + un frontend React, organizados en 3 módulos padre agregadores más el frontend:

```
cordillera/
├── data-sources/         (módulo agregador)
│   ├── ms-sales           :8081
│   ├── ms-inventory       :8082
│   ├── ms-finance         :8083
│   └── ms-customer        :8084
├── core-intelligence/     (módulo agregador)
│   ├── ms-data-ingestion  :8090
│   ├── ms-kpis            :8091
│   └── ms-reporting       :8092
├── infraestructure/       (módulo agregador)
│   ├── eureka-server      :8761
│   ├── api-gateway        :8080
│   ├── bff                :8085
│   └── ms-auth            :8086
└── frontend/grupoCordillera   (React + Vite, servido por nginx en :80)
```

Cada microservicio de negocio (`data-sources`, `core-intelligence`) tiene su propia base de datos PostgreSQL lógica. `ms-auth` maneja autenticación JWT independiente. `bff` agrega llamadas para el dashboard del frontend. `api-gateway` es el único punto de entrada HTTP público, enrutando por prefijo `/api/*` hacia el microservicio correspondiente vía Eureka.

## 2. Stack tecnológico real

| Componente | Versión | Notas |
|---|---|---|
| Java | 21 | |
| Spring Boot | **4.0.5** | Fijado en `cordillera/pom.xml` (parent). No confundir con `BACKEND_SPEC.md`, que documenta Boot 3.2.5/Java 17 — desactualizado. |
| Spring Cloud | 2025.1.1 | Requiere Spring Boot 4.0.2+ (ver §7.1, incidente de compatibilidad). |
| Spring Cloud Gateway | 5.0.1 (`spring-cloud-starter-gateway-server-webflux`) | Gateway reactivo (WebFlux), no MVC. Prefijo de config `spring.cloud.gateway.server.webflux.*` (cambió en la v5, ver §7.1). |
| Descubrimiento de servicios | Netflix Eureka (`spring-cloud-starter-netflix-eureka-client`/`-server`) | |
| Base de datos | PostgreSQL 16 (AWS RDS) | 8 bases de datos lógicas, una por microservicio con persistencia. |
| Migraciones | Flyway | Usado al menos en `ms-auth` (`V2__seed_admin.sql` crea usuarios seed). Otros MS usan `hibernate.ddl-auto=update`. |
| Auth | JWT (`io.jsonwebtoken` / jjwt 0.12.6) | Emitido por `ms-auth`, validado en cada MS o vía Gateway según diseño. |
| ORM | Spring Data JPA / Hibernate | Paquete `model/` (no `entity/`) en cada MS. |
| Resiliencia | Resilience4j (`spring-cloud-starter-circuitbreaker-resilience4j`) | |
| Frontend | React + Vite + Tailwind v4 (JavaScript, no TypeScript) | Servido como estáticos por nginx (Tailwind v4 no necesita `autoprefixer`). Sin type-checking ni ESLint bloqueando el build — errores de variables indefinidas en JSX solo se detectan en runtime en el navegador (ver §9). |
| Contenedores | Docker (multi-stage: `eclipse-temurin:21-jdk-alpine` build → `eclipse-temurin:21-jre-alpine` runtime) | |
| CI/CD | GitHub Actions | Ver §6. |
| Registro de imágenes | Amazon ECR | Ver §5.4. |

Paquete base de cada microservicio: `cl.fullstack3.ms{nombre}` (sin guiones, ej. `cl.fullstack3.mskpis`).

## 3. Arquitectura y comunicación entre servicios

```
Internet
   │
   ▼  :80 (HTTP)
┌─────────────────────────────┐
│  EC2-1 (pública, bastion)    │
│  ┌────────────┐              │
│  │  frontend   │ nginx :80   │──── sirve SPA + proxy_pass /api/ ──┐
│  └────────────┘              │                                    │
│  ┌────────────┐              │                                    ▼
│  │ api-gateway │ :8080  ◄────┼──────── enruta /api/** por Path predicate
│  └──────┬─────┘              │         hacia lb://<servicio> (vía Eureka)
│  ┌──────▼─────┐              │
│  │  ms-auth   │ :8086        │──── JDBC ──► RDS (db_auth)
│  └────────────┘              │
└──────────────┬────────────────┘
               │ VPC privada (10.0.0.0/16)
   ┌───────────┼─────────────────────────────┐
   ▼                                          ▼
EC2-2 (10.0.2.107)                    EC2-3 (10.0.2.118)          EC2-4 (10.0.2.100)
 eureka-server :8761                   ms-data-ingestion :8090     ms-sales     :8081
 bff :8085 ─────────────────►          ms-kpis           :8091     ms-inventory :8082
   (llama a ms-kpis/reporting/         ms-reporting      :8092     ms-finance   :8083
    ingestion vía Eureka)                                          ms-customer  :8084
                                                                     │
                                                                     ▼ JDBC
                                                              RDS (db_sales, db_inventory,
                                                              db_finance, db_customer, etc.)
```

- Todos los microservicios (incluido `api-gateway` y `bff`) se registran en **Eureka** (`eureka-server:8761` en EC2-2) y se descubren entre sí por nombre de aplicación (`lb://ms-sales`, `lb://ms-auth`, etc.).
- El **Gateway** es el único componente con rutas HTTP públicas definidas explícitamente en `infraestructure/api-gateway/src/main/resources/application.yml` (`spring.cloud.gateway.server.webflux.routes`).
- El **frontend** nunca llama directo a los microservicios: todo pasa por `nginx (puerto 80) → proxy_pass /api/ → api-gateway:8080 → lb://<servicio>`.
- El **BFF** (`bff:8085`) agrega datos de `ms-kpis`, `ms-reporting` e `ms-data-ingestion` para las vistas de dashboard, también vía Eureka.

## 4. Credenciales de prueba (seed)

Usuarios creados por Flyway (`V2__seed_admin.sql`) en `db_auth.users`:

| Email | Password | Rol |
|---|---|---|
| `admin@cordillera.cl` | `Admin1234!` | ADMIN |
| `usuario@cordillera.cl` | `Admin1234!` | USER |

URL de acceso: `http://3.148.98.28` (IP elástica de EC2-1, puede cambiar — ver §5.2).

## 5. Infraestructura AWS (us-east-2, cuenta 215682485633)

### 5.1 Red (VPC)

| Recurso | ID | CIDR / Detalle |
|---|---|---|
| VPC | `vpc-0b9c0a321dc30fa83` | `10.0.0.0/16` (`cordillera-vpc`) |
| Internet Gateway | `igw-003eb7d09a3f99334` | |
| Subred pública | `subnet-0d026163d43190d68` | `10.0.1.0/24` — us-east-2a — EC2-1 |
| Subred privada 2a | `subnet-0c37930ff9a14e070` | `10.0.2.0/24` — us-east-2a — EC2-2, 3, 4 |
| Subred privada 2b | `subnet-01ee6cc30cb65eee9` | `10.0.3.0/24` — us-east-2b — RDS |
| Route table pública | `rtb-0baa825f3d82e3170` | → IGW |
| Route table privada | `rtb-03c7217fc4d221f6d` | → EC2-1 (NAT instance, no NAT Gateway administrado) |

EC2-1 actúa como **NAT instance** manual (no AWS NAT Gateway) para dar salida a internet a las subredes privadas — requiere `iptables MASQUERADE` sobre la interfaz `ens5` (Amazon Linux 2023 no usa `eth0`).

### 5.2 Instancias EC2 (t3.micro, Amazon Linux 2023)

| Nombre | Instance ID | IP privada | IP pública | Rol |
|---|---|---|---|---|
| cordillera-ec2-1-public | `i-05d008dd7dd644af4` | 10.0.1.58 | **3.148.98.28** (Elastic IP `eipalloc-0b29c090f76b92d60`) | frontend + api-gateway + ms-auth + bastion SSH + NAT |
| cordillera-ec2-2-eureka-bff | `i-0ca0519f821489086` | 10.0.2.107 | — | eureka-server + bff |
| cordillera-ec2-3-core | `i-03a2918d757fc81bb` | 10.0.2.118 | — | ms-data-ingestion + ms-kpis + ms-reporting |
| cordillera-ec2-4-datasources | `i-0fdd7a0e7d39e6d9f` | 10.0.2.100 | — | ms-sales + ms-inventory + ms-finance + ms-customer |

> **La IP pública es una Elastic IP pero puede reasignarse** (fue `3.133.80.5` originalmente, cambió a `3.148.98.28`). Si cambia, actualizar: `FRONTEND_URL` de `ms-auth`, `allowedOriginPatterns` en `CorsConfig.java` del gateway, secrets `EC2_1_HOST` en GitHub, y este documento.

Todas las instancias tienen volumen root EBS de **8 GB** — ajustado justo, requiere rotación de logs de Docker (ver §7).

### 5.3 Security Groups

| SG | ID | Aplica a | Reglas clave |
|---|---|---|---|
| SG-PUBLIC | `sg-0f02d2dd03261cc21` | EC2-1 | 80, 443, 8080, 8761 abiertos a `0.0.0.0/0`; **22 (SSH) restringido a una IP/32 específica** (se actualiza manualmente o vía el step "Abrir SSH para IP del runner" del pipeline) |
| SG-PRIVATE | `sg-014a8e82c80fae331` | EC2-2, 3, 4 | 22 y 8761 desde SG-PUBLIC; 8081-8092 entre SG-PUBLIC/SG-PRIVATE |
| SG-DATABASE | `sg-0835efe9646e1028c` | RDS | 5432 solo desde SG-PUBLIC y SG-PRIVATE (no accesible desde internet) |

### 5.4 Base de datos (RDS)

| Atributo | Valor |
|---|---|
| Identifier | `cordillera-rds` |
| Endpoint | `cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com:5432` |
| Engine | PostgreSQL 16, `db.t3.micro` |
| Usuario | `cordillera_admin` (password en GitHub Secret `DB_PASSWORD`, no en este documento) |
| Parameter group | `cordillera-pg16` — `max_connections=200` (el default ~81 no alcanza para 9 microservicios × pool HikariCP) |
| Bases de datos lógicas | `db_auth`, `db_sales`, `db_inventory`, `db_finance`, `db_customer`, `db_ingestion`, `db_kpis`, `db_reporting` — creadas **manualmente**, no hay init-script automático en RDS |

### 5.5 ECR (Amazon Elastic Container Registry)

Registry: `215682485633.dkr.ecr.us-east-2.amazonaws.com`

Repositorios bajo el prefijo `grupocordillera/`: `ms-sales`, `ms-inventory`, `ms-finance`, `ms-customer`, `ms-data-ingestion`, `ms-kpis`, `ms-reporting`, `eureka-server`, `api-gateway`, `bff`, `ms-auth`, `frontend` (12 en total, todas con tag `:latest` + tag por `github.sha`).

### 5.6 Acceso SSH

| Atributo | Valor |
|---|---|
| Key pair (AWS) | `cordillera-key` |
| Archivo local | `~/.ssh/cordillera-key.pem` (RSA, única copia — no rotar sin avisar) |
| Patrón de acceso | SSH directo a EC2-1 (bastion). Para EC2-2/3/4 usar `ProxyJump` a través de EC2-1, ya que son privadas. |

Ejemplo:
```bash
ssh -i ~/.ssh/cordillera-key.pem ec2-user@3.148.98.28
ssh -i ~/.ssh/cordillera-key.pem -J ec2-user@3.148.98.28 ec2-user@10.0.2.107   # EC2-2
```

## 6. Cómo se despliegan los cambios a producción hoy

### 6.1 Flujo automático (GitHub Actions)

Archivo: `Fullstack3/.github/workflows/ci-cd.yml`

**Disparadores (actualizado en la migración a ECS, ver §12):** `push` a la rama `master` (build + push a ECR + deploy a ECS) o `pull_request` hacia `master` (solo build, no despliega). El diagrama de abajo describe el flujo histórico previo a la migración (deploy por SSH a EC2 en `develop`); el flujo vigente hoy es el de §12.

```
push a develop
   │
   ▼
┌─────────────────┐   ┌──────────────────┐
│ build-backend    │   │ build-frontend    │   (en paralelo)
│ JDK21 + mvnw     │   │ Node20 + npm      │
│ clean package    │   │ install + build   │
│ -DskipTests      │   │                   │
└────────┬─────────┘   └────────┬──────────┘
         └───────────┬──────────┘
                      ▼
              ┌───────────────┐
              │ push-images    │  (solo si push a develop)
              │ - login ECR    │
              │ - docker build │  por cada uno de los 12 servicios
              │   + push       │  (tag :latest y :<sha>)
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │    deploy      │
              │ 1. abre SSH 22 │  temporalmente, para la IP del runner de GitHub
              │    en SG-PUBLIC│
              │ 2. configura   │  cordillera-key.pem desde secret EC2_SSH_KEY
              │    ~/.ssh/config│ (bastion + ProxyJump a ec2-2/3/4)
              │ 3. copia       │  deploy/ec2-N/docker-compose.yml a cada EC2
              │    docker-     │
              │    compose.yml │
              │ 4. ECR login   │  en las 4 EC2
              │ 5. docker      │  compose pull && docker compose up -d
              │    compose up  │  en EC2-1, luego EC2-2, EC2-3, EC2-4 (secuencial)
              │ 6. verifica    │  curl a /actuator/health en gateway/auth/eureka
              │ 7. cierra SSH  │  revoca la regla del SG (siempre, incluso si falla)
              └───────────────┘
```

Secrets de GitHub requeridos: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_SSH_KEY`, `EC2_1_HOST`, `EC2_2_HOST`, `EC2_3_HOST`, `EC2_4_HOST`, `RDS_ENDPOINT`, `DB_PASSWORD`, `JWT_SECRET`, `RESEND_API_KEY`.

Archivos `docker-compose.yml` de despliegue (uno por instancia, en `deploy/ec2-{1,2,3,4}/`) definen qué contenedores corren en cada EC2, sus variables de entorno y puertos publicados — son la fuente de verdad de la topología de despliegue.

### 6.2 Despliegue manual (cuando no se usa el pipeline)

Durante debugging o incidentes se ha desplegado manualmente vía SSH, por ejemplo:

```bash
# Login a ECR desde la instancia
aws ecr get-login-password --region us-east-2 | \
  ssh -i ~/.ssh/cordillera-key.pem ec2-user@3.148.98.28 \
  "docker login --username AWS --password-stdin 215682485633.dkr.ecr.us-east-2.amazonaws.com"

# Build + push local (requiere Docker Desktop corriendo)
cd Fullstack3/cordillera
docker build -f infraestructure/api-gateway/Dockerfile \
  -t 215682485633.dkr.ecr.us-east-2.amazonaws.com/grupocordillera/api-gateway:latest .
docker push 215682485633.dkr.ecr.us-east-2.amazonaws.com/grupocordillera/api-gateway:latest

# Redeploy en la EC2
ssh -i ~/.ssh/cordillera-key.pem ec2-user@3.148.98.28 "
  docker pull .../api-gateway:latest
  docker stop api-gateway && docker rm api-gateway
  docker run -d --name api-gateway --restart unless-stopped -p 8080:8080 --network cordillera-net \
    -e EUREKA_URL=http://10.0.2.107:8761/eureka/ ... imagen:latest
"
```

> **Cuidado:** el `nginx` del contenedor `frontend` cachea la IP interna de Docker de `api-gateway` al arrancar (resolución DNS estática de nginx open-source). Si se recrea `api-gateway` manualmente (fuera de `docker compose up`, que sí resuelve el DNS al momento), hay que correr `docker restart frontend` después, o se obtiene **502 Bad Gateway** aunque el backend esté sano. El `nginx.conf` ya incluye `resolver 127.0.0.11 valid=10s;` + `proxy_pass` con variable para mitigar esto en despliegues futuros vía compose.

### 6.3 Build local del monorepo (sin Docker)

```bash
cd Fullstack3/cordillera
./mvnw clean package -DskipTests   # o mvn si está instalado globalmente
```

Compila los 11 microservicios en orden de dependencias (`data-sources` → `core-intelligence` → `infraestructure`, definido por el `<modules>` del `pom.xml` raíz).

## 7. Incidentes relevantes y su resolución (contexto para debugging futuro)

Resumen de bugs no triviales ya diagnosticados — evita re-investigar desde cero.

### 7.1 Bug histórico de login (`POST /api/auth/login` → 404), resuelto 2026-07-02

**Causa real:** el archivo `infraestructure/api-gateway/src/main/java/.../config/GatewayRoutesConfig.java` definía un `@Bean RouteLocator` programático con rutas hardcodeadas a `http://host.docker.internal:PUERTO` (leftover de pruebas locales) que era el **único** enrutador realmente activo — las 18 rutas en `application.yml` (`spring.cloud.gateway.routes.*`) nunca funcionaron, porque Spring Cloud Gateway 5.x movió el prefijo de configuración a `spring.cloud.gateway.server.webflux.*`. Ninguno de los dos mecanismos tenía una ruta para `/api/auth/**`.

**Fix aplicado:** se eliminó `GatewayRoutesConfig.java` y se corrigió el prefijo en `application.yml`. Verificado con `/actuator/gateway/routes` + logging `TRACE` de `org.springframework.cloud.gateway`.

### 7.2 Crash-loop de `ms-auth`, `eureka-server`, `api-gateway`

**Causa:** el `pom.xml` raíz tenía `spring-boot-starter-parent` fijado en `3.5.6`, pero `spring-cloud-dependencies:2025.1.1` requiere Spring Boot **4.0.2+** (confirmado vía metadata de Maven Central). El mismatch producía `BeanDefinitionOverrideException` en `restClientSsl` (autoconfiguración de RestClient duplicada entre el paquete monolítico de Boot 3.x y el modularizado de Boot 4.x).

**Fix:** parent pom actualizado a `4.0.5`. Efecto colateral: hubo que migrar 9 archivos de test a la nueva API de Boot 4 (`@MockBean` → `@MockitoBean`, `@WebMvcTest`/`@WebFluxTest` cambiaron de paquete) y agregar `spring-boot-webmvc-test` / `spring-boot-webflux-test` como dependencia de test en los módulos afectados.

### 7.3 Disco lleno (8 GB) en las 4 EC2

**Causa:** el driver `json-file` de Docker no tenía `max-size`/`max-file`, logs de contenedores crecieron sin límite hasta agotar el volumen root y tumbar el daemon Docker (`no space left on device`).

**Fix:** `/etc/docker/daemon.json` con `{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}` en las 4 instancias.

### 7.4 Web mostraba la página default de nginx

**Causa:** un `nginx` nativo (systemd, `enabled`) instalado manualmente en algún punto de debugging tomaba el puerto 80 antes que el contenedor Docker `frontend` en cada reinicio de la instancia.

**Fix:** `systemctl disable nginx` en EC2-1.

### 7.5 Otros fixes de la fase de despliegue inicial (2026-05-18/19)

- NAT: interfaz de red en Amazon Linux 2023 es `ens5`, no `eth0` — el `iptables MASQUERADE` del user-data original apuntaba mal.
- `SPRING_JPA_HIBERNATE_DDL_AUTO` debe ser `update` (no `validate`) mientras no existan migraciones Flyway completas con `CREATE TABLE` en todos los MS.
- CORS duplicado (`CorsConfig.java` + `globalcors` de Spring Cloud Gateway) con listas de orígenes desincronizadas — se removió `globalcors` y se centralizó en `CorsConfig.java`.

## 8. Incidente adicional resuelto: 500/503 en ms-sales, ms-customer, ms-kpis (2026-07-02)

Una vez corregido el enrutamiento del Gateway (§7.1), aparecieron errores reales de conectividad, antes enmascarados por el 404:

- `GET /api/sales` → `500 Internal Server Error` (`NoRouteToHostException`)
- `GET /api/customers` → `500 Internal Server Error` (`Connection refused`)
- `GET /api/kpis` (vía `bff`) → `503 Service Unavailable`

**Causa raíz:** `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true` sin `eureka.instance.ip-address` explícito hace que cada microservicio se registre en Eureka con la **IP interna de su propio contenedor Docker** (rango `172.19.0.0/16` de la red `cordillera-net`), válida solo dentro de su propio host EC2. Cuando `api-gateway` (EC2-1) intentaba conectarse vía `lb://ms-sales` a esa IP (perteneciente a un contenedor en EC2-4), la IP no era enrutable entre instancias EC2 → `NoRouteToHostException`/`Connection refused`. Por eso nunca se detectó antes: las únicas llamadas que funcionaban eran entre contenedores del mismo host (frontend→gateway→ms-auth, todos en EC2-1).

Bug relacionado: `bff` tenía `EUREKA_URL=http://localhost:8761/eureka/` en vez de la IP real de `eureka-server` (10.0.2.107) — como son contenedores separados, nunca lograba registrarse, y por eso todas sus llamadas downstream (`/api/kpis`, `/api/reports`, `/api/dashboard`) fallaban con 503.

**Fix aplicado:**
- Se agregó `ip-address: ${EUREKA_INSTANCE_IP_ADDRESS:}` al bloque `eureka.instance` de los 10 microservicios cliente de Eureka.
- Se inyectó `EUREKA_INSTANCE_IP_ADDRESS=<IP privada del host>` en los 4 `deploy/ec2-N/docker-compose.yml` (EC2-1: `10.0.1.58`, EC2-2: `10.0.2.107`, EC2-3: `10.0.2.118`, EC2-4: `10.0.2.100`).
- Se corrigió el `EUREKA_URL` de `bff`.

**Verificación:** `curl http://10.0.2.107:8761/eureka/apps | grep ipAddr` debe mostrar IPs `10.0.x.x` (VPC), nunca `172.x.x.x` (red Docker interna). Al agregar un microservicio nuevo o desplegar en una EC2 nueva, siempre setear `EUREKA_INSTANCE_IP_ADDRESS` explícitamente.

## 9. Incidente adicional resuelto: páginas de Sales/Finance/Kpis/Inventory en blanco (2026-07-02)

Tras resolver el enrutamiento y la conectividad, la web cargaba pero las páginas de **Ventas, Finanzas, KPIs e Inventario** se veían completamente en blanco, aunque la petición del documento HTML devolvía `200 OK`. En la pestaña Network del navegador no aparecía ninguna llamada `fetch`/`XHR` a `/api/*` — solo la carga de `index.html`, el bundle JS y el CSS.

**Causa raíz:** `SalesPage.jsx`, `FinancePage.jsx`, `KpisPage.jsx` e `InventoryPage.jsx` (en `frontend/grupoCordillera/src/pages/`) pasaban `<DataTable columns={columns} .../>` pero la variable **`columns` nunca estaba declarada** en ninguno de los 4 archivos. Esto lanza un `ReferenceError: columns is not defined` durante el **render** de React (no en el `useEffect`), por lo que el componente nunca llega a montarse y el `fetch` de datos jamás se dispara — de ahí que no apareciera ninguna llamada de red. `FinancePage.jsx` tenía además `KpiCard` y `DataTable` usados en el JSX sin estar importados, y `KpisPage.jsx` tenía dos variables más sin definir: `CustomTitle` y `refreshBtn`.

**Fix aplicado:** se agregó la definición de `columns` (array de `{ header, accessor | render }`) en los 4 archivos, reutilizando componentes que ya estaban importados pero sin usar en cada uno (`StatusBadge`, `ActionMenu`, y un `typeClassMap` que ya existía huérfano en `FinancePage.jsx`). Se agregaron los imports faltantes de `KpiCard` y `DataTable`. Se reemplazó `CustomTitle` por un string literal y se definió `refreshBtn` como JSX en `KpisPage.jsx`.

**Cómo se detectó:** los `curl` directos a `/api/kpis`, `/api/sales`, `/api/finance/movements` devolvían `200` con datos reales, descartando un problema de backend. La ausencia total de llamadas `/api/*` en el Network tab del navegador (solo el request de documento) apuntó a un crash de render antes de que el `useEffect` llegara a ejecutarse.

**Nota importante:** `npm run build` (Vite) **no detecta estas referencias indefinidas** — no hay type-checking (proyecto en JS, no TS) ni ESLint bloqueando el build. El bundle se genera "exitosamente" aunque tenga una variable inexistente en JSX; el error solo aparece en tiempo de ejecución en el navegador. Si una página queda en blanco con 200 en el documento pero sin llamadas de red, sospechar primero de esto y revisar la Consola del navegador.

## 10. Incidente adicional resuelto: creación de registros (POST) fallaba con 500 en todos los microservicios (2026-07-02)

Una vez visibles los datos, el botón "Guardar" en los formularios de creación (Nuevo Movimiento, Nueva Venta, Agregar Producto, etc.) fallaba consistentemente con `500 { "message": "An error occurred at the process" }` — en **todos** los microservicios con datos seed, no solo en uno.

**Causa raíz:** las 8 bases de datos fueron sembradas vía Flyway con `INSERT INTO tabla (id, ...) VALUES (1, ...), (2, ...)` usando **IDs explícitos**, pero la secuencia (`SERIAL`/`IDENTITY`) de cada tabla nunca se sincronizó con el `MAX(id)` real insertado — seguían arrancando desde 1. Al crear un registro nuevo, Hibernate pedía el siguiente valor de la secuencia (ej. `1`) e intentaba insertarlo, chocando con una fila que ya existía: `ERROR: duplicate key value violates unique constraint "..._pkey" (SQLState 23505)`, que el backend traduce al mensaje genérico de 500. Por eso GET (listar) siempre funcionó pero POST (crear) fallaba parejo en todos los MS.

**Fix aplicado:** se corrió un script SQL genérico contra las 8 bases de datos (vía un contenedor `postgres:16-alpine` efímero lanzado desde EC2-1, que tiene acceso a RDS por el Security Group) que recorre `pg_class`/`pg_depend` para encontrar cada secuencia y su tabla/columna dueña, y ejecuta `setval(secuencia, MAX(id), true)` por cada una. Verificado creando registros reales en `ms-finance`, `ms-sales`, `ms-inventory` y `ms-customer` (todos `201 Created`).

**Cómo se detectó:** `docker logs ms-finance` justo después de reproducir el error mostró el mensaje real de Postgres (`duplicate key value violates unique constraint "balance_pkey" Detail: Key (id)=(1) already exists`), oculto detrás del mensaje genérico que veía el usuario en el navegador.

**Cómo evitarlo a futuro:** si se agregan nuevos registros seed con ID explícito en una migración Flyway (`V*__seed_*.sql`), agregar siempre al final `SELECT setval('tabla_id_seq', (SELECT MAX(id) FROM tabla));` para cada tabla sembrada. Sin esto, el primer INSERT real desde la aplicación fallará con 500 en cuanto la secuencia intente reusar un ID ya sembrado.

## 11. Archivos clave de referencia

| Archivo | Contenido |
|---|---|
| `Fullstack3/cordillera/pom.xml` | Parent Maven — versión de Spring Boot/Cloud, dependencias comunes a los 11 MS |
| `Fullstack3/.github/workflows/ci-cd.yml` | Pipeline completo de CI/CD |
| `Fullstack3/deploy/ec2-{1,2,3,4}/docker-compose.yml` | Topología de despliegue real por instancia |
| `Fullstack3/deploy/deploy-all.sh` | Script de despliegue manual alternativo |
| `Fullstack3/cordillera/infraestructure/api-gateway/src/main/resources/application.yml` | Rutas del Gateway (prefijo `spring.cloud.gateway.server.webflux.*`) |
| `Fullstack3/cordillera/infraestructure/ms-auth/src/main/resources/application.yml` | Config JWT, Flyway, Resend |
| `Fullstack3/cordillera/frontend/grupoCordillera/nginx.conf` | Proxy del frontend hacia el Gateway |
| `Fullstack3/cordillera/frontend/grupoCordillera/src/pages/*.jsx` | Páginas React (Sales, Finance, Kpis, Inventory, Customers, Dashboard, Reports) |
| `Fullstack3/deploy/reset_sequences.sql` | Script de mantenimiento para resincronizar secuencias de Postgres tras seeds con ID explícito (ver §10) |
| `Fullstack3/cordillera/API_ENDPOINTS.md` | Documentación detallada de endpoints por microservicio |
| `Fullstack3/deploy/ecs/README.md` | Arquitectura, servicios, despliegue y logs del entorno ECS Fargate (ver §12) |

## 12. Migración a ECS Fargate (2026-07-02)

Migración del entorno de despliegue desde EC2 + Docker Compose (4 instancias, `deploy/ec2-{1,2,3,4}`) hacia **AWS ECS Fargate**, dentro de una ventana de validación de 48h, **sin apagar ni modificar el entorno EC2 existente** hasta confirmar que ECS funcionaba end-to-end. Documentación operativa completa (arquitectura, tabla de servicios, cómo desplegar, cómo ver logs) en `deploy/ecs/README.md`; cronología detallada de cada recurso AWS creado en `deploy/ecs/aws-resources-created.md`.

### 12.1 Arquitectura resultante

- **1 ALB público** (`cordillera-alb`) con un único Target Group hacia el servicio `frontend` (nginx).
- **12 servicios ECS** (Fargate, `awsvpc`), todos los backend son **privados** (`assignPublicIp: DISABLED`, sin target group propio).
- **ECS Service Connect** sobre un namespace Cloud Map `DNS_PRIVATE` (`cordillera-dns.local`) para toda la comunicación interna, con URLs directas inyectadas por variable de entorno (`ROUTE_*_URI` en `api-gateway`, `MS_*_URL` en `bff`).
- **Autoscaling** (Target Tracking) en `api-gateway`, `bff` y `ms-kpis` (CPU 60%, `ms-kpis` también memoria 70%), `min=1 max=4`.
- **RDS PostgreSQL 16 reutilizado** del entorno EC2 (mismo Security Group + regla nueva desde el SG de tareas ECS) — no se creó una base de datos nueva.
- **CI/CD**: `.github/workflows/ci-cd.yml` reemplazó el deploy por SSH+`docker-compose` por un loop de `register-task-definition` + `update-service --force-new-deployment` + `wait services-stable` por cada uno de los 12 servicios.

### 12.2 Decisión de diseño: se abandonó Eureka en ECS

**Contexto:** el proyecto usa Netflix Eureka para descubrimiento de servicios en EC2 (`lb://servicio` + `spring-cloud-starter-netflix-eureka-client`). Se migró primero manteniendo Eureka también en ECS (`eureka-server` como servicio ECS adicional), asumiendo que sería el camino de menor cambio.

**Causa raíz de la inestabilidad:** bajo Service Connect, `eureka-server` entraba en un ciclo continuo de `lease doesn't exist, registering resource` / `Not Found (Renew)` (194+ ocurrencias por 5 minutos), causando que `/api/auth/login` y otros endpoints respondieran 200 o 503 de forma intermitente sin patrón claro. Se descartó CPU/memoria como causa (medido 6-13% vía CloudWatch, con `eureka-server` ya en 512/1024) y se descartó auto-restart del propio servicio (confirmado en "steady state" estable). En el camino se identificaron y corrigieron tres bugs reales y necesarios, pero **ninguno resolvió la inestabilidad por sí solo**:

1. **Namespace HTTP de Service Connect no publica DNS real** (`aws servicediscovery get-service` mostraba `"DnsConfig": {}`) — el `resolver` dinámico de nginx hace consultas DNS UDP reales y **no** consulta `/etc/hosts` (que es como Service Connect realmente resuelve nombres). Fix: nginx pasó a usar `proxy_pass` estático (usa `getaddrinfo()`, que sí consulta `/etc/hosts` primero).
2. **`clientAliases[].dnsName` usando nombre corto en vez de FQDN** en `create-services.sh`/`update-services-dns.sh` — corregido a `<servicio>.cordillera-dns.local`.
3. **`EUREKA_INSTANCE_INSTANCE_ID` no único entre tareas**: el hostname auto-detectado (`spring.cloud.client.hostname`) resolvía siempre a la IP link-local del endpoint de metadata de la tarea ECS (`169.254.172.2`), **idéntica en todas las tareas**, causando colisiones de `instanceId` en Eureka. Fix: `EUREKA_INSTANCE_INSTANCE_ID=${service}.cordillera-dns.local:${port}` explícito.

**Decisión:** tras confirmar que la inestabilidad persistía con los tres fixes aplicados, se decidió **abandonar Eureka completamente en el entorno ECS** en vez de seguir depurando, dado que Service Connect ya provee descubrimiento de servicios nativo (DNS interno + healthchecks) — Eureka pasó a ser redundante en ECS. Se migró a `EUREKA_CLIENT_ENABLED=false` en las 12 task definitions, con `api-gateway` y `bff` apuntando a URLs directas de Service Connect (`http://<servicio>.cordillera-dns.local:<puerto>`). `eureka-server` quedó desplegado con `desiredCount=0` (no eliminado).

**Verificación:** tras redeploy de las 11 imágenes backend con la config nueva, pruebas repetidas (3x cada una) de `/api/auth/login`, `/api/sales`, `/api/kpis`, `/api/inventory`, `/api/customers`, `/api/finance/movements` vía el ALB mostraron **100% de respuestas 200/201, cero 503**.

### 12.3 Bug encontrado durante el pivote: URLs hardcodeadas en `bff`

Al migrar `bff` a URLs directas se descubrió que `KpisClient.java`, `IngestionClient.java` y `ReportingClient.java` tenían constantes hardcodeadas `http://host.docker.internal:PORT` — una URL que **nunca funcionó en ningún entorno** (ni EC2 ni ECS), enmascarada silenciosamente por `onErrorResume` de WebClient. Fix: se externalizaron a `@Value("${services.ms-kpis.url}")` (y equivalentes), configurables por variable de entorno (`MS_KPIS_URL`, `MS_REPORTING_URL`, `MS_DATA_INGESTION_URL`), y se aplicó también en `deploy/ec2-2/docker-compose.yml` para corregir el mismo bug latente en el entorno EC2.

### 12.4 Prueba de carga y autoscaling (Fase 9)

`k6` (50 VUs, 3 min sostenidos) contra `/api/kpis` vía ALB: **3.664 requests, 0.00% de error**, p95 5.45s. `ms-kpis` escaló automáticamente de 1→2 tareas en 34s tras iniciar el monitoreo (Target Tracking CPU 60%), y siguió escalando hasta el máximo configurado (`maxCapacity=4`) incluso *después* de terminada la carga real — atribuido al pico de CPU real del cold-start de JVM (JIT, class loading, Hibernate/Flyway) en las tareas nuevas, retroalimentando la métrica de CPU promedio del servicio. Detalle completo, incluyendo por qué este hallazgo no buscado es evidencia positiva (el techo `maxCapacity` contuvo el sobreescalado sin intervención), en `deploy/evidencia/resumen-autoscaling.md`.

### 12.5 Prueba de resiliencia (Fase 10, repetida 2026-07-03)

Dos escenarios probados sobre `ms-reporting`, documentados con timeline real de eventos en `deploy/evidencia/resiliencia-circuit-breaker.md`:

1. **Caída de una tarea** (health check fallido): ECS repuso la tarea automáticamente en ~3-4 minutos, sin intervención manual — el `desiredCount=1` declarativo del servicio es la garantía.
2. **Imagen de despliegue inexistente** (tag deliberadamente roto): probado dos veces.
   - **2026-07-02:** la revisión estable nunca dejó de servir tráfico (cero downtime), pero el `deploymentCircuitBreaker` no llegó a marcar el deployment como `FAILED` dentro de los ~11 minutos observados — se forzó el revert manual, sin confirmar el rollback automático.
   - **2026-07-03 (repetición, "Fase C" del prompt de validación de pipeline):** mismo procedimiento contra `ms-reporting:tag-inexistente-prueba-c` (revisión 9). Esta vez **el circuit breaker sí revirtió automáticamente, sin ningún comando manual, en 11m44s**, quedando `rolloutState=COMPLETED` en la revisión buena a los ~13m50s totales. Conclusión: el rollback automático **funciona**; la corrida anterior simplemente se detuvo manualmente justo antes de alcanzar el umbral interno de fallos (`failedTasks=3`) que ECS necesita para declarar el deployment `FAILED` con `desiredCount=1`. El proceso completo toma **~12 minutos**, no es instantáneo. Ver "Parte 4" en `deploy/evidencia/resiliencia-circuit-breaker.md` para el timeline minuto a minuto.

### 12.6 Checklist final — pauta IE9 vs. evidencia

| Requisito | Evidencia |
|---|---|
| Migración a contenedores orquestados (ECS Fargate) | `deploy/ecs/task-definitions/*.json` (12 servicios), `deploy/ecs/README.md` |
| Balanceo de carga | ALB `cordillera-alb` + Target Group `cordillera-frontend-tg` |
| Descubrimiento de servicios / comunicación interna | ECS Service Connect, namespace `cordillera-dns.local` (§12.2) |
| Autoscaling automático | Target Tracking en `api-gateway`/`bff`/`ms-kpis`, evidencia real en `deploy/evidencia/resumen-autoscaling.md` (§12.4) |
| Prueba de carga | `k6`, 50 VUs/3min, 0% error — `deploy/evidencia/resumen-autoscaling.md` |
| Prueba de resiliencia / recuperación ante fallos | `deploy/evidencia/resiliencia-circuit-breaker.md` (§12.5) — auto-healing confirmado; circuit breaker de despliegue confirmado 100% automático en la repetición del 2026-07-03 (~12 min) |
| Observabilidad / monitoreo | CloudWatch Logs por servicio (`/ecs/cordillera/<servicio>`), dashboard `cordillera-dashboard`, Container Insights habilitado |
| CI/CD actualizado al nuevo entorno | `.github/workflows/ci-cd.yml` — build+push ECR, `register-task-definition`+`update-service` por servicio |
| Gestión segura de credenciales | AWS Secrets Manager (RDS, JWT, Resend) en las task definitions |
| Continuidad del entorno anterior durante la migración | Entorno EC2 (`deploy/ec2-{1,2,3,4}`) intacto durante toda la migración, sin downtime del sistema en producción |
| Decisiones de arquitectura justificadas | §12.2 (abandono de Eureka), §12.3 (bug de URLs hardcodeadas), `deploy/ecs/infra-reuse-evaluation.md` (qué infraestructura EC2 se reutilizó) |

## 13. Estado operativo 2026-07-03: pausa de infraestructura hasta el examen (~2026-07-10)

### 13.1 Contexto y decisión

Con ECS validado end-to-end (§12) y el pipeline confirmado disparando deploy real a `master` (ver `deploy/evidencia/` y la corrida de Fase B), el usuario decidió **no eliminar nada** de lo creado (ni EC2 ni ECS ni RDS ni ALB) pero **detener todo el cómputo en ejecución** para no seguir consumiendo créditos AWS mientras no hay actividad, ya que el examen es recién en ~1 semana. La cuenta AWS **no es un sandbox de AWS Academy** (usuario con `AdministratorAccess` permanente, facturación real continua — ver `deploy/ecs/infra-reuse-evaluation.md`), así que el costo de dejar todo corriendo una semana sin uso no se justifica.

### 13.2 Hallazgo relevante antes de apagar: ECS depende de EC2-1 para salida a internet

Las tareas Fargate corren en la subred privada `subnet-0c37930ff9a14e070`, cuya tabla de rutas (`rtb-03c7217fc4d221f6d`) sigue apuntando el tráfico saliente hacia **EC2-1 como NAT instance manual** — no se creó NAT Gateway administrado ni VPC Interface Endpoints para ECR/Secrets Manager/CloudWatch Logs (decisión de ahorro documentada en `deploy/ecs/infra-reuse-evaluation.md`, línea "NAT Gateway"). Esto significa que, **mientras haya tareas ECS corriendo**, detener EC2-1 rompería su capacidad de pull de imágenes nuevas, fetch de secrets y logging (aunque el tráfico ya en curso, servido vía ALB/Service Connect dentro de la VPC, seguiría funcionando hasta el primer crash o redeploy).

**Esto deja de ser un problema en este escenario específico**, porque el plan es llevar `desiredCount` de los 12 servicios ECS a **0** antes o junto con detener EC2 — si no hay ninguna tarea corriendo ni intentando arrancar, la dependencia de NAT es irrelevante. El orden recomendado es: primero escalar ECS a 0, después detener las 4 EC2.

### 13.3 Qué se detuvo y cómo (comandos ejecutados)

| Recurso | Acción | Comando base | Reversible |
|---|---|---|---|
| 12 servicios ECS (`cordillera-cluster`) | `desiredCount` → 0 | `aws ecs update-service --cluster cordillera-cluster --service <svc> --desired-count 0 --region us-east-2` | Sí — volver a `--desired-count 1` (o el valor de autoscaling `min` original) |
| 4 instancias EC2 | Detenidas (stop, **no terminate**) | `aws ec2 stop-instances --instance-ids i-05d008dd7dd644af4 i-0ca0519f821489086 i-03a2918d757fc81bb i-0fdd7a0e7d39e6d9f --region us-east-2` | Sí — `aws ec2 start-instances` con los mismos IDs |
| RDS `cordillera-rds` | Detenida (stop) | `aws rds stop-db-instance --db-instance-identifier cordillera-rds --region us-east-2` | Sí — `aws rds start-db-instance`, pero **AWS reinicia automáticamente una instancia RDS detenida después de 7 días** (no se puede dejar detenida indefinidamente); si el examen es más allá de esa ventana, revisar si RDS ya se reinició solo antes de asumir que sigue detenida |
| Elastic IP `3.148.98.28` (EC2-1) | Ver nota abajo | — | — |
| ALB `cordillera-alb`, Target Groups, Cluster ECS, Task Definitions, Service Connect namespace, ECR, Secrets Manager | **Sin cambios** — no se detienen ni eliminan (no existe forma de "pausar" un ALB sin eliminarlo; su costo base ~$16-20/mes + Secrets Manager ~$1.20/mes continúan mientras no se decida eliminarlos) | — | — |

> **Nota sobre la Elastic IP — ACTUALIZADO:** inicialmente se mantuvo `3.148.98.28` asociada (ver historial abajo), pero el usuario confirmó explícitamente **liberarla** el 2026-07-04 para cortar el costo de ~$0.005/hora (~$3.6-4/mes) de una IP sin uso mientras EC2-1 está detenida. Ejecutado: `aws ec2 release-address --allocation-id eipalloc-0b29c090f76b92d60 --region us-east-2`. **`3.148.98.28` ya NO existe en la cuenta** — al reactivar EC2-1 se debe asignar una IP nueva (`aws ec2 allocate-address` + `aws ec2 associate-address`) y **actualizar obligatoriamente**: `CorsConfig.java` (`allowedOriginPatterns`) en `api-gateway`, el secret `EC2_1_HOST` en GitHub Actions, y este documento — de lo contrario el login/CORS del entorno EC2 no funcionará con la IP nueva.
>
> **Nota adicional descubierta:** además de esta EIP, la cuenta tiene otras 2 direcciones (`18.227.131.172`, `3.140.116.26`) asociadas a las ENIs del ALB `cordillera-alb` (gestionadas por `amazon-elb`, `Requester: amazon-elb`) — **no son liberables** sin eliminar el ALB completo (contradice la instrucción de no eliminar nada). Cobran igual (~$0.005/hora cada una, ~$7.2/mes las dos) mientras el ALB exista, independiente de si hay tareas ECS corriendo. Es un costo fijo inherente a mantener el ALB provisionado, no relacionado con el apagado de cómputo.

### 13.5 Confirmación final del apagado (2026-07-03, ejecutado y verificado)

| Recurso | Estado final verificado |
|---|---|
| 12 servicios ECS | `desiredCount=0`, `runningCount=0` en los 12 (confirmado vía `describe-services`) |
| 4 instancias EC2 (`i-05d008dd7dd644af4`, `i-0ca0519f821489086`, `i-03a2918d757fc81bb`, `i-0fdd7a0e7d39e6d9f`) | `stopped` (confirmado vía `describe-instances`) |
| RDS `cordillera-rds` | `stopped` (confirmado vía `describe-db-instances`, tardó ~9 minutos en detenerse tras el comando) |
| ALB, Target Groups, Cluster ECS, Task Definitions, ECR, Secrets Manager, EIP `3.148.98.28` | Sin cambios, tal como estaban |

**Nada quedó accesible mientras dure la pausa** — ni `http://3.148.98.28` (EC2 detenida) ni `http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com` (ECS con 0 tareas, el ALB devolverá error de "no healthy targets"). Usar el procedimiento de §13.4 para reactivar antes del examen.

### 13.4 Procedimiento de reactivación antes del examen

Orden recomendado (inverso al apagado, para evitar que ECS intente arrancar tareas sin que EC2-1/NAT esté listo primero, aunque en este caso ECS ya no depende de EC2 para nada si ambos estaban en 0/detenido):

1. `aws rds start-db-instance --db-instance-identifier cordillera-rds --region us-east-2` y esperar `aws rds wait db-instance-available` (toma varios minutos).
2. `aws ec2 start-instances --instance-ids i-05d008dd7dd644af4 i-0ca0519f821489086 i-03a2918d757fc81bb i-0fdd7a0e7d39e6d9f --region us-east-2` y esperar que las 4 pasen a `running` (`aws ec2 wait instance-status-ok`).
3. **La EIP `3.148.98.28` ya no existe (liberada 2026-07-04).** Asignar una nueva y asociarla a EC2-1 (`i-05d008dd7dd644af4`):
   ```bash
   NEW_ALLOC=$(aws ec2 allocate-address --domain vpc --region us-east-2 --query 'AllocationId' --output text)
   aws ec2 associate-address --instance-id i-05d008dd7dd644af4 --allocation-id $NEW_ALLOC --region us-east-2
   aws ec2 describe-addresses --allocation-ids $NEW_ALLOC --region us-east-2 --query 'Addresses[0].PublicIp' --output text
   ```
   Con la IP nueva obtenida, **actualizar antes de probar el login**: `allowedOriginPatterns` en `CorsConfig.java` (`api-gateway`), el secret `EC2_1_HOST` en GitHub Actions, y este documento (§4, §5.2, §5.6). Sin este paso, el frontend del entorno EC2 dará error de CORS al intentar loguearse.
4. Verificar Docker/contenedores en las 4 EC2 vía SSH (`docker ps`) — **no asumir que un `docker start` automático ocurre solo**; puede requerir `docker compose up -d` manual si los contenedores no tienen `restart: unless-stopped` o si Docker no arrancó solo tras el `stop`/`start` de la instancia.
5. Para ECS: `aws ecs update-service --cluster cordillera-cluster --service <svc> --desired-count 1 --region us-east-2` por cada uno de los 12 servicios (o el valor `min` de autoscaling en `api-gateway`/`bff`/`ms-kpis`), luego `aws ecs wait services-stable`.
6. Verificar ambos entornos: `curl http://<IP-EC2-1>/` (frontend EC2) y `curl http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com/` (frontend ECS) antes de dar por lista la demo/examen.
