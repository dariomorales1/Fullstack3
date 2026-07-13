# Reflexión Individual — Rodrigo Jara

> **Proyecto:** Plataforma Grupo Cordillera  
> **Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
> **Módulo a cargo:** Infraestructura  
> **Fecha:** julio de 2026

---

## 1. Cómo se desarrolló el proyecto

El proyecto se construyó de forma incremental a lo largo de tres evaluaciones parciales, y eso marcó la forma en que trabajamos como equipo. No fue un desarrollo de una sola vez, sino una evolución donde cada etapa heredaba la infraestructura de la anterior y le agregaba una capa nueva de complejidad.

En la **EP1** partimos desde cero en AWS: creamos la VPC con sus subredes públicas y privadas, levantamos las 4 instancias EC2 y configuramos la base de datos RDS. Todo el despliegue era manual — nos conectábamos por SSH a cada máquina y ejecutábamos los contenedores uno a uno con Docker Compose. Funcionaba, pero era lento y propenso a errores.

En la **EP2** el foco fue la contenedorización y la automatización. Los 12 servicios ya tenían sus Dockerfiles con multi-stage build, las imágenes se publicaban en Amazon ECR y el pipeline de GitHub Actions se encargaba de construir, publicar y desplegar automáticamente vía SSH con ProxyJump a las 4 EC2. El sistema funcionaba de punta a punta, pero seguíamos dependiendo de SSH para desplegar y no teníamos ningún mecanismo de recuperación automática si un contenedor se caía.

La **EP3** fue donde las cosas se pusieron realmente interesantes desde mi perspectiva como encargado de infraestructura. Migramos toda la capa de ejecución hacia AWS ECS Fargate, lo que significó crear un clúster nuevo, configurar 12 servicios con sus Task Definitions, montar un Application Load Balancer, definir roles IAM diferenciados y adaptar el pipeline para que hablara con la API de ECS en vez de conectarse por SSH. Todo esto manteniendo el entorno EC2 anterior encendido durante 48 horas como respaldo, hasta confirmar que ECS funcionaba correctamente de extremo a extremo.

Nos organizamos dividiendo el trabajo por módulo: yo me encargué de toda la infraestructura de red y del clúster, Darío adaptó los microservicios de Data Sources a Fargate y Felipe configuró Service Connect, autoscaling y la integración del frontend con el ALB. La comunicación fue constante — no podíamos avanzar cada uno por separado porque la infraestructura, los servicios y el pipeline están fuertemente acoplados.

## 2. Decisiones técnicas tomadas

### ECS Fargate sobre EKS

Esta fue una de las primeras decisiones que tomamos como equipo y donde yo tuve opinión fuerte. EKS es más potente y más cercano al estándar de la industria con Kubernetes, pero para un proyecto académico con plazo de una semana y un presupuesto acotado, el overhead operativo de administrar nodos worker, instalar controladores de ingress y manejar los manifiestos de Kubernetes no se justificaba. Fargate nos permite declarar CPU, memoria y networking por tarea y AWS se encarga del resto — no hay instancias EC2 que parchar ni Auto Scaling Groups del propio clúster que dimensionar.

### VPC reutilizada, no creada desde cero

Cuando planificamos la migración a ECS, evaluamos si crear una VPC nueva dedicada al clúster o reutilizar la que ya teníamos de EP1. Decidí reutilizarla porque ya estaba validada en dos evaluaciones anteriores, con el enrutamiento probado y los Security Groups bien definidos. Crear una VPC nueva habría introducido riesgo de errores de enrutamiento justo en una migración que ya de por sí cambiaba muchas variables. Lo que sí hice fue crear un Security Group nuevo exclusivo para las tareas ECS, separado del de las instancias EC2, con reglas de entrada acotadas al tráfico del ALB y al tráfico interno entre tareas.

### NAT instance en vez de NAT Gateway

EC2-1 actúa como NAT instance manual para dar salida a internet a las subredes privadas. Un NAT Gateway administrado cuesta aproximadamente 32 dólares al mes solo en cargos base, mientras que usar EC2-1 como NAT no tiene costo adicional porque la instancia ya existía. La desventaja es que si EC2-1 se cae, las instancias privadas pierden salida a internet, pero en un entorno académico eso es aceptable. En producción real, un NAT Gateway sería la opción correcta.

### Roles IAM diferenciados (Execution Role vs Task Role)

ECS Fargate distingue entre el Execution Role (que usa el agente de ECS para descargar imágenes de ECR y leer secretos de Secrets Manager) y el Task Role (que usa la aplicación en runtime). Configuré ambos de forma explícita en cada Task Definition, siguiendo el principio de menor privilegio: el Execution Role solo tiene permisos sobre ECR, CloudWatch Logs y Secrets Manager, mientras que el Task Role queda con permisos mínimos porque nuestros microservicios no llaman directamente a APIs de AWS.

### Un solo ALB apuntando al frontend

Desplegué un único ALB público con un Target Group dirigido exclusivamente al servicio frontend. No expuse el api-gateway en un segundo Target Group porque el patrón de acceso de la aplicación siempre pasa primero por el frontend — Nginx sirve la SPA y hace proxy hacia el Gateway por la red interna. Un segundo Target Group habría sumado superficie de ataque sin aportar una ruta de acceso adicional real.

### Deployment Circuit Breaker siempre activo

Habilité el Deployment Circuit Breaker con rollback automático en las 12 definiciones de servicio. Si una nueva revisión no alcanza el estado saludable esperado, ECS revierte automáticamente a la última revisión estable. No tiene sentido tener un caso donde un despliegue roto se mantenga sirviendo tráfico, así que lo configuré como política fija en todos los servicios.

## 3. Cómo funciona la solución implementada

La plataforma se despliega como un clúster ECS Fargate con 12 servicios. El flujo de una petición desde el usuario hasta la base de datos es el siguiente:

1. El usuario accede a la URL pública del ALB desde su navegador.
2. El ALB reenvía la petición al servicio `frontend`, que es el único con un Target Group configurado.
3. Nginx en el frontend sirve la SPA de React. Cuando la SPA necesita datos, hace peticiones a `/api/*`, que Nginx proxea hacia `api-gateway` por la red interna de Service Connect.
4. El `api-gateway` enruta la petición al microservicio correspondiente (por ejemplo, `ms-kpis` para indicadores, `ms-sales` para ventas) usando las rutas definidas en `application.yml` con el prefijo `spring.cloud.gateway.server.webflux.routes`.
5. El microservicio consulta su base de datos lógica en RDS y devuelve la respuesta.
6. Para las vistas del dashboard, el `bff` agrega llamadas a `ms-kpis`, `ms-reporting` y `ms-data-ingestion`, consolidando la información antes de devolverla al frontend.

La comunicación interna entre servicios se resuelve por **ECS Service Connect** mediante un namespace Cloud Map de tipo DNS privado (`cordillera-dns.local`). Cada servicio es accesible por un nombre DNS estable — por ejemplo `ms-kpis.cordillera-dns.local` — independiente de la IP de la tarea que lo esté sirviendo.

Los secretos (credenciales RDS, clave JWT, API key de Resend) están en AWS Secrets Manager y se inyectan como variables de entorno al momento del arranque de cada tarea, resueltos por el Execution Role.

El pipeline de GitHub Actions se activa con cada push a `master`: compila backend y frontend en paralelo, construye y publica las 12 imágenes en ECR, registra nuevas revisiones de Task Definition y fuerza el despliegue en cada servicio, esperando a que ECS confirme el estado estable antes de reportar éxito.

## 4. En qué partes participé directamente

Mi responsabilidad principal fue toda la **infraestructura**, tanto de red como de orquestación:

- **VPC y networking (EP1):** diseño y creación de la VPC `cordillera-vpc` con subred pública y privadas, Internet Gateway, route tables y configuración de EC2-1 como NAT instance (incluyendo el fix de la interfaz `ens5` en Amazon Linux 2023, que no es `eth0`).
- **Security Groups:** definición de SG-PUBLIC, SG-PRIVATE y SG-DATABASE con reglas basadas en el principio de mínimo privilegio. En EP3 creé un SG adicional para las tareas ECS.
- **Instancias EC2 (EP1/EP2):** aprovisionamiento de las 4 instancias con User Data (Docker, Docker Compose v2, swap de 2 GB), configuración de SSH con ProxyJump.
- **RDS PostgreSQL:** creación de la instancia, el parameter group con `max_connections=200`, y las 8 bases de datos lógicas.
- **Clúster ECS Fargate (EP3):** creación del clúster `cordillera-cluster`, definición de los 12 servicios con sus Task Definitions, configuración de Fargate como capacity provider.
- **Application Load Balancer (EP3):** despliegue de `cordillera-alb` con Target Group `cordillera-frontend-tg` y health checks HTTP.
- **Roles IAM (EP3):** configuración del Execution Role y Task Role diferenciados para cada servicio.

## 5. Mi principal aporte dentro del equipo

Mi principal aporte fue proveer la **base sólida sobre la que corre todo lo demás**. Sin la VPC bien configurada, los Security Groups correctos y el clúster ECS funcionando, el código de los microservicios y el pipeline no tienen dónde ejecutarse. En EP3 específicamente, el trabajo de crear los 12 servicios ECS con sus Task Definitions, montar el ALB y configurar los roles IAM fue lo que habilitó que Felipe pudiera configurar Service Connect y autoscaling encima, y que Darío pudiera adaptar sus microservicios de datos a Fargate.

También fui quien dimensionó los recursos de forma consciente para no exceder el presupuesto: elegir t3.micro en vez de instancias más grandes, configurar swap para compensar la RAM limitada, usar NAT instance en vez de NAT Gateway, y evaluar qué infraestructura de EC2 reutilizar en ECS para no crear recursos duplicados innecesariamente.

## 6. Aspectos técnicos que domino y puedo defender

- **Arquitectura de red AWS:** puedo explicar y justificar cada componente de la VPC (subredes públicas vs privadas, route tables, NAT instance, Internet Gateway), por qué están configurados así y qué pasaría si se cambiara algo.
- **Security Groups y principio de mínimo privilegio:** entiendo cómo funcionan las reglas de entrada y salida, por qué se referencian por Security Group ID y no por IP/CIDR para el tráfico interno, y cómo se encadenan entre SG-PUBLIC, SG-PRIVATE, SG-DATABASE y el SG de tareas ECS.
- **ECS Fargate:** puedo explicar la diferencia entre un clúster, un servicio, una tarea y una Task Definition; por qué se elige Fargate sobre EC2 como capacity provider; cómo funciona el modelo de networking `awsvpc`; y cómo el `desiredCount` garantiza la convergencia hacia el estado deseado.
- **Application Load Balancer:** entiendo cómo funciona un Target Group con health checks, por qué el listener del ALB apunta solo al frontend y cómo el tráfico fluye desde el ALB hasta los servicios backend por la red interna.
- **Roles IAM en ECS:** puedo justificar la separación entre Execution Role y Task Role, qué permisos necesita cada uno y por qué no se deben mezclar.
- **Deployment Circuit Breaker:** entiendo cómo ECS detecta un despliegue fallido, bajo qué condiciones revierte automáticamente y por qué el comportamiento con `desiredCount=1` tarda más que con un valor mayor (tiene menos señal para distinguir un despliegue lento de uno roto).
- **Migración EC2 → ECS:** puedo explicar el procedimiento completo, incluyendo por qué se mantuvo el entorno EC2 encendido durante 48 horas como respaldo, qué infraestructura se reutilizó y qué se creó nueva.

---

*Rodrigo Jara — Grupo Cordillera — ISY1101 — Duoc UC — julio 2026*
