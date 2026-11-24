# Pedidos360 — Identidad y despliegue en Azure (Fase 7)

Documento de la dimensión *Defensa*: identidad en la nube (IDaaS), API Manager y despliegue.

## 1. Identidad — Microsoft Entra ID (IDaaS) ✅ implementado y verificado

Se creó un **tenant propio** de Microsoft Entra ID (workforce) y una app registration que
cumple el rol de SPA (frontend) y API (backend) con roles por usuario.

| Dato | Valor |
|---|---|
| Tenant (Default Directory) | `felipeulloalive.onmicrosoft.com` |
| **Tenant ID** | `c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f` |
| **App (client) ID** | `cc157a73-9589-4ae6-b3df-08054f33a643` |
| Authority (MSAL) | `https://login.microsoftonline.com/c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f` |
| Issuer (backend) | `https://login.microsoftonline.com/c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f/v2.0` |
| Audience (backend) | `cc157a73-9589-4ae6-b3df-08054f33a643` |
| Scope (SPA → API) | `api://cc157a73-9589-4ae6-b3df-08054f33a643/access_as_user` |
| Redirect URI (SPA) | `http://localhost:4200` |
| Versión de token | v2 (`requestedAccessTokenVersion = 2`) |

**App roles** (claim `roles`): `Admin`, `Operador`, `Cliente`.

**Usuarios de prueba** (la contraseña se comparte aparte, **no** se versiona):

| Usuario | Rol |
|---|---|
| `admin@felipeulloalive.onmicrosoft.com` | Admin |
| `operador@felipeulloalive.onmicrosoft.com` | Operador |
| `cliente@felipeulloalive.onmicrosoft.com` | Cliente |

> Nota: se intentó **Entra External ID (CIAM)**, pero la suscripción *Azure for Students*
> tiene una política que solo permite regiones `chilecentral/brazilsouth/southafricanorth/westus/northcentralus`,
> y CIAM exige la geo `United States` → bloqueado. Se usó un tenant **workforce** (cuenta personal),
> que cumple igual la rúbrica (tenant propio + usuarios + OAuth2/OIDC + MSAL + JWT).

### Verificación realizada (end-to-end, sin navegador)
Con un token real emitido por Azure AD para un usuario con rol Admin, contra `ms-catalog` en modo `oidc`:
- GET sin token → **401**
- GET con token Azure → **200**
- POST (rol Admin) → **201**

## 2. Conexión del sistema con el IDaaS

### Backend (modo `oidc`)
Cada microservicio valida el JWT con el módulo compartido `commons-security`. Variables de entorno:

```
PEDIDOS360_SECURITY_MODE=oidc
PEDIDOS360_SECURITY_ISSUER_URI=https://login.microsoftonline.com/c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f/v2.0
PEDIDOS360_SECURITY_AUDIENCE=cc157a73-9589-4ae6-b3df-08054f33a643
```
(En desarrollo sin Azure se usa `PEDIDOS360_SECURITY_MODE=local` con token HS256 del BFF.)

### Frontend (modo `msal`)
En `frontend/src/app/core/config.ts`: `authMode: 'msal'` con `clientId`, `authority` y `scopes`
ya configurados. Usa `@azure/msal-browser`. Login real "Iniciar sesión con Microsoft".

## 3. API Manager (Azure API Management) — runbook

APIM sí se puede crear en la suscripción Students (regiones permitidas, p. ej. `westus`/`chilecentral`).
Recomendado tier **Consumption** (pago por uso, muy económico).

```bash
az account set --subscription b6f8cd8a-cdd2-44bc-baa6-5f32d7f0248a   # Azure for Students
az provider register -n Microsoft.ApiManagement
az apim create -g rg-pedidos360 -n apim-pedidos360 -l westus \
  --sku-name Consumption --publisher-email <correo> --publisher-name "Pedidos360"
```
Luego:
- Importar cada microservicio como API (`az apim api import` / portal) con su base path (`/api/orders`, etc.).
- Política **validate-jwt** a nivel de API/producto apuntando al mismo tenant:
  - `openid-config url`: `https://login.microsoftonline.com/c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f/v2.0/.well-known/openid-configuration`
  - `audience`: `cc157a73-9589-4ae6-b3df-08054f33a643`
- CORS para `http://localhost:4200` (o el dominio del frontend desplegado).

## 4. Despliegue (EC2 → VM Azure con Docker) — runbook

Equivalente del "EC2 + docker-compose" del caso, en una VM Linux (región permitida):

```bash
az vm create -g rg-pedidos360 -n vm-pedidos360 -l westus \
  --image Ubuntu2204 --size Standard_B2s --admin-username azureuser --generate-ssh-keys
az vm open-port -g rg-pedidos360 -n vm-pedidos360 --port 80,8080-8090,5672,15672,9092
# en la VM: instalar Docker + docker compose, clonar el repo y:
#   docker compose -f infra/docker-compose.yml up -d        # Postgres + RabbitMQ + Kafka + Kafka-UI
#   levantar los microservicios (jars o imágenes) en modo oidc
#   servir el frontend (build Angular) con nginx
```
> Apagar la VM al terminar (`az vm deallocate`) para no consumir crédito.

## 5. Estado

- [x] Identidad (tenant, app, roles, usuarios) + validación JWT end-to-end
- [x] Código backend `oidc` y frontend `msal` conectados al tenant
- [ ] APIM desplegado (runbook arriba)
- [ ] Despliegue en VM (runbook arriba)
