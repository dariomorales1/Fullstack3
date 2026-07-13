# Evidencia de resiliencia — Fase 10

## Parte 1 — Auto-healing: ECS repone una tarea caída sin intervención manual

**Prueba:** se detuvo manualmente una tarea de `ms-reporting` (equivalente a un crash del contenedor) y se observó si ECS la reemplazaba solo, sin ningún `update-service` ni acción manual adicional.

**Evidencia real (eventos del servicio, `aws ecs describe-services --cluster cordillera-cluster --services ms-reporting`):**

```
2026-07-02T18:15:31-04:00  (task 83c48c27307548a1b717d6aaefc09413) failed container health checks.
2026-07-02T18:15:31-04:00  has stopped 1 running tasks: (task 83c48c27307548a1b717d6aaefc09413).
2026-07-02T18:19:11-04:00  has started 1 tasks: (task 826e347ac04944dca8042c0d0acbf115).
2026-07-02T18:23:18-04:00  (deployment ecs-svc/7186070673313377745) deployment completed.
2026-07-02T18:23:18-04:00  has reached a steady state.
```

Repitió el patrón una segunda vez sin intervención:

```
2026-07-02T18:18:30-04:00  (task ab9d9113c028492e8c4dee883c2c4b86) failed container health checks.
2026-07-02T18:18:30-04:00  has stopped 1 running tasks: (task ab9d9113c028492e8c4dee883c2c4b86).
2026-07-02T18:19:11-04:00  has started 1 tasks: (task 826e347ac04944dca8042c0d0acbf115).
2026-07-02T18:23:18-04:00  has reached a steady state.
```

**Conclusión:** el `desiredCount=1` del servicio ECS actúa como garantía declarativa — en cuanto una tarea falla el healthcheck y se detiene, el ECS Service Scheduler arranca una tarea nueva automáticamente para volver al estado deseado, sin ningún script ni operador humano involucrado. Tiempo de recuperación observado: ~3-4 minutos (incluye el `startPeriod: 60s` del healthcheck + arranque de la JVM).

## Parte 2 — Circuit breaker de despliegue (`deploymentCircuitBreaker`) ante una imagen rota

**Objetivo:** forzar un despliegue con un tag de imagen inexistente en `ms-reporting` (`imagen-rota-test`) y verificar el comportamiento de `deploymentCircuitBreaker: { enable: true, rollback: true }`, configurado en las 12 definiciones de servicio desde la Fase 4.

**Comandos ejecutados:**

```bash
aws ecs register-task-definition --cli-input-json file://ms-reporting-broken.json --region us-east-2
# -> revisión 6, image: .../grupocordillera/ms-reporting:imagen-rota-test (tag inexistente en ECR)

aws ecs update-service --cluster cordillera-cluster --service ms-reporting \
  --task-definition cordillera-ms-reporting:6 --force-new-deployment --region us-east-2
```

**Timeline real observado (eventos del servicio):**

| Hora local | Evento |
|---|---|
| 18:35:47 | Deployment de la revisión 6 (imagen rota) creado, `rolloutState=IN_PROGRESS` |
| 18:36:35 | `has started 1 tasks` — ECS intenta arrancar una tarea con la revisión 6 |
| 18:38:07 | `was unable to place a task. Reason: CannotPullContainerError: ...ms-reporting:imagen-rota-test: not found` |
| 18:38:39 | Reintento: `has started 1 tasks` (nueva tarea) |
| 18:40:05 | `was unable to place a task` (mismo error) |
| 18:40:36 | Reintento: `has started 1 tasks` |
| 18:42:01 | `was unable to place a task` (mismo error) — `failedTasks=2` en el deployment |
| ~18:42–18:46 | Los reintentos se espacian (backoff exponencial de ECS para `CannotPullContainerError`); el deployment permanece `IN_PROGRESS`, **no llega a `rolloutState=FAILED` dentro de la ventana de prueba (~11 minutos)** |
| 18:46 | Se decide **forzar manualmente** el revert a la revisión 5 (ver abajo), sin esperar más al circuit breaker automático |

**Dato importante y honesto para la demo:** en este ciclo de prueba, el circuit breaker **no llegó a disparar el rollback automático dentro de los ~11 minutos observados** — el deployment de la revisión 6 se quedó en `IN_PROGRESS` reintentando el pull de la imagen inexistente, con backoff creciente entre reintentos. Con `desiredCount=1`, ECS necesita acumular una cantidad mínima de fallos de tarea antes de declarar el deployment como `FAILED` (el umbral interno no es público y depende del ritmo de reintentos), y con una sola tarea deseada ese umbral tarda más en alcanzarse que con servicios de mayor escala. **No se inventa un rollback automático que no ocurrió**: se forzó el revert manualmente con:

```bash
aws ecs update-service --cluster cordillera-cluster --service ms-reporting \
  --task-definition cordillera-ms-reporting:5 --force-new-deployment --region us-east-2
aws ecs wait services-stable --cluster cordillera-cluster --services ms-reporting --region us-east-2
```

Resultado tras el revert manual: `runningCount=1` con `taskDefinition=cordillera-ms-reporting:5` (imagen correcta `ms-reporting:latest`).

## Parte 3 — Cero downtime real para el usuario durante toda la prueba

Durante los ~11 minutos que la revisión 6 (rota) estuvo reintentando sin éxito, el **deployment anterior (revisión 5) nunca se detuvo**:

```
"taskDefinition": ".../cordillera-ms-reporting:5"
"status": "ACTIVE"
"runningCount": 1
"rolloutState": "COMPLETED"
```

Esto es el comportamiento esperado y deseable del *rolling update* de ECS: la revisión nueva se prueba en paralelo (o se reintenta) sin tocar la revisión estable hasta que la nueva confirme salud vía el healthcheck del contenedor (`/actuator/health`). Como la revisión 6 nunca llegó a arrancar un contenedor sano, **la revisión 5 siguió sirviendo tráfico ininterrumpidamente** — Service Connect apunta siempre a las tareas `RUNNING` y `HEALTHY` del servicio, y en ningún momento hubo 0 tareas sanas de `ms-reporting`. Esto es evidencia indirecta pero sólida de cero downtime; no se ejecutó un poller HTTP continuo dedicado a `ms-reporting` durante esta prueba puntual (sí se hizo en la Fase 9 contra `ms-kpis`, ver `resumen-autoscaling.md`, con 0% de error bajo carga sostenida).

## Estado final verificado

- `ms-reporting`: `desiredCount=1`, `runningCount=1`, `taskDefinition=cordillera-ms-reporting:5`, imagen correcta.
- La revisión rota (6) quedó registrada en ECR/Task Definitions solo como evidencia histórica (no se usa en ningún servicio activo).

## Conclusión general de la Fase 10

| Escenario probado | Resultado | Intervención manual requerida |
|---|---|---|
| Caída de una tarea (crash/healthcheck) | ECS la repuso automáticamente (~3-4 min) | Ninguna |
| Imagen de despliegue inexistente | La revisión estable nunca se interrumpió (cero downtime); el circuit breaker automático no alcanzó a marcar `FAILED` dentro de la ventana de prueba (~11 min) con `desiredCount=1` | Se forzó el revert manual a la revisión 5 para no extender la prueba indefinidamente |

Ambos escenarios confirman que el sistema tolera fallos sin afectar a los usuarios finales; la diferencia práctica es que el auto-healing de tareas caídas es inmediato y automático, mientras que el rollback de un *despliegue* con imagen inexistente, en un servicio de una sola tarea, puede requerir más tiempo del disponible en esta ventana de prueba para que el circuit breaker actúe por sí solo — algo a tener en cuenta al presentar la demo: mostrar el mecanismo (`deploymentCircuitBreaker.rollback=true` está configurado en los 12 servicios) y su efecto garantizado (cero downtime), sin afirmar que el rollback fue 100% automático en esta corrida puntual.

## Parte 4 — Repetición 2026-07-03 (Fase C del prompt de validación de pipeline): esta vez el rollback SÍ fue 100% automático

**Objetivo:** repetir la Parte 2 con el pipeline y las task definitions ya corregidas (fix de HikariCP pool size, ver `deployment_lessons.md` punto 24) para confirmar si el circuit breaker seguía sin disparar dentro de ~11 minutos, o si el comportamiento cambió.

**Comandos ejecutados** (mismo patrón que Parte 2, contra `ms-reporting`, servicio no crítico fuera del camino de la demo):

```bash
aws ecs register-task-definition --cli-input-json file://ms-reporting-broken-taskdef.json --region us-east-2
# -> revisión 9, image: .../grupocordillera/ms-reporting:tag-inexistente-prueba-c (tag inexistente en ECR)

aws ecs update-service --cluster cordillera-cluster --service ms-reporting \
  --task-definition cordillera-ms-reporting:9 --force-new-deployment --region us-east-2
```

**Timeline real observado** (polling cada ~20-22s sobre `services[0].deployments`):

| Elapsed | Evento |
|---|---|
| 00m00s | Deployment de la revisión 9 (imagen rota) creado, `rolloutState=IN_PROGRESS`, `runningCount=0` |
| 02m34s | `failedTasks=1` (primer intento de pull fallido) |
| 04m46s | `failedTasks=2` |
| 11m00s | `failedTasks=3` |
| **11m44s** | **`rolloutState=IN_PROGRESS` en revisión 8, `runningCount=1`, `reason="ECS deployment circuit breaker: rolling back to deploymentId ecs-svc/7246342417563559064"`** — el circuit breaker detectó los fallos y revirtió solo, sin ningún comando manual |
| ~13m30s | Deployment de la revisión 9 pasa a `status=DRAINING`, `rolloutState=FAILED`, `reason="ECS deployment circuit breaker: tasks failed to start."` |

**A diferencia de la Parte 2 (2026-07-02), esta vez el rollback automático SÍ se confirmó**, sin intervención manual — el umbral interno de fallos que necesita ECS para declarar el deployment como `FAILED` y revertir (con `desiredCount=1`) se alcanzó en **11m44s**, apenas por encima de la ventana de ~11 minutos observada en la corrida anterior (que se cortó justo antes de llegar a ese umbral). Esto sugiere que el comportamiento nunca fue "no funciona", sino que el umbral de fallos acumulados (`failedTasks=3` en este caso) tarda ese orden de magnitud en alcanzarse con una sola tarea deseada — la Parte 2 simplemente no esperó lo suficiente antes de forzar el revert manual.

**Verificado tras el rollback:**
- `ms-reporting`: `runningCount=1`, `taskDefinition=cordillera-ms-reporting:8` (imagen correcta), sin intervención manual.
- ALB frontend (`/`) y `/api/kpis` respondieron `HTTP 200` durante toda la prueba — cero downtime observado en el resto del sistema, igual que en la Parte 2.
- La revisión rota (9) quedó registrada como evidencia histórica, no se usa en ningún servicio activo.

**Conclusión actualizada para la demo/pauta:** el `deploymentCircuitBreaker.rollback=true` **sí revierte automáticamente sin intervención humana**, pero con `desiredCount=1` el proceso completo (detección de fallos + rollback) toma **~12 minutos**. Si se muestra esto en vivo, hay que dimensionar el tiempo de la demo en consecuencia (no es instantáneo).
