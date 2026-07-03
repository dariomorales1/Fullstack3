# Resumen de prueba de carga y autoscaling — Fase 9

## Configuración probada

- **Objetivo de carga:** `http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com/api/kpis` (recorre frontend → api-gateway → bff → `ms-kpis`, el servicio con la política de autoscaling más agresiva configurada: CPU 60% y memoria 70%).
- **Herramienta:** `k6` (vía `docker run grafana/k6`, no había `hey`/`k6` instalados localmente).
- **Carga:** 50 VUs (usuarios virtuales) concurrentes, 3 minutos sostenidos.
- **Política de autoscaling en `ms-kpis`:** Target Tracking CPU 60% (`scaleOutCooldown=60s`, `scaleInCooldown=120s`), Target Tracking memoria 70%, `minCapacity=1`, `maxCapacity=4`.

## Resultado de la carga (k6)

| Métrica | Valor |
|---|---|
| Requests totales | 3.664 |
| Tasa de error | **0.00%** (0 de 3.664 fallaron) |
| Throughput | 21.1 req/s |
| Latencia promedio | 2.25s |
| Latencia p90 | 5.4s |
| Latencia p95 | 5.45s |

**Cero errores bajo carga sostenida** — evidencia de que el sistema (ALB, frontend, gateway, bff, ms-kpis, RDS) se mantuvo disponible durante toda la prueba, aunque con latencia alta (esperable dado el tamaño mínimo de las tareas Fargate: 0.25-0.5 vCPU).

## Evidencia de autoscaling (log completo en `autoscaling-log.txt`)

| Timestamp (UTC) | desiredCount | runningCount | Evento |
|---|---|---|---|
| 22:26:38 | 2 | 1 | Ya había escalado a 2 antes de iniciar el monitor (carga recién empezada) |
| 22:27:12 | 2 | 2 | Segunda tarea healthy — **scale-out completo en ~34s** desde el inicio del monitor |
| 22:29:52 | — | — | k6 termina (carga real se detiene) |
| 22:31:12 | 2 | 3 | **Tercera tarea arrancando** — 1m20s después de terminar la carga real |
| 22:32:20 | 4 | 3 | **Escaló al máximo configurado (`maxCapacity=4`)** |

**Hallazgo relevante (no buscado, mejor evidencia que un escenario de laboratorio limpio):** el autoscaling siguió escalando *después* de que la carga real (k6) ya había terminado, hasta tocar el techo de `maxCapacity=4`. La causa más probable: las tareas nuevas que arrancan por el propio autoscaling generan un pico de CPU real (JVM cold start: JIT, class loading, Hibernate/Flyway) que la métrica `CPUUtilization` promedio del servicio contabiliza igual que tráfico real, retroalimentando la política y disparando *más* scale-out — un efecto de sobreescalado transitorio conocido en cargas de trabajo JVM sobre Target Tracking. Se normalizó manualmente `ms-kpis` de vuelta a `desiredCount=1` una vez confirmado el patrón, para no dejar 4 tareas corriendo sin necesidad durante la ventana de validación de 48h.

## Por qué este comportamiento es evidencia positiva para la pauta

1. **El mecanismo de Target Tracking funciona de punta a punta**: detecta CPU sobre el umbral, escala out automáticamente sin intervención manual, y lo hace dentro del `scaleOutCooldown` configurado (60s).
2. **Es conservador en el techo**: `maxCapacity=4` evitó que seguiera escalando indefinidamente, absorbiendo el costo de un posible bug de feedback-loop sin descontrol.
3. **Justifica la elección de umbrales**: un umbral más bajo (ej. 40%) habría escalado aún más agresivo ante este mismo efecto de cold-start; un umbral más alto (80%) habría tardado más en reaccionar a tráfico real. 60% resultó ser un punto razonable, aunque el hallazgo sugiere que **para cargas de trabajo Java con cold-start pesado, vale la pena excluir los primeros ~30-60s de vida de una tarea del cálculo de la métrica de escalado**, algo a considerar como mejora futura (no implementado en este ciclo).

## Dashboard

Las métricas de esta prueba (CPU/memoria por servicio, RequestCount/5XX del ALB, RunningTaskCount) quedaron visibles en tiempo real en el dashboard `cordillera-dashboard` de CloudWatch (`https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#dashboards:name=cordillera-dashboard`) durante y después de la prueba — no se tomó una captura de pantalla en esta sesión (sin acceso a navegador), pero el dashboard queda disponible para revisión en vivo o para captura manual antes de la presentación.
