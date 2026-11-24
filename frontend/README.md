# frontend-pedidos360 (Angular)

SPA del caso Pedidos360. **Angular 22** (standalone) con autorización por rol e integración de identidad.

## Autenticación — dos modos

Configurable en `src/app/core/config.ts` (`authMode`):

- **`local`** (por defecto): login de desarrollo. El frontend pide un token al BFF
  (`/api/auth/dev-token?role=...`) para probar sin Azure. Útil ahora (Fases 1–6).
- **`msal`**: login real con **Azure AD (Entra External ID)** vía `@azure/msal-browser`.
  Se activa en la **Fase 7** completando `msal.*` en `config.ts` y poniendo `authMode: 'msal'`.

El token (JWT) se guarda y un interceptor lo adjunta como `Authorization: Bearer` en cada
llamada. Los roles se leen del claim `roles` y se usan en guards (`roleGuard`) y en la vista.

## Pantallas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | público | Ingreso (rol en local, Microsoft en msal) |
| `/dashboard` | autenticado | Resumen y accesos |
| `/catalog` | autenticado (escritura ADMIN/OPERADOR) | Productos y stock |
| `/orders` | autenticado (crear CLIENTE/OPERADOR, estado OPERADOR/ADMIN) | Pedidos y cambios de estado |
| `/reports` | ADMIN | KPIs en tiempo real |
| `/audit` | ADMIN | Timeline de auditoría |

## Levantar en local

Requiere la infraestructura y los microservicios corriendo (ver README raíz):

```bash
# 1. Infra
docker compose -f infra/docker-compose.yml up -d
# 2. Backend (desde backend/): levantar al menos bff, catalog, orders, report, audit
#    ej: java -jar ms-bff/target/ms-bff-0.0.1-SNAPSHOT.jar   (y cada servicio)
# 3. Frontend (desde frontend/):
npm install
npm start           # ng serve -> http://localhost:4200
```

Abre http://localhost:4200, inicia sesión con un rol y navega.

> Nota: en modo local el BFF expone `/api/auth/dev-token` solo para desarrollo;
> en producción (modo oidc/Azure) ese endpoint no existe y el login es con MSAL.
