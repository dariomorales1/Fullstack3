# Evaluación: qué infraestructura AWS actual se reutiliza vs qué se crea nueva para ECS Fargate

> Generado en Fase 0 (2026-07-02). Verificado contra el estado real de AWS (no asumido): `aws ecs list-clusters` confirma que **no existe ningún clúster ECS todavía** — se parte de cero en esa parte. El usuario IAM (`felipe-dev`) tiene `AdministratorAccess` (grupo `admini`), así que no hay restricciones de permisos tipo AWS Academy/LabRole que condicionen el diseño.

## Se reutiliza tal cual (cero cambios)

| Recurso | ID / Valor | Por qué se reutiliza |
|---|---|---|
| VPC | `vpc-0b9c0a321dc30fa83` (`10.0.0.0/16`) | Ya tiene el direccionamiento correcto y las 3 subredes necesarias como base |
| Subred privada 2a | `subnet-0c37930ff9a14e070` | Las tareas Fargate de los 11 microservicios corren aquí, igual que hoy corren los contenedores de EC2-2/3/4 |
| Subred privada 2b | `subnet-01ee6cc30cb65eee9` | Es donde vive RDS; no se toca |
| Subred pública existente | `subnet-0d026163d43190d68` (us-east-2a) | Sirve como una de las 2 subredes públicas que exige el ALB |
| Internet Gateway | `igw-003eb7d09a3f99334` | Sin cambios |
| Route table pública | `rtb-0baa825f3d82e3170` | Se reutiliza; solo hay que asociarle la subred pública nueva (ver abajo) |
| RDS | `cordillera-rds` (PostgreSQL 16, `db.t3.micro`, 20GB, Single-AZ) | **Cero cambios.** Mismo endpoint, mismas 8 bases de datos, mismo usuario `cordillera_admin`. Las tareas ECS solo necesitan poder alcanzar el puerto 5432, que se resuelve agregando el nuevo SG de tareas a la regla de entrada existente. |
| ECR (12 repos) | `215682485633.dkr.ecr.us-east-2.amazonaws.com/grupocordillera/*` | Ya están siendo usados por el pipeline actual; ECS Fargate consume las mismas imágenes sin cambios en la estrategia de build |
| GitHub Secrets de datos | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `RDS_ENDPOINT`, `DB_PASSWORD`, `JWT_SECRET`, `RESEND_API_KEY` | Se siguen usando igual (estos, además, se van a espejar en AWS Secrets Manager para las task definitions — ver Fase 5) |

## Se crea nuevo (no existe hoy)

| Recurso | Por qué no se puede reutilizar | Fase |
|---|---|---|
| Segunda subred pública (us-east-2b) | El ALB exige mínimo 2 AZ públicas; hoy solo existe una (us-east-2a) | Fase 1 |
| `sg-alb` | No existe un SG pensado para un load balancer público hoy — `SG-PUBLIC` (`sg-0f02d2dd03261cc21`) está atado a la instancia EC2-1 (SSH, NAT, puertos de contenedores Docker Compose específicos), mezclar responsabilidades ahí sería confuso y arriesgado de tocar mientras EC2 sigue en producción | Fase 1 |
| `sg-ecs-tasks` | Mismo motivo — `SG-PRIVATE` (`sg-014a8e82c80fae331`) tiene reglas point-to-point pensadas para el modelo bridge de Docker Compose actual (rangos de puerto fijos entre SGs de EC2). Con `awsvpc` cada tarea tiene su propia ENI; es más limpio un SG nuevo específico para tareas ECS | Fase 1 |
| Clúster ECS `cordillera-cluster` | Confirmado con `aws ecs list-clusters` que no existe ninguno | Fase 2 |
| Namespace Cloud Map (`cordillera.local`) | No existe (`aws servicediscovery list-namespaces` da vacío) | Fase 2 |
| 12 Task Definitions | No existen | Fase 3 |
| `ecsTaskExecutionRole` (IAM) | Confirmado con `aws iam list-roles` que no existe ningún rol relacionado a ECS | Fase 3 |
| ALB + Target Groups | No existe ningún ALB en la cuenta | Fase 4 |
| 12 Services ECS | No existen | Fase 4 |
| Secrets en AWS Secrets Manager | Confirmado con `aws secretsmanager list-secrets` que no hay ninguno — hoy los secretos viven solo en GitHub Secrets | Fase 5 |
| Application Auto Scaling (scalable targets + políticas) | No existe | Fase 6 |
| CloudWatch Dashboard + Alarms | No existe (EC2 actual no envía logs/métricas custom a CloudWatch, solo las métricas básicas de instancia) | Fase 8 |

## Regla de seguridad existente que hay que **extender**, no recrear

`sg-0835efe9646e1028c` (SG-DATABASE de RDS) hoy solo permite el puerto 5432 desde `sg-014a8e82c80fae331` (SG-PRIVATE) y `sg-0f02d2dd03261cc21` (SG-PUBLIC). Falta agregar una regla más que permita el nuevo `sg-ecs-tasks` — sin borrar las reglas actuales, porque las EC2 actuales las siguen necesitando mientras coexistan ambos entornos.

## Qué queda obsoleto tras la migración (NO tocar todavía, por instrucción explícita)

Estos recursos dejan de ser necesarios una vez que ECS esté validado end-to-end, pero **se mantienen intactos hasta confirmación explícita**:

- Las 4 instancias EC2 (`cordillera-ec2-1` a `4`) y su Elastic IP.
- `SG-PUBLIC` / `SG-PRIVATE` (quedan sin tráfico de la app, pero no se eliminan mientras EC2 siga corriendo).
- El rol de EC2-1 como bastion SSH y NAT instance manual — **si se decide reemplazar por NAT Gateway administrado** (Fase 2, decisión pendiente de costo), EC2-1 igual podría conservarse solo como bastion SSH de emergencia sin las apps, o eliminarse del todo al final.
- Key pair `cordillera-key` (deja de ser necesaria para SSH a Fargate, pero se mantiene mientras exista alguna EC2).
- Secrets de GitHub relacionados a SSH (`EC2_SSH_KEY`) y los hosts EC2 — el prompt ya indica no borrarlos todavía.

## Impacto en costo mensual estimado (para decidir con el usuario, no es una decisión técnica)

Esta cuenta **no es una sandbox de AWS Academy** (usuario con `AdministratorAccess` permanente, sin señales de `LabRole`), así que el costo es real y continuo, no un crédito de laboratorio con expiración. Orden de magnitud aproximado si se corre ECS **en paralelo** con el EC2 actual durante la validación:

| Ítem | Costo aprox./mes | Nota |
|---|---|---|
| EC2 actual (4× t3.micro + Elastic IP) | ~$28-30 | Ya se está pagando hoy, sin cambios hasta que se decida apagarlo |
| RDS (`db.t3.micro`, Single-AZ) | Ya se está pagando hoy | Sin cambios, se reutiliza igual para ambos entornos a la vez |
| ALB | ~$16-20 base + LCU por tráfico | Nuevo |
| Fargate (12 tareas, mezcla 0.25-0.5 vCPU / 512MB-1GB, `desiredCount=1` cada una, 24/7) | ~$120-140 | Nuevo — significativamente más caro que las 4 EC2 actuales porque son 12 tareas facturadas individualmente en vez de 4 instancias compartiendo contenedores |
| NAT Gateway (si se reemplaza la NAT instance) | ~$32 + $0.045/GB procesado | Opcional — se puede mantener la NAT instance actual (EC2-1) para no sumar este costo, documentando la decisión como pide el prompt |
| Secrets Manager (3 secretos) | ~$1.20 (3 × $0.40) | Nuevo, marginal |
| CloudWatch Logs/Dashboard/Alarms | Marginal (~$1-5 según volumen de logs) | Nuevo |

**Total incremental estimado mientras ambos entornos coexisten: ~$140-165/mes adicionales** sobre lo que ya se paga hoy, mientras dure la validación. Baja a solo el costo de ECS (sin el de EC2) una vez que se apague el entorno EC2 al final de la migración. Recomiendo **acotar el tiempo de coexistencia** (validar rápido y apagar EC2, o directo desmontar ECS después de la demo si el curso no lo requiere permanentemente arriba) para no dejar esto corriendo semanas por descuido.

## Conclusión

No hay nada reciclable "a medias" que valga la pena forzar — la única infraestructura de red/datos realmente compartible entre el modelo EC2 actual y ECS es **VPC + subredes privadas + RDS + ECR + los secrets de GitHub**, y todo eso se reutiliza sin tocar un solo bit. Todo lo demás (SGs de aplicación, cómputo, balanceador, orquestación, autoscaling, observabilidad) se construye nuevo porque el modelo de red de Fargate (`awsvpc`, ENI por tarea) y el mecanismo de despliegue (Task Definitions vs `docker run`/`docker compose`) son fundamentalmente distintos al actual — intentar reusar los Security Groups o la lógica de despliegue actuales generaría más confusión y riesgo que crearlos limpios.
