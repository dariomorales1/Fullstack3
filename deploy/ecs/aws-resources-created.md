# Recursos AWS creados para la migración a ECS Fargate

> Registro incremental de todo lo creado durante la migración (regla del prompt: "todo comando de AWS CLI que ejecutes, déjalo registrado"). Región: `us-east-2`. Ventana de validación acordada con el usuario: **48 horas desde 2026-07-02 18:49 UTC** — después de eso, apagar/eliminar todo lo de esta lista si no se decide continuar.

## Fase 1 — Red (completada 2026-07-02)

| Recurso | ID | Detalle | Comando usado |
|---|---|---|---|
| Subred pública nueva | `subnet-04fcc3db49c063a8b` | `10.0.4.0/24`, us-east-2b, `map-public-ip-on-launch=true` | `aws ec2 create-subnet --vpc-id vpc-0b9c0a321dc30fa83 --cidr-block 10.0.4.0/24 --availability-zone us-east-2b` |
| Asociación route table | `rtbassoc-0d93ef0d7de6318cb` | Asocia `subnet-04fcc3db49c063a8b` a `rtb-0baa825f3d82e3170` (pública, → IGW) | `aws ec2 associate-route-table --subnet-id subnet-04fcc3db49c063a8b --route-table-id rtb-0baa825f3d82e3170` |
| SG del ALB | `sg-0267285fc37855075` (nombre `cordillera-alb-sg`) | Ingress: 80/tcp y 443/tcp desde `0.0.0.0/0` | `aws ec2 create-security-group --group-name cordillera-alb-sg ...` + 2× `authorize-security-group-ingress` |
| SG de tareas ECS | `sg-05aaf94b0ea27a976` (nombre `cordillera-ecs-tasks-sg`) | Ingress: 80/tcp desde `sg-0267285fc37855075` (ALB); 8080-8092/tcp y 8761/tcp desde sí mismo (comunicación inter-servicio) | `aws ec2 create-security-group --group-name cordillera-ecs-tasks-sg ...` + 3× `authorize-security-group-ingress` |
| Regla nueva en SG de RDS | — (sobre `sg-0835efe9646e1028c` existente) | Ingress 5432/tcp desde `sg-05aaf94b0ea27a976`, agregada sin borrar las reglas existentes (`sg-014a8e82c80fae331`, `sg-0f02d2dd03261cc21`) | `aws ec2 authorize-security-group-ingress --group-id sg-0835efe9646e1028c --protocol tcp --port 5432 --source-group sg-05aaf94b0ea27a976` |

**Nota de nomenclatura:** AWS no permite `GroupName` con prefijo `sg-` (reservado para IDs autogenerados) — por eso los SGs se llaman `cordillera-alb-sg` y `cordillera-ecs-tasks-sg` en vez de `sg-alb`/`sg-ecs-tasks` como los nombraba el prompt original. Los IDs reales (`sg-0267285fc37855075`, `sg-05aaf94b0ea27a976`) son los que hay que usar en las fases siguientes.

**Verificado:** `aws ec2 describe-subnets` confirma 4 subredes en la VPC (2 privadas sin cambios + 2 públicas); `aws ec2 describe-security-groups` confirma las reglas de los 3 SGs (2 nuevos + la extensión sobre el de RDS).

## Fase 2 — Clúster ECS y namespace de Service Connect (completada 2026-07-02)

| Recurso | ID | Detalle |
|---|---|---|
| Rol service-linked de ECS | `AWSServiceRoleForECS` | Creado automáticamente al crear el clúster (`aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`) |
| Clúster ECS | `cordillera-cluster` (`arn:aws:ecs:us-east-2:215682485633:cluster/cordillera-cluster`) | Capacity providers `FARGATE` + `FARGATE_SPOT` (base=1/weight=1 cada uno), Container Insights habilitado |
| Namespace Cloud Map | `ns-y5kqftryqq5y4tki` (`cordillera.local`, tipo HTTP) | `aws servicediscovery create-http-namespace --name cordillera.local` |

**Decisión de arquitectura tomada:** se mantiene `eureka-server` como un servicio ECS más (Camino 1 de la evaluación de Fase 0) — los 11 servicios siguen usando `lb://<servicio>` sin cambios de código. `EUREKA_URL` apunta a `http://eureka-server.cordillera.local:8761/eureka/` (DNS de Service Connect) en vez de la IP fija `10.0.2.107` que se usaba en EC2. **No se seteó `EUREKA_INSTANCE_IP_ADDRESS`** en ninguna task definition — en `awsvpc` cada tarea ya tiene una IP de VPC real y ruteable por diseño, así que la auto-detección default de Eureka (`prefer-ip-address: true` sin override) resuelve correctamente sin el workaround que fue necesario en EC2 (ver §8 de `DOCUMENTACION_TECNICA.md`).

## Fase 3 — Task Definitions (completada 2026-07-02)

Rol de ejecución: `cordilleraEcsTaskExecutionRole` (`arn:aws:iam::215682485633:role/cordilleraEcsTaskExecutionRole`), con la policy administrada `AmazonECSTaskExecutionRolePolicy` + policy inline `cordilleraSecretsAccess` (permite `secretsmanager:GetSecretValue` sobre `arn:aws:secretsmanager:us-east-2:215682485633:secret:cordillera/*`).

12 task definitions registradas (revisión 1, excepto `ms-auth` en revisión 2 tras actualizar `FRONTEND_URL` con el DNS real del ALB): `cordillera-eureka-server`, `cordillera-api-gateway`, `cordillera-bff`, `cordillera-ms-auth`, `cordillera-ms-sales`, `cordillera-ms-inventory`, `cordillera-ms-finance`, `cordillera-ms-customer`, `cordillera-ms-data-ingestion`, `cordillera-ms-kpis`, `cordillera-ms-reporting`, `cordillera-frontend`. JSON fuente en `deploy/ecs/task-definitions/*.json`, generados con `deploy/ecs/generate-task-defs.sh`.

**Decisión — imagen de frontend separada para ECS:** se creó `frontend/grupoCordillera/Dockerfile.ecs` + `nginx.ecs.conf` (en vez de modificar los archivos que usa EC2) porque el `nginx.conf` de producción apunta a `http://api-gateway:8080` (nombre de contenedor Docker Compose) y el de ECS necesita apuntar a `http://api-gateway.cordillera.local:8080` (DNS de Service Connect) + `resolver 10.0.0.2` (DNS de la VPC, en vez de `127.0.0.11` que es el DNS embebido de Docker). Se publicó como tag **`:ecs`** en el mismo repo ECR (`grupocordillera/frontend:ecs`), dejando `:latest` intacto para no romper el redeploy del EC2 actual mientras coexistan ambos entornos.

## Fase 4 — Servicios ECS + ALB (completada 2026-07-02)

| Recurso | ID / Valor |
|---|---|
| ALB | `cordillera-alb` (`arn:aws:elasticloadbalancing:us-east-2:215682485633:loadbalancer/app/cordillera-alb/cb3b1ca13b700fe2`) — internet-facing, subredes `subnet-0d026163d43190d68` + `subnet-04fcc3db49c063a8b` |
| **DNS público del ALB** | **`cordillera-alb-1476500823.us-east-2.elb.amazonaws.com`** |
| Target Group frontend | `cordillera-frontend-tg` (`arn:aws:elasticloadbalancing:us-east-2:215682485633:targetgroup/cordillera-frontend-tg/11bd0f86c5fefab0`) — target type `ip`, puerto 80, health check `/` |
| Listener | HTTP:80 → forward a `cordillera-frontend-tg` |
| 12 Services ECS | `eureka-server`, `api-gateway`, `bff`, `ms-auth`, `ms-sales`, `ms-inventory`, `ms-finance`, `ms-customer`, `ms-data-ingestion`, `ms-kpis`, `ms-reporting` (sin ALB, solo Service Connect) + `frontend` (con ALB) — todos `desiredCount=1`, en subredes privadas (`subnet-0c37930ff9a14e070`, `subnet-01ee6cc30cb65eee9`), `assignPublicIp=DISABLED`, SG `sg-05aaf94b0ea27a976` |
| Deployment config (los 12) | `maximumPercent=200`, `minimumHealthyPercent=100`, `deploymentCircuitBreaker={enable:true,rollback:true}`, `healthCheckGracePeriodSeconds=60` — aplicado desde la creación para no tener que recrear servicios en la Fase 7 |
| Service Connect | Habilitado en los 12, cada uno con `clientAlias` = su propio nombre de servicio (ej. `http://ms-kpis.cordillera.local:8091`) |

Script fuente: `deploy/ecs/create-services.sh`.

## Fase 5 — Secrets Manager (completada 2026-07-02)

| Secreto | ARN |
|---|---|
| `cordillera/db-password` | `arn:aws:secretsmanager:us-east-2:215682485633:secret:cordillera/db-password-DwMDdj` (mismo valor que `DB_PASSWORD` en GitHub Secrets) |
| `cordillera/jwt-secret` | `arn:aws:secretsmanager:us-east-2:215682485633:secret:cordillera/jwt-secret-9kAe1j` (mismo valor fallback que usa hoy `ms-auth` en EC2 — ver incidente #17 de `DOCUMENTACION_TECNICA.md`, el `JWT_SECRET` real de GitHub se perdió y no es recuperable) |
| `cordillera/resend-api-key` | `arn:aws:secretsmanager:us-east-2:215682485633:secret:cordillera/resend-api-key-iiAg5I` — **valor placeholder `PENDIENTE_CONFIGURAR`, no funcional.** Reemplazar con la key real de Resend si se necesita probar el flujo de "olvidé mi contraseña" en ECS. |

## Fase 6 — Autoscaling (completada 2026-07-02)

| Recurso | Detalle |
|---|---|
| Scalable targets | `api-gateway`, `bff`, `ms-kpis` — `minCapacity=1`, `maxCapacity=4` |
| Política CPU (los 3) | Target Tracking `ECSServiceAverageCPUUtilization`, target `60%`, `scaleOutCooldown=60s`, `scaleInCooldown=120s` |
| Política memoria (`ms-kpis`) | Target Tracking `ECSServiceAverageMemoryUtilization`, target `70%` |

Comportamiento observado en vivo (no buscado, efecto secundario del incidente de Eureka): durante el crash-loop inicial de `ms-kpis` (antes de encontrar el fix real), el CPU spike del arranque repetido de JVM disparó la política y `desiredCount` subió de 1 a 2-3 automáticamente, y volvió a bajar a 1 solo una vez que el servicio se estabilizó — evidencia de que el mecanismo de autoscaling en sí funciona correctamente, incluso si fue provocado por un problema no relacionado.

## Diagnóstico exhaustivo: inestabilidad de Eureka sobre Service Connect (investigación 2026-07-02, NO resuelta al 100%)

Después de que los 12 servicios ECS quedaron `RUNNING` y sanos individualmente, la comunicación real entre microservicios vía Eureka resultó profundamente inestable. Se investigaron y corrigieron **dos causas raíz reales y confirmadas**, documentadas abajo — pero **queda un tercer problema sin resolver** que hace que el sistema funcione de forma intermitente (a veces `/api/auth/login` da 200, otras 503; mismo patrón en `/api/sales`, `/api/kpis`, etc.).

### Causa raíz #1 (confirmada y corregida): `clientAliases[].dnsName` debe ser el FQDN completo

Con `dnsName` = nombre corto (ej. `"eureka-server"`), el sidecar de Service Connect no interceptaba las conexiones porque la aplicación intentaba resolver el hostname completo (`eureka-server.cordillera-dns.local`, seteado explícitamente vía `EUREKA_INSTANCE_HOSTNAME` para evitar el bug de IP null documentado en la Fase 2). **Fix:** `dnsName` = `${servicio}.cordillera-dns.local` (FQDN completo) en `create-services.sh`/`update-services-dns.sh`.

### Causa raíz #2 (confirmada y corregida): `nginx` con `resolver` dinámico ignora `/etc/hosts`

Confirmado empíricamente (se agregó un `CMD` de diagnóstico temporal a `Dockerfile.ecs` que volcó `/etc/resolv.conf` y `/etc/hosts` a CloudWatch Logs antes de arrancar nginx): Service Connect **sí** escribe entradas reales en `/etc/hosts` de cada tarea con el FQDN apuntando a una IP sintética en el rango `127.255.0.x` (ej. `127.255.0.3 eureka-server.cordillera-dns.local`) — **no publica registros DNS reales en Route 53** aunque el namespace sea tipo Private DNS (confirmado con `aws servicediscovery get-service`: `"DnsConfig": {}`, vacío). La directiva `resolver` de nginx hace consultas DNS UDP reales e **ignora `/etc/hosts` por diseño** — por eso `proxy_pass` con `resolver` + variable daba 502 siempre. **Fix:** `proxy_pass` estático sin `resolver`, que usa `getaddrinfo()` del sistema (consulta `/etc/hosts` primero) una sola vez al cargar la config de nginx.

### Causa raíz #3 (confirmada, corregida parcialmente): `instanceId` no único entre servicios

Sin `eureka.instance.instance-id` explícito, Spring Cloud construye el ID con `spring.cloud.client.hostname` — que en awsvpc/Fargate se auto-detectó como `169.254.172.2` (la IP del endpoint de metadata de tareas ECS, **idéntica para las 11 tareas**, no una IP real de red). Esto causaba colisiones de `instanceId` entre servicios completamente distintos. **Fix aplicado:** `EUREKA_INSTANCE_INSTANCE_ID=${servicio}.cordillera-dns.local:${puerto}` (reutilizando el hostname ya corregido) en `generate-task-defs.sh`. Verificado que el `instanceId` en los logs de `eureka-server` ahora es correcto y único (ej. `MS-CUSTOMER - ms-customer.cordillera-dns.local:8084`).

### Problema #4 (SIN RESOLVER): ciclo persistente `lease doesn't exist, registering resource` / `Not Found (Renew)`

**Incluso después del fix #3**, `eureka-server` sigue registrando decenas de ciclos de "lease doesn't exist, registering resource" por minuto para TODOS los servicios backend, de forma continua — cada cliente pierde su lease y se re-registra constantemente, nunca alcanzando un estado estable de heartbeat. Efecto observable: las rutas del Gateway responden 200 o 503 de forma intermitente/aleatoria según si el servicio destino tiene una lease válida en el momento exacto de la petición (`/api/auth/login` alternó entre 200 y 503 en pruebas consecutivas sin ningún cambio de configuración de por medio).

**Se descartó como causa:**
- Recursos insuficientes en `eureka-server` — CPU real medida vía CloudWatch: 6-13% promedio, máximo 25% (tras subir la task de 256/512 a 512/1024 vCPU/MB). Hay margen de sobra.
- `eureka-server` reiniciándose solo — confirmado estable (`reached a steady state`) durante el período en que el ciclo de leases seguía activo.

**Hipótesis no verificadas (quedan pendientes para la próxima sesión):**
- El sidecar Envoy de Service Connect podría estar interrumpiendo/reseteando conexiones HTTP keep-alive de larga duración entre el cliente Eureka y el servidor de forma intermitente, causando que las llamadas de heartbeat (`PUT /eureka/apps/{app}/{id}`) fallen esporádicamente sin generar un error de aplicación claro (el cliente Eureka solo loguea "Cannot execute request on any known server" sin siempre incluir la excepción de red subyacente).
- Podría requerirse ajustar `eureka.instance.lease-renewal-interval-in-seconds` / `lease-expiration-duration-in-seconds` para dar más margen de tolerancia a fallos de red transitorios bajo Service Connect (con `enable-self-preservation: false` en `eureka-server`, cualquier heartbeat perdido de forma consistente lleva a evicción agresiva).
- Se recomienda para la próxima sesión: habilitar ECS Exec (requiere `session-manager-plugin` instalado localmente, no disponible en esta sesión) para inspeccionar en vivo si las conexiones desde un contenedor cliente hacia `eureka-server` vía el proxy Envoy se completan consistentemente o fallan de forma intermitente a nivel de red.
### RESUELTO 2026-07-02: migración a Camino 2 — Eureka retirado del flujo ECS, URLs directas de Service Connect

Se implementó la alternativa de fondo: **api-gateway y bff dejaron de usar `lb://` (Eureka) para llamar a otros servicios en ECS** y ahora usan URLs HTTP directas contra los alias de Service Connect. El resultado fue una resolución **completa e inmediata** de la inestabilidad — 100% de éxito en pruebas repetidas (3× cada endpoint: `/api/auth/login`, `/api/sales`, `/api/kpis`, `/api/inventory`, `/api/customers`, `/api/finance/movements`), sin ningún 503 tras el cambio.

**Cambios de código (afectan ambos entornos, EC2 y ECS, sin romper EC2 gracias a defaults por env var):**

1. **`api-gateway/application.yml`**: cada `uri: lb://<servicio>` se cambió a `uri: ${ROUTE_<SERVICIO>_URI:lb://<servicio>}`. En EC2 (sin la env var seteada) sigue usando `lb://` + Eureka exactamente igual que antes. En ECS, `deploy/ecs/generate-task-defs.sh` inyecta `ROUTE_BFF_URI=http://bff.cordillera-dns.local:8085` (y análogos para los otros 6 servicios) más `EUREKA_CLIENT_ENABLED=false`.

2. **`bff`**: se encontró y corrigió un bug preexistente e independiente de Eureka — `KpisClient.java`, `IngestionClient.java` y `ReportingClient.java` tenían URLs **hardcodeadas** a `http://host.docker.internal:PUERTO`, que nunca funcionaron en NINGÚN entorno real (ni EC2 ni ECS) desde el despliegue inicial — el `onErrorResume` de cada llamada devolvía silenciosamente una lista/mapa vacío, enmascarando el fallo (por eso `/api/kpis` daba `200` con `[]` en vez de error). Se externalizaron a `@Value("${services.ms-kpis.url}")` etc., con default de desarrollo local en `application.yml` y override real vía `MS_KPIS_URL`/`MS_REPORTING_URL`/`MS_DATA_INGESTION_URL` — en EC2 apuntan a `http://10.0.2.118:<puerto>` (IP de EC2-3, agregado a `deploy/ec2-2/docker-compose.yml`), en ECS a los alias de Service Connect.

3. **Los 8 microservicios de negocio + `ms-auth`**: se agregó `eureka.client.enabled: ${EUREKA_CLIENT_ENABLED:true}` a cada `application.yml` — default `true` (EC2 sin cambios), `false` en ECS (dejan de intentar registrarse en Eureka por completo, eliminando toda la actividad de heartbeat/lease que causaba el ciclo de inestabilidad).

4. **Servicio ECS `eureka-server` detenido** (`desiredCount=0`) — ya no lo consume nadie en el entorno ECS. La task definition se mantiene registrada por si se necesita reactivar. **EC2 sigue usando Eureka sin ningún cambio** (memoria del proyecto actualizada para reflejar esto).

**Verificación final:** 6 endpoints × 3 llamadas consecutivas cada uno = 18/18 respuestas `200`/`201`, cero intermitencia, tras el cambio.
