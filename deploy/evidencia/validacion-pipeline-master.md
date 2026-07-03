# Validación controlada del pipeline hacia `master` — 2026-07-03

Objetivo: probar de forma controlada, antes de la exposición, que un push real a `master` dispara el flujo completo (build → push a ECR → deploy a los 12 servicios ECS) sin sorpresas. Se usó un cambio visual mínimo e inofensivo (texto del login) como marcador para confirmar visualmente el deploy real.

## 0. Estado previo detectado

Todo el trabajo de la migración a ECS (task definitions, `ci-cd.yml` reescrito, fixes de Eureka→Service Connect) estaba **sin commitear**, viviendo solo como cambios locales en la rama `develop`. El repo remoto no tenía nada de esto todavía.

## 1. Diagnóstico de las 4 corridas fallidas previas en `develop`

Las 4 últimas corridas en GitHub Actions sobre `develop` (`27109721560`, `27105623218`, `27105508700`, `27088285880`) fallaban **todas por la misma causa exacta**, sin relación con ECS:

```
Container eureka-server Error dependency eureka-server failed to start
dependency failed to start: container eureka-server is unhealthy
##[error]Process completed with exit code 1.
```

Es el job viejo `Deploy to AWS EC2` (SSH + `docker-compose`), que en el `ci-cd.yml` nuevo (sin commitear en ese momento) ya no existe — fue reemplazado por completo por el job `Deploy to AWS ECS`. `build-backend`, `build-frontend` y `push-images` pasaron limpio en las 4 corridas. No se tocó nada de este flujo viejo porque está a punto de quedar retirado.

## 2. Cambio de prueba

`cordillera/frontend/grupoCordillera/src/pages/auth/LoginPage.jsx`: `"Grupo Carlito"` → `"Grupo Cordillera"`.

## 3. Bug #1 encontrado: el workflow apuntaba a una rama `main` que no existe

El repo solo tiene `master` (rama de producción real) y `develop` (default de GitHub). El `ci-cd.yml` rescrito apuntaba a `push`/`pull_request: branches:[main]`. Se corrigió a `master` en las 3 referencias (`on.push`, `on.pull_request`, `if` del job `deploy`) antes de tocar producción.

## 4. Flujo de validación seguido (rama → PR → build limpio → merge)

1. Commit de todo el trabajo de ECS + fix visual en `test/validacion-deploy-ecs`.
2. PR #13 (`test/validacion-deploy-ecs` → `master`): build limpio (`Build & Test Backend` 59s, `Build Frontend` 19s). `push-images`/`deploy` correctamente omitidos (gated a push directo).
3. Merge de PR #13 a `master` (15:36:24 UTC).

## 5. Bug #2 encontrado: `push-images` seguía gateado a `develop`

El primer push real a `master` (run `28670262987`) mostró `Push Docker Images to ECR: skipped` y `Deploy to AWS ECS: skipped` — el job `push-images` tenía `if: github.ref == 'refs/heads/develop'`, remanente del cambio main→master que no se propagó a ese job. Fix de una línea, validado en PR #14 (build limpio), mergeado a `master` (15:41:50 UTC).

## 6. Primer deploy real completo (run `28670519598`) — parcialmente rojo

- Push real a `master`: 15:41:52 UTC.
- `Build & Test Backend` + `Build Frontend`: OK.
- `Push Docker Images to ECR`: OK (8m00s, 12 imágenes incluida la variante `frontend:ecs`).
- Cambio visual confirmado en el bundle JS servido por el ALB (`grep` sobre `/assets/index-CFkrxHNH.js`: 0 "Carlito", 2 "Cordillera") ~15:53-15:54 UTC.
- **Tiempo push → cambio visible en el ALB: ~12 minutos.**
- `Deploy to AWS ECS` job terminó en **rojo** (16m56s): 11 de 12 servicios estabilizaron rápido; `ms-auth` no llegó a estabilizar dentro del timeout de 8 minutos del script (`timeout 480`), aunque **sí lo logró ~4 minutos después**, fuera de la ventana del script.

### Causa raíz real (confirmada en logs de CloudWatch, `/ecs/cordillera/ms-auth`)

```
FATAL: remaining connection slots are reserved for roles with privileges of the "rds_reserved" role
```

`ms-auth` chocó con el límite de conexiones de RDS en su primer intento. CloudWatch (`AWS/RDS DatabaseConnections`, `cordillera-rds`) confirma:

| Momento | Max conexiones |
|---|---|
| Baseline sin deploy en curso (11:38-11:53 hora local) | **160 / 200** |
| Durante el rolling deploy de los 12 servicios ECS (11:54-12:05) | picos de **190-193** |

Con `max_connections=200` (ya elevado antes) y `superuser_reserved_connections` reservando slots, el margen efectivo (~197) se agotó momentáneamente. Causa de fondo: ~19-20 instancias de microservicio corriendo **simultáneamente contra la misma RDS** (≈10 en EC2, el entorno viejo aún vivo en paralelo durante esta validación, + ≈9-10 en ECS), cada una abriendo hasta 10 conexiones HikariCP por defecto de Spring Boot.

## 7. Fix aplicado (PR #15) y segunda corrida — verde

- `maximum-pool-size` de HikariCP: 10 (default) → **5** (`DB_POOL_MAX`, configurable) en los 8 microservicios con datasource propio (`ms-auth`, `ms-sales`, `ms-inventory`, `ms-finance`, `ms-customer`, `ms-data-ingestion`, `ms-kpis`, `ms-reporting`).
- `minimum-idle`: explícito en **2** (`DB_POOL_MIN`).
- Timeout de `aws ecs wait services-stable` por servicio: 8 → **12 minutos**, para absorber picos transitorios futuros sin depender solo del tuning de pool.
- PR #15 validado con build limpio, mergeado a `master` (16:21:29 UTC).

**Run de validación final (`28672345472`): 100% verde.**

| Job | Resultado | Duración |
|---|---|---|
| Build & Test Backend | ✓ | 32s |
| Build Frontend | ✓ | 19s |
| Push Docker Images to ECR | ✓ | 8m56s |
| Deploy to AWS ECS (12 servicios + verificación ALB) | ✓ | 12m43s |

**Evidencia del efecto del fix en conexiones RDS (polling cada 15-20s durante el deploy):**

| Momento | Max conexiones |
|---|---|
| Antes del deploy (baseline con pool viejo) | 160-161 |
| Pico durante el rolling deploy (esta vez) | **178** (vs. 190-193 antes del fix) |
| Baseline nuevo, después de que los 12 servicios ECS adoptaron `maximum-pool-size=5` | **113-123** |

El pico se redujo y quedó con margen real respecto al límite (197 efectivo); el baseline post-deploy bajó de ~160 a ~115-120, dando holgura para picos futuros mientras EC2 siga corriendo en paralelo.

## 8. Confirmación final

- Cambio visual (`Grupo Cordillera`) confirmado en `http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com` tras ambos deploys.
- `http://3.148.98.28` (EC2, entorno viejo) **intencionalmente no cambia** — ese pipeline ya no lo toca; es el comportamiento esperado tras la migración, no un bug.

## 9. Tiempos de referencia para la presentación

- **Push a `master` → cambio visible en el ALB: ~12 minutos.**
- **Push a `master` → pipeline completo (12/12 servicios verificados estables + ALB verificado): ~22 minutos** (Push Docker Images 8m56s + Deploy 12m43s, corridas en secuencia tras el build).
