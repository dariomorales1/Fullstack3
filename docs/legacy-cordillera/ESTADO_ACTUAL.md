# Estado actual del proyecto — Grupo Cordillera

> Snapshot generado el 2026-09-21. Refleja el repositorio tras separar frontend/backend en carpetas raíz y eliminar la configuración de despliegue no local.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 3.5.6 · Spring Cloud |
| Base de datos | PostgreSQL 16 |
| Service registry | Eureka Server |
| API Gateway | Spring Cloud Gateway |
| Frontend | React 19 · Vite · Tailwind CSS |
| Tests backend | JUnit 5 · Mockito · JaCoCo |
| Tests frontend | Vitest · Testing Library · jsdom |
| Orquestación local | Docker Compose |

## Estructura del repositorio

```
.
├── backend/                       # Microservicios Java (monorepo Maven)
│   ├── infraestructure/
│   │   ├── eureka-server/         # Registro de servicios       :8761
│   │   ├── api-gateway/           # Punto de entrada único      :8080
│   │   ├── ms-auth/               # Autenticación JWT           :8086
│   │   └── bff/                   # Backend for Frontend        :8085
│   ├── core-intelligence/
│   │   ├── ms-data-ingestion/     # Ingesta de datos            :8090
│   │   ├── ms-kpis/               # Indicadores y resultados    :8091
│   │   └── ms-reporting/          # Generación de informes      :8092
│   ├── data-sources/
│   │   ├── ms-sales/              # Ventas                      :8081
│   │   ├── ms-inventory/          # Inventario                  :8082
│   │   ├── ms-finance/            # Finanzas                    :8083
│   │   └── ms-customer/           # Clientes                    :8084
│   ├── pom.xml                    # POM raíz (agrega los 3 módulos padre)
│   ├── init-databases.sql
│   ├── BACKEND_SPEC.md
│   └── DIAGRAMA_COMPONENTES.md
│
├── frontend/                      # SPA React (Vite)             :5173
│   └── src/
│       ├── api/                   # authApi, customersApi, salesApi, kpisApi, reportsApi, dashboardApi
│       ├── components/
│       ├── context/                # AuthContext
│       ├── hooks/                  # useCustomers, useSales, useKpis, useReports
│       ├── pages/
│       ├── router/                 # ProtectedRoute
│       └── utils/                  # formatters
│
├── docker-compose.yml             # Orquestación local (Postgres + 11 microservicios)
├── .env.example                   # Plantilla de variables (RESEND_API_KEY, JWT_SECRET, FRONTEND_URL)
├── .github/workflows/ci-cd.yml    # CI: build+test backend y frontend
└── README.md
```

## Puertos de los servicios

| Servicio | Puerto |
|---|---|
| Eureka Server | 8761 |
| API Gateway | 8080 |
| ms-auth | 8086 |
| BFF | 8085 |
| ms-sales | 8081 |
| ms-inventory | 8082 |
| ms-finance | 8083 |
| ms-customer | 8084 |
| ms-data-ingestion | 8090 |
| ms-kpis | 8091 |
| ms-reporting | 8092 |
| Frontend (dev) | 5173 |

## Tests

- **Backend**: cobertura JaCoCo — `ms-kpis` 74%, `ms-reporting` >60%.
- **Frontend**: 74 tests, cobertura 84% statements / 88% lines. Cubre utils, capas API, hooks, contexto de auth, componentes (`KpiCard`, `StatusBadge`) y router (`ProtectedRoute`).

## Cambios recientes (esta sesión)

1. **Separación frontend/backend**: se movió todo lo que antes vivía bajo `cordillera/` a `backend/` (microservicios Java) y `frontend/` (SPA React), ambos como carpetas de primer nivel. Se preservó el historial de git con `git mv`.
2. **Limpieza de restos**: se eliminó un `package.json`/`package-lock.json`/`node_modules` sueltos que estaban commiteados por error en `cordillera/frontend/` (no correspondían a la app real, que vivía en `cordillera/frontend/grupoCordillera/`).
3. **Eliminación de despliegue no local**:
   - Carpeta `deploy/` completa (docker-compose para 4 instancias EC2 + `deploy-all.sh` con IPs, endpoint RDS y llave SSH hardcodeados).
   - Jobs `push-images` (build+push a ECR) y `deploy` (SSH a EC2) del workflow de GitHub Actions. El pipeline ahora solo compila y testea backend y frontend.
   - Se mantiene `.env.example` (plantilla sin secretos, ya excluida vía `.gitignore`).
4. **Actualización de rutas**: `docker-compose.yml` raíz, `README.md` y `backend/BACKEND_SPEC.md` ajustados a la nueva estructura `backend/` / `frontend/`.

> Nota: estos cambios están en el working tree del repo (staged), **aún no commiteados**. Falta verificar que `mvn clean install` y `npm run build`/`npm test` sigan pasando tras el movimiento.

## Pendientes / siguientes pasos sugeridos

- [ ] Confirmar build de Maven desde `backend/` (`./mvnw clean package`).
- [ ] Confirmar `npm install && npm run build` y `npm test` desde `frontend/`.
- [ ] Levantar `docker-compose.yml` raíz y validar que todos los servicios registren en Eureka correctamente con los nuevos contexts de build.
- [ ] Commitear la reestructuración una vez validado lo anterior.
