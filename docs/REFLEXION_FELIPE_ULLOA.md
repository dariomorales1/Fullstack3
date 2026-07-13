# Reflexión Individual — Felipe Ulloa

> **Proyecto:** Plataforma Grupo Cordillera  
> **Asignatura:** ISY1101 — Introducción a Herramientas DevOps  
> **Módulo a cargo:** Core Intelligence y Frontend  
> **Fecha:** julio de 2026

---

## 1. Cómo se desarrolló el proyecto

El proyecto arrancó como una idea relativamente sencilla — una plataforma de monitoreo empresarial — pero la complejidad fue creciendo evaluación a evaluación, y con ella las lecciones. Lo que más rescato del proceso es que cada etapa no fue solo agregar funcionalidad nueva, sino entender a fondo lo que ya estaba construido para poder evolucionarlo sin romperlo.

En la **EP1** el desafío fue pasar de "esto funciona en mi máquina" a "esto funciona en AWS". Levantamos la VPC, las 4 instancias EC2 y la base de datos RDS, y desplegamos los 12 servicios con Docker Compose. Mi foco estuvo en los microservicios de Core Intelligence (`ms-data-ingestion`, `ms-kpis`, `ms-reporting`) y en el frontend React. Lo más difícil de esta etapa no fue el código en sí, sino entender el networking de AWS — que un contenedor en EC2-3 no puede hablar directamente con otro en EC2-1 usando la IP interna de Docker, sino que necesita pasar por la IP privada del host.

En la **EP2** automatizamos todo con GitHub Actions. Armé el pipeline que compila backend y frontend en paralelo, construye las 12 imágenes Docker con multi-stage build, las publica en ECR y las despliega en las 4 EC2 vía SSH con ProxyJump. Fue la primera vez que un push a una rama activaba un despliegue completo sin que nadie tocara un terminal manualmente. También armé el Dockerfile del frontend — un patrón distinto al backend: Node 20 para compilar la SPA con Vite, y después Nginx alpine para servirla.

La **EP3** fue la migración a ECS Fargate, y fue donde más aprendí. Me tocó configurar ECS Service Connect (el reemplazo de Eureka para el descubrimiento de servicios), el autoscaling con Target Tracking sobre los servicios más demandados, la integración del frontend con el ALB y la adaptación del pipeline para que hablara con la API de ECS. También fue la etapa donde pasé más tiempo depurando algo que no funcionaba como esperaba: Eureka bajo Service Connect. El proceso de investigar por qué Eureka era inestable, corregir tres bugs reales en el camino y finalmente tomar la decisión de abandonarlo por completo fue probablemente la experiencia técnica más formativa del semestre.

Nos dividimos el trabajo por módulo pero la comunicación fue permanente. Cada decisión de infraestructura que tomaba Rodrigo afectaba cómo yo configuraba Service Connect; cada cambio que Darío hacía en los microservicios de datos requería que yo verificara que el gateway seguía enrutando correctamente. La ventana de 48 horas de validación con ambos entornos corriendo en paralelo (EC2 y ECS) fue clave — nos dio espacio para depurar sin la presión de tener el sistema productivo caído.

## 2. Decisiones técnicas tomadas

### Abandonar Eureka en ECS — la decisión más importante

El plan original era mantener Eureka también en ECS, asumiendo que sería el camino de menor resistencia. Desplegamos `eureka-server` como un servicio más del clúster y todo parecía funcionar, hasta que empezamos a ver que `/api/auth/login` respondía de forma intermitente — a veces 200, a veces 503, sin patrón claro.

Investigué a fondo y encontré que `eureka-server` entraba en un ciclo de renovación de arriendos fallida, generando más de 190 errores en 5 minutos. Descarté que fuera un problema de recursos (CPU estaba entre 6-13% en CloudWatch) y que fuera un reinicio del contenedor (estaba estable). En el camino corregí tres bugs reales:

1. El namespace HTTP de Service Connect no publicaba registros DNS reales que Nginx pudiera resolver con consultas UDP — cambié a `proxy_pass` estático.
2. Los alias de cliente de Service Connect usaban nombres cortos en vez del FQDN completo (`cordillera-dns.local`).
3. El `instanceId` de Eureka colisionaba entre todas las tareas porque el hostname autodetectado resolvía a la misma IP link-local (`169.254.172.2`) del endpoint de metadata de ECS.

Con los tres fixes aplicados, la inestabilidad persistió. Ahí tomé la decisión de abandonar Eureka: Service Connect ya provee descubrimiento de servicios nativo con DNS interno, así que mantener un segundo mecanismo era redundante y activamente perjudicial. Las 12 Task Definitions pasaron a `EUREKA_CLIENT_ENABLED=false`, con `api-gateway` y `bff` apuntando a URLs directas de Service Connect. Tras el redeploy, las pruebas mostraron 100% de respuestas exitosas, cero 503.

### Service Connect con namespace DNS privado

Configuré ECS Service Connect sobre un namespace Cloud Map de tipo `DNS_PRIVATE` (`cordillera-dns.local`). Cada servicio queda accesible por un nombre estable — por ejemplo `ms-kpis.cordillera-dns.local` — independiente de la IP de la tarea. Esto es más simple y confiable que Eureka para un entorno Fargate porque se integra nativamente con el modelo de networking `awsvpc` y no requiere un componente adicional corriendo dentro del clúster.

### Autoscaling concentrado en 3 servicios, no en los 12

No aplicamos autoscaling a todos los servicios por igual. Lo concentré en `api-gateway`, `bff` y `ms-kpis` porque son los tres que reciben la carga más variable: el gateway recibe cada petición pública, el bff agrega llamadas a tres servicios por cada vista del dashboard, y ms-kpis calcula los indicadores que consume esa vista. Los servicios de datos puros reciben tráfico más predecible, así que se dejaron con `desiredCount` fijo.

El umbral de 60% de CPU se fijó por debajo del típico 70-80% porque el arranque de una tarea nueva en Fargate no es instantáneo. Entre que Target Tracking detecta la superación del umbral y la tarea nueva está lista, pasan al menos 30 segundos (arranque de JVM, compilación JIT, inicialización de Hibernate). Un umbral más alto dejaría menos margen para absorber picos durante la inicialización. En `ms-kpis` agregué memoria como segunda métrica (70%) porque ese servicio construye estructuras de agregación en memoria.

### URLs de servicios externalizadas a variables de entorno

Al migrar `bff` a URLs directas de Service Connect descubrí que `KpisClient.java`, `IngestionClient.java` y `ReportingClient.java` tenían constantes hardcodeadas a `http://host.docker.internal:PORT` — una URL que nunca funcionó en ningún entorno, silenciosamente enmascarada por el `onErrorResume` de WebClient. Las externalicé a `@Value("${services.ms-kpis.url}")` y equivalentes, configurables por variable de entorno, lo que permite cambiar las URLs entre entornos sin recompilar.

### Pipeline reescrito para ECS

El pipeline de EP2 terminaba en un despliegue por SSH con `docker compose up -d`. Para EP3 lo reescribí para que dialogue con la API de ECS: `register-task-definition` para registrar una nueva revisión con la imagen recién publicada, `update-service --force-new-deployment` para forzar el despliegue, y `wait services-stable` para confirmar que todo arrancó correctamente antes de reportar éxito. Esto cierra una brecha real de EP2 donde el pipeline reportaba éxito sin verificar que el contenedor estuviera realmente sano.

## 3. Cómo funciona la solución implementada

La plataforma Grupo Cordillera funciona como un sistema de microservicios desplegado sobre ECS Fargate. El flujo completo de una petición es:

El usuario accede a la URL pública del ALB. El ALB reenvía la petición al servicio `frontend`, que es una SPA de React compilada con Vite y servida por Nginx. Cuando la SPA necesita datos, hace fetch a `/api/*`. Nginx intercepta esas peticiones y las proxea hacia `api-gateway:8080` por la red interna de Service Connect.

El `api-gateway` es un Spring Cloud Gateway reactivo (WebFlux) que enruta las peticiones por path. Por ejemplo, `/api/sales/**` va a `ms-sales`, `/api/auth/**` va a `ms-auth`, `/api/kpis/**` va a `ms-kpis`. Las rutas están definidas en `application.yml` bajo el prefijo `spring.cloud.gateway.server.webflux.routes` (importante: Spring Cloud Gateway 5.x cambió este prefijo, y eso causó un bug histórico que documentamos).

Para las vistas del dashboard, el frontend no llama a los microservicios de datos directamente. Llama al `bff`, que agrega datos de `ms-kpis`, `ms-reporting` y `ms-data-ingestion` en una sola respuesta. El `bff` usa circuit breaker (Resilience4j) para que si uno de esos servicios falla, el dashboard no se caiga completamente sino que muestre los datos disponibles.

Cada microservicio de negocio tiene su propia base de datos lógica en la instancia RDS compartida. `ms-auth` maneja autenticación JWT con Flyway para migraciones, y los demás usan `ddl-auto=update` de Hibernate.

La comunicación interna entre servicios ya no pasa por Eureka — usa ECS Service Connect con el namespace `cordillera-dns.local`. Cada servicio se registra automáticamente y es accesible por nombre DNS estable.

El pipeline de GitHub Actions automatiza el ciclo completo: push a `master` → build backend/frontend en paralelo → construcción de 12 imágenes Docker → push a ECR → registro de Task Definitions → despliegue en ECS → verificación de estabilidad. El Deployment Circuit Breaker revierte automáticamente cualquier despliegue que no pase los health checks.

Los secretos están en AWS Secrets Manager, las métricas en CloudWatch Container Insights, y los logs de cada servicio en su propio log group bajo `/ecs/cordillera/`.

## 4. En qué partes participé directamente

Mi responsabilidad abarcó Core Intelligence, el frontend y varias piezas transversales:

- **Microservicios de Core Intelligence (EP1/EP2):** desarrollo y mantenimiento de `ms-data-ingestion`, `ms-kpis` y `ms-reporting`, desplegados en EC2-3.
- **Frontend React (EP1/EP2):** configuración de la SPA con Vite y Tailwind v4, el Dockerfile multi-stage (Node → Nginx) y el `nginx.conf` con reverse proxy hacia el gateway.
- **Pipeline CI/CD (EP2/EP3):** diseño e implementación del workflow de GitHub Actions, desde la versión original con SSH + ProxyJump hasta la versión actual con despliegue a ECS vía API.
- **ECS Service Connect (EP3):** configuración del namespace Cloud Map, los `clientAliases` con FQDN, los scripts de creación y actualización de servicios, y la investigación completa del problema de Eureka que llevó a la decisión de abandonarlo.
- **Autoscaling (EP3):** configuración de Target Tracking en `api-gateway`, `bff` y `ms-kpis`, con justificación de umbrales y análisis del comportamiento de escalado post-carga.
- **Prueba de carga con k6 (EP3):** ejecución de la prueba de 50 VUs durante 3 minutos contra `/api/kpis` vía ALB, análisis de los resultados (3.664 requests, 0% error, escalado de 1→4 tareas) y documentación del hallazgo del sobreescalado por cold-start de JVM.
- **Pruebas de resiliencia (EP3):** ejecución de los dos escenarios sobre `ms-reporting` (auto-healing de tarea caída y circuit breaker con imagen inexistente), incluyendo la repetición de la segunda prueba el 2026-07-03 que confirmó el rollback automático en ~12 minutos.
- **Integración frontend + ALB (EP3):** adaptación de la configuración de Nginx para que funcionara con el ALB en vez de con `api-gateway` en la misma máquina.
- **Documentación:** redacción de la documentación técnica del proyecto y del informe de EP3.
- **Fix de URLs hardcodeadas en BFF:** detección y corrección de las constantes `host.docker.internal` en los clientes WebClient del `bff`.

## 5. Mi principal aporte dentro del equipo

Mi principal aporte fue resolver el **problema más complejo del proyecto** — la inestabilidad de Eureka bajo ECS — y convertirlo en la **decisión de arquitectura más importante** de la migración. No fue solo un fix técnico: fue un proceso de investigación que incluyó descartar hipótesis (CPU, reinicios), corregir tres bugs reales en el camino (namespace DNS, alias sin FQDN, instanceId colisionando) y finalmente reconocer que la solución correcta no era seguir parchando Eureka sino eliminarlo. Esa decisión simplificó toda la arquitectura de ECS y resolvió de raíz un problema que habría seguido dando problemas.

También aporté la visión de extremo a extremo del proyecto a través del pipeline de CI/CD y la documentación. Ser quien escribe el pipeline te obliga a entender cada pieza — desde cómo se compila el monorepo Maven hasta cómo ECS registra una Task Definition nueva — y eso me dio una perspectiva transversal que fue útil para coordinar el trabajo del equipo.

## 6. Aspectos técnicos que domino y puedo defender

- **ECS Service Connect vs Eureka:** puedo explicar en detalle por qué Eureka era inestable bajo Fargate, qué era cada uno de los tres bugs encontrados, cómo los corregí y por qué la decisión final fue abandonar Eureka. También puedo comparar los dos mecanismos de descubrimiento de servicios y justificar cuándo usaría cada uno.
- **Autoscaling con Target Tracking:** puedo justificar por qué se eligieron esos 3 servicios, por qué el umbral es 60% y no 70%, por qué se agregó memoria como segunda métrica en `ms-kpis`, y por qué el sobreescalado post-carga por cold-start de JVM es evidencia positiva y no un defecto.
- **Pipeline CI/CD completo:** puedo recorrer cada paso del workflow de GitHub Actions — desde el trigger en `master`, pasando por los builds en paralelo, la construcción de imágenes, el push a ECR con doble tag, el registro de Task Definitions, el despliegue con `force-new-deployment`, y la espera con `wait services-stable`. También puedo explicar la diferencia con el pipeline de EP2 (SSH + ProxyJump) y por qué el esquema actual es mejor.
- **Spring Cloud Gateway 5.x:** puedo explicar el cambio de prefijo de configuración de `spring.cloud.gateway.routes` a `spring.cloud.gateway.server.webflux.routes`, por qué es un Gateway reactivo (WebFlux) y no MVC, y cómo se define el enrutamiento por path predicates.
- **Frontend React + Nginx:** puedo explicar el Dockerfile multi-stage (Node → Nginx), cómo funciona el `nginx.conf` como reverse proxy y SPA server, el problema de la caché de DNS de Nginx open-source al recrear contenedores, y por qué Tailwind v4 no necesita `autoprefixer`.
- **Pruebas de resiliencia y carga:** puedo explicar los dos escenarios de resiliencia probados, por qué el circuit breaker de despliegue tarda ~12 minutos con `desiredCount=1`, y los resultados de la prueba de carga con k6 (incluyendo el hallazgo del cold-start de JVM retroalimentando la métrica de CPU).
- **Gestión de secretos:** puedo explicar cómo los secretos pasan de Secrets Manager a las Task Definitions por ARN, por qué no se ponen en texto plano ni en el código, y cómo funciona la separación entre Execution Role (que lee los secretos) y Task Role (que usa la aplicación en runtime).
- **Observabilidad con CloudWatch:** puedo explicar cómo están organizados los log groups por servicio, qué métricas aporta Container Insights, y cómo el dashboard `cordillera-dashboard` permite monitorear los 12 servicios desde una sola vista.

---

*Felipe Ulloa — Grupo Cordillera — ISY1101 — Duoc UC — julio 2026*
