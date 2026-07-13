# Reflexión Individual — Darío Morales

> **Proyecto:** Plataforma Grupo Cordillera  
> **Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
> **Módulo a cargo:** Data Sources  
> **Fecha:** julio de 2026

---

## 1. Cómo se desarrolló el proyecto

El proyecto nació como una plataforma de monitoreo empresarial para centralizar datos de ventas, inventario, finanzas y clientes en un dashboard único. Lo construimos en tres evaluaciones parciales, y cada una nos obligó a repensar cómo desplegábamos el sistema sin romper lo que ya funcionaba.

En la **EP1** el trabajo fue levantar la infraestructura desde cero. Mientras Rodrigo armaba la VPC y las instancias EC2, yo me concentré en que los cuatro microservicios de datos — `ms-sales`, `ms-inventory`, `ms-finance` y `ms-customer` — se desplegaran correctamente en EC2-4 con Docker Compose. Cada servicio tiene su propia base de datos lógica en la instancia RDS compartida, así que parte del trabajo fue verificar que las conexiones JDBC funcionaran desde la subred privada hacia RDS, pasando por los Security Groups correctos. El despliegue era completamente manual: SSH a la máquina, pull de la imagen, docker compose up.

En la **EP2** el cambio grande fue la automatización. Construimos los Dockerfiles multi-stage para los 12 servicios, configuramos los repositorios en ECR y montamos el pipeline de GitHub Actions que compilaba, publicaba las imágenes y las desplegaba en las 4 EC2 vía SSH con ProxyJump. Acá me tocó pelear bastante con los Dockerfiles del monorepo Maven — el contexto de build tiene que ser la raíz de `cordillera/` para que el módulo padre y las dependencias comunes estén disponibles, y cada Dockerfile tiene que copiar todos los `pom.xml` del monorepo antes de correr `dependency:go-offline` para aprovechar la caché de Docker. Cualquier error en el orden de las capas tiraba por la borda el caché y el build se iba a 10+ minutos.

La **EP3** fue la migración a ECS Fargate. Mi rol fue adaptar los microservicios de Data Sources para que funcionaran como tareas Fargate: crear las Task Definitions con las variables de entorno correctas, ajustar los límites de CPU y memoria según el perfil de consumo de cada servicio, y referenciar los secretos de Secrets Manager por ARN en vez de inyectarlos como texto plano. También colaboré en el soporte del pipeline para que el ciclo `register-task-definition` → `update-service` → `wait services-stable` funcionara correctamente para los 12 servicios.

La forma en que nos organizamos fue por módulo pero con mucha coordinación cruzada. Cada uno tenía su área, pero las dependencias entre infraestructura, servicios y pipeline hacían que cualquier cambio en una parte requiriera validación en las otras. Por ejemplo, cuando Rodrigo creó el Security Group de las tareas ECS, yo necesitaba verificar que mis microservicios en EC2-4 todavía pudieran conectarse a RDS, y cuando Felipe cambió la configuración de Service Connect, yo tenía que confirmar que `ms-sales` seguía respondiendo correctamente desde el gateway.

## 2. Decisiones técnicas tomadas

### Multi-stage build para todos los servicios backend

Cada Dockerfile backend usa un patrón de dos etapas: la primera con `eclipse-temurin:21-jdk-alpine` para compilar el JAR con Maven, y la segunda con `eclipse-temurin:21-jre-alpine` que solo contiene el JRE y el JAR compilado. Esto reduce la imagen final de ~350 MB (JDK completo + Maven + artefactos) a ~130 MB (JRE + JAR). La diferencia importa cuando estás haciendo pull de 12 imágenes en cada despliegue — el tiempo de descarga se reduce significativamente.

### Límites de heap JVM explícitos (-Xmx160m)

Las EC2 son t3.micro con 1 GB de RAM y corren múltiples servicios en paralelo. Sin límite de heap, la JVM intenta consumir hasta un cuarto de la memoria disponible del sistema, lo que con 3-4 servicios en la misma máquina garantiza un OOM Kill. Fijé `-Xmx160m -Xms64m` como variables de entorno en los Dockerfiles para que cada servicio tenga un techo predecible y el sistema operativo no se quede sin memoria. En ECS Fargate esto es menos crítico porque cada tarea tiene su propia asignación de memoria, pero mantuve los límites por consistencia.

### Una base de datos lógica por microservicio

Cada uno de los microservicios de datos tiene su propia base de datos lógica en la instancia RDS compartida: `db_sales`, `db_inventory`, `db_finance`, `db_customer`. Esto respeta el principio de independencia de datos en una arquitectura de microservicios — cada servicio puede evolucionar su esquema sin afectar a los demás. Usamos una sola instancia RDS (`db.t3.micro`) en vez de una por servicio por razones de costo, pero la separación lógica está ahí.

### Hibernate `ddl-auto=update` en vez de migraciones completas

Los cuatro microservicios de datos usan `spring.jpa.hibernate.ddl-auto=update`, lo que permite que Hibernate cree o modifique tablas automáticamente al arrancar. Esto simplificó el desarrollo inicial pero tiene riesgos en producción: Hibernate puede agregar columnas pero nunca las elimina, y los cambios de tipo de dato pueden fallar silenciosamente. La alternativa correcta sería Flyway con scripts `CREATE TABLE` completos (como hace `ms-auth`), pero dado el alcance académico del proyecto y el volumen de tablas, priorizamos velocidad de iteración.

### Sincronización de secuencias tras seeds con ID explícito

Cuando detectamos que todos los microservicios fallaban con 500 al intentar crear registros nuevos, rastreé el error hasta las secuencias de PostgreSQL. Los scripts de Flyway insertaban registros seed con IDs explícitos (`INSERT INTO tabla (id, ...) VALUES (1, ...)`), pero las secuencias seguían arrancando desde 1. Hibernate pedía el siguiente valor de la secuencia, obtenía un ID que ya existía y Postgres devolvía `duplicate key value violates unique constraint`. La solución fue un script SQL que recorre `pg_class`/`pg_depend` y ejecuta `setval(secuencia, MAX(id), true)` por cada tabla en las 8 bases de datos.

### Task Definitions diferenciadas por perfil de consumo

En la migración a ECS, no asigné la misma CPU y memoria a todos los servicios. Los microservicios de datos son más livianos — reciben consultas directas, ejecutan queries contra la base y devuelven datos — así que les asigné la combinación mínima de Fargate. Los servicios con más lógica de orquestación o cálculo (como `bff` o `ms-kpis`) reciben más recursos. Esto evita sobreaprovisionar servicios que no lo necesitan y controla el costo total del clúster.

## 3. Cómo funciona la solución implementada

La plataforma tiene 12 servicios organizados en tres capas funcionales desplegados sobre un clúster ECS Fargate:

La **capa de infraestructura** incluye el `frontend` (React servido por Nginx), el `api-gateway` (Spring Cloud Gateway que enruta las peticiones por path) y `ms-auth` (autenticación JWT). El `frontend` es el único servicio expuesto públicamente a través del ALB; Nginx sirve la SPA y proxea las llamadas `/api/*` hacia el gateway por la red interna.

La **capa de inteligencia de negocio** tiene el `bff` (Backend for Frontend que agrega datos de múltiples servicios para las vistas del dashboard), `ms-kpis` (cálculo de indicadores), `ms-reporting` (generación de reportes) y `ms-data-ingestion` (ingesta de datos). El `bff` es particularmente interesante porque implementa circuit breaker con Resilience4j para manejar fallos de los servicios downstream sin tumbar la vista completa del dashboard.

La **capa de fuentes de datos** — mi responsabilidad directa — tiene `ms-sales`, `ms-inventory`, `ms-finance` y `ms-customer`. Cada uno expone una API REST que gestiona las operaciones CRUD de su dominio, con su propia base de datos lógica en RDS. El paquete de cada microservicio sigue el patrón `cl.fullstack3.ms{nombre}` con entidades en `model/`, repositorios JPA, servicios de negocio y controladores REST.

La comunicación entre servicios se resuelve por **ECS Service Connect** con un namespace DNS privado (`cordillera-dns.local`). Cada servicio es accesible por nombre, por ejemplo `ms-sales.cordillera-dns.local:8081`. Esto reemplazó a Eureka, que era inestable bajo el modelo de networking de Fargate.

El **pipeline de CI/CD** se activa con cada push a `master`: compila los 11 microservicios backend con Maven y el frontend con npm en paralelo, construye las 12 imágenes Docker, las publica en ECR con dos tags (`:latest` y `:<commit-sha>`), registra nuevas Task Definitions y fuerza el despliegue en cada servicio ECS. El Deployment Circuit Breaker revierte automáticamente si una nueva revisión no pasa los health checks.

Los **secretos** (credenciales RDS, clave JWT, API key de email) están en AWS Secrets Manager y se inyectan como variables de entorno en el arranque de cada tarea, referenciados por ARN en las Task Definitions.

## 4. En qué partes participé directamente

Mi responsabilidad principal fue todo el módulo de **Data Sources** a lo largo de las tres evaluaciones:

- **Microservicios de datos (EP1/EP2):** desarrollo y mantenimiento de `ms-sales`, `ms-inventory`, `ms-finance` y `ms-customer`. Cada uno con sus entidades JPA, repositorios, servicios de negocio y controladores REST.
- **Dockerfiles multi-stage (EP2):** creación de los Dockerfiles para los microservicios de datos, con el patrón de dos etapas (JDK para compilar → JRE para runtime), optimizando el orden de las capas para maximizar el caché de Docker.
- **Docker Compose de EC2-4 (EP2):** configuración del `deploy/ec2-4/docker-compose.yml` con las 4 imágenes de datos, las variables de entorno correctas (`EUREKA_INSTANCE_IP_ADDRESS=10.0.2.100`, endpoint de RDS, passwords) y la red compartida.
- **Task Definitions para ECS (EP3):** creación de las Task Definitions de los 4 servicios de datos con los valores de CPU/memoria ajustados, los secretos referenciados por ARN y la configuración de Service Connect.
- **Fix de secuencias de PostgreSQL:** diagnóstico y resolución del bug de `duplicate key value violates unique constraint` que afectaba a todos los microservicios. Escribí el script `reset_sequences.sql` que resincroniza las secuencias tras seeds con ID explícito.
- **Soporte del pipeline (EP3):** colaboré en adaptar el pipeline de GitHub Actions para que el ciclo de despliegue a ECS (`register-task-definition` → `update-service` → `wait services-stable`) funcionara correctamente para los 12 servicios.

## 5. Mi principal aporte dentro del equipo

Mi principal aporte fue asegurar que los **microservicios de datos funcionaran de forma confiable** en todos los entornos — local, EC2 y ECS — y resolver los problemas que surgían en la capa de persistencia. El bug de las secuencias de PostgreSQL es un buen ejemplo: era un problema que afectaba a todos los microservicios por igual, pero lo detecté yo porque estaba probando la creación de registros en `ms-finance` cuando apareció el error genérico de 500. Tracé el problema desde el log de Docker (`docker logs ms-finance`) hasta el error real de Postgres (`duplicate key value violates unique constraint`), identifiqué la causa raíz en las secuencias desincronizadas y escribí un script genérico que lo resolvió para las 8 bases de datos de una sola vez.

También aporté la práctica de dimensionar los contenedores de forma realista: no dar más recursos de los necesarios, no asumir que un servicio que funciona en local va a funcionar igual en una EC2 con 1 GB de RAM, y probar siempre con datos reales en vez de con la base vacía.

## 6. Aspectos técnicos que domino y puedo defender

- **Dockerfiles multi-stage para monorepos Maven:** puedo explicar por qué el contexto de build debe ser la raíz del monorepo, cómo se estructura la copia de `pom.xml` para maximizar el caché de dependencias, y cuál es la diferencia entre `dependency:go-offline` y `package` en términos de capas de Docker.
- **Docker Compose local vs producción:** entiendo las diferencias entre usar `build:` (compilación local) e `image:` (pull desde ECR), cómo se manejan los health checks con `depends_on` y `condition: service_healthy`, y por qué las URLs de Eureka cambian entre entornos (nombre DNS de Docker vs IP privada de la EC2).
- **Persistencia con Spring Data JPA:** puedo explicar cómo funcionan las entidades, los repositorios, la generación de esquemas con `ddl-auto=update` y por qué existe el riesgo de desincronización de secuencias cuando se mezcla con seeds de Flyway que usan IDs explícitos.
- **Task Definitions de ECS:** puedo justificar los valores de CPU y memoria asignados a cada servicio, cómo se referencian los secretos de Secrets Manager por ARN, y qué significa `assignPublicIp: DISABLED` para un servicio backend que solo necesita comunicarse por la red interna.
- **Pipeline CI/CD end-to-end:** puedo recorrer el flujo completo desde un push a `master` hasta que el servicio está corriendo en ECS, incluyendo cómo se construye la imagen, cómo se publica en ECR con dos tags, cómo se registra la nueva Task Definition y cómo `wait services-stable` confirma que el despliegue fue exitoso.
- **Troubleshooting de base de datos:** puedo diagnosticar errores de persistencia partiendo del mensaje genérico de la API (500), bajando al log del contenedor, identificando el error real de Postgres y aplicando el fix correcto. El ejemplo de las secuencias es representativo de esta habilidad.
- **Arquitectura de microservicios:** puedo explicar por qué cada servicio tiene su propia base de datos lógica, cómo fluye una petición desde el frontend hasta la base de datos pasando por el gateway y Eureka/Service Connect, y cómo el `bff` agrega datos de múltiples servicios para las vistas del dashboard.

---

*Darío Morales — Grupo Cordillera — ISY1101 — Duoc UC — julio 2026*
