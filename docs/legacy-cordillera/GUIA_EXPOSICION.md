# Guía de exposición — Criterios de evaluación (API Management + IDaaS)

> Para cada criterio: **qué mostrar exactamente en vivo** (con nombres reales de los recursos) y **cómo explicarlo
> oralmente**. Ver [`INFORME_PROYECTO.md`](./INFORME_PROYECTO.md) para el detalle técnico completo de respaldo.

Datos que vas a usar todo el rato — tenlos a mano o en una pestaña aparte:

- Resource Group: `rg-cordillera`
- API Management: `apim-cordillera` → `https://apim-cordillera.azure-api.net`
- API dentro de APIM: `cordillera-bff` (path `/api`), apunta al backend en `http://74.235.99.148:8080/api`
- Tenant Entra ID: `felipeulloalive.onmicrosoft.com` (`c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f`)
- App registrations: `Cordillera-API` (`6265fd5c-...`) y `Cordillera-SPA` (`13b7c04e-...`)
- Frontend en vivo: `https://agreeable-wave-0e10dc60f.2.azurestaticapps.net`
- VM backend: `vm-cordillera-backend` (IP `74.235.99.148`)

---

## 1. Instancia de API Manager en funcionamiento

**Qué mostrar:** Azure Portal → `rg-cordillera` → `apim-cordillera` → *Overview*. Se ve el estado (`Online`), el
tier (**Consumption**) y el *Gateway URL* (`https://apim-cordillera.azure-api.net`).

Alternativa por consola (más contundente en vivo, demuestra que no es solo una captura):

```bash
az apim show -g rg-cordillera -n apim-cordillera --query "{estado:provisioningState, tier:sku.name, url:gatewayUrl}"
```

**Cómo explicarlo:** "Este es el API Manager de Azure, el punto de entrada único de todo el backend. Elegimos el
tier **Consumption** porque es serverless — se paga por llamada, sin infraestructura fija que administrar, ideal
para una plataforma con tráfico variable como esta. Todo el tráfico del frontend hacia el backend pasa por acá
antes de llegar a cualquier microservicio."

## 2. Configuración que permite llamar a los endpoints del backend

**Qué mostrar:** dentro de `apim-cordillera` → *APIs* → **Cordillera BFF** (`cordillera-bff`, path `/api`):

- Pestaña *Design*: lista de operaciones expuestas (`GET /dashboard`, `GET /sales`, `GET /customers`, etc.)
- Pestaña *Settings*: **Web service URL** → `http://74.235.99.148:8080/api` (el API Gateway interno, dentro de la
  VM). Esto muestra que APIM actúa como *reverse proxy* hacia el backend real.
- Pestaña *Design* → seleccionar cualquier operación → *Policy code editor*: mostrar el XML con `validate-jwt` y
  `cors` (está documentado completo en `INFORME_PROYECTO.md`, sección 5.2).

**Cómo explicarlo:** "Acá configuramos qué endpoints expone API Management y hacia dónde los reenvía — en este
caso, al API Gateway de Spring Cloud que corre en nuestra VM, puerto 8080. Además, cada operación lleva una policy
que se ejecuta *antes* de reenviar la petición: valida el JWT y aplica las reglas de CORS."

## 3. El frontend consume los endpoints a través del API Manager

**Qué mostrar:** abrir `https://agreeable-wave-0e10dc60f.2.azurestaticapps.net` en el navegador, iniciar sesión,
abrir **DevTools → Network** *antes* de navegar al dashboard, y navegar a Dashboard/Ventas/Clientes. Filtrar por
`apim-cordillera.azure-api.net` y mostrar:

- La URL real de cada request: `https://apim-cordillera.azure-api.net/api/dashboard`, `/api/sales`, etc.
- Status `200 OK` y el JSON de respuesta con datos reales.
- El header `Authorization: Bearer ...` en la request (pestaña *Headers*).

**Cómo explicarlo:** "El frontend nunca le habla directo al backend — todas las llamadas van a
`apim-cordillera.azure-api.net`. Acá en la pestaña Network se ve en tiempo real cómo cada request al dashboard,
ventas y clientes pasa por API Management antes de llegar a los microservicios."

## 4. API Manager valida JWT — rechaza inválidas, acepta correctas

**Qué mostrar:** tres llamadas en vivo desde una terminal, una tras otra, contra la misma URL de APIM:

```bash
# 1) Sin token -> 401
curl -i https://apim-cordillera.azure-api.net/api/sales

# 2) Token inválido/con firma alterada -> 401
curl -i -H "Authorization: Bearer token.invalido.aqui" https://apim-cordillera.azure-api.net/api/sales

# 3) Token real obtenido de una sesión activa (copiado desde DevTools -> Application -> Session Storage,
#    o desde el header Authorization de una request real) -> 200
curl -i -H "Authorization: Bearer <token real copiado del navegador>" https://apim-cordillera.azure-api.net/api/sales
```

Mostrar las tres respuestas una junto a la otra: los dos primeros casos devuelven `401 Unauthorized` sin llegar
nunca al backend; el tercero devuelve `200 OK` con datos.

**Cómo explicarlo:** "Esto demuestra la policy `validate-jwt` en acción: sin token, la petición ni siquiera llega
al backend — se rechaza en el borde. Con un token inválido, mismo resultado. Solo cuando el token es real, firmado
por Microsoft Entra ID, con la audiencia y el emisor correctos, y no está vencido, API Management lo deja pasar."

## 5. Creación del tenant en IDaaS y usuarios registrados

**Qué mostrar:** Azure Portal → **Microsoft Entra ID** → *Overview*: nombre del tenant
(`felipeulloalive.onmicrosoft.com`), Tenant ID (`c1d011a7-dcb8-4f4f-b4e4-2ca67388b40f`).

Luego:

- **App registrations** → mostrar `Cordillera-API` y `Cordillera-SPA` (las dos apps registradas).
- **Enterprise applications** → `Cordillera-API` → **Users and groups**: se ven los 4 usuarios con rol `ADMIN`
  asignado (uno interno + tres invitados externos `@duocuc.cl`).
- Opcional: **Users** (general) → mostrar que los invitados externos aparecen con `User type: Guest`.

**Cómo explicarlo:** "Este es nuestro Identity Provider — Microsoft Entra ID, el IDaaS de Azure. Acá se ve el
tenant creado, y las dos aplicaciones registradas: una para la API (el backend) y otra para el SPA (el frontend).
En 'Enterprise applications' se ven los usuarios reales que tienen acceso al sistema, cada uno con su rol asignado
— en este caso todos como ADMIN, incluyendo compañeros invitados como usuarios externos (B2B guest)."

## 6. El frontend usa OAuth 2.0 / OpenID Connect para iniciar sesión y obtener un JWT válido

**Qué mostrar, en vivo, paso a paso:**

1. Cerrar sesión si hay una activa. Ir a la landing (`/login`) y hacer clic en el botón de login.
2. **Mientras redirige**, señalar la barra de direcciones: el navegador va a
   `login.microsoftonline.com/c1d011a7-.../oauth2/v2.0/authorize` — es el dominio real de Microsoft, no una
   pantalla propia. Esto prueba que la autenticación la hace Entra ID, no la aplicación.
3. Iniciar sesión con un usuario real (uno de los cuatro con rol asignado).
4. Ya en el dashboard, abrir DevTools → Application → Session Storage → dominio de la app: se ven las entradas
   `msal.*` que MSAL guarda tras el login (id token, access token cacheados).
5. Copiar el `access_token` y pegarlo en https://jwt.ms (herramienta oficial de Microsoft para decodificar JWT) o
   mostrarlo ya decodificado: señalar los claims `iss`, `aud`, `roles`, `scp`, `exp`.

**Cómo explicarlo:** "Cuando el usuario hace clic en 'Iniciar sesión', la SPA no le pide usuario y contraseña
directamente — lo redirige a Microsoft Entra ID usando el flujo estándar OAuth 2.0 **Authorization Code con
PKCE**. La app nunca ve la contraseña. Al volver, MSAL obtiene un `id_token` (identidad) y luego, en segundo
plano, un `access_token` específico para nuestra API, con los claims `roles` y `scp` que el backend usa para
autorizar. Esto es OpenID Connect operando sobre OAuth 2.0."

## 7. Backend y frontend desplegados, activos e integrados en la nube

**Qué mostrar, encadenado:**

1. Azure Portal → `rg-cordillera`: los 4 recursos (`vm-cordillera-backend`, `cordillera-pg-flex`,
   `apim-cordillera`, `swa-cordillera`) en estado activo/running.
2. Terminal, SSH a la VM y `docker ps`: los 11 contenedores del backend corriendo.
   ```bash
   ssh -i ~/.ssh/cordillera-vm azureuser@74.235.99.148 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
   ```
3. Abrir `http://74.235.99.148:8761` (Eureka) — opcional si el puerto está accesible desde tu red — mostrando los
   servicios registrados.
4. Abrir el frontend real (`https://agreeable-wave-....azurestaticapps.net`), hacer login y navegar por
   Dashboard/Ventas/Clientes con datos reales viniendo de PostgreSQL en Azure — cerrando el círculo: frontend en
   la nube → API Management → backend en la nube → base de datos en la nube.

**Cómo explicarlo:** "Acá se ve todo el sistema corriendo en Azure, no en local: el frontend está en Static Web
Apps, el backend en una VM con 11 contenedores Docker, la base de datos en un PostgreSQL administrado, y todo se
integra a través de API Management. La demo completa de login y navegación que acabamos de hacer prueba que estos
cuatro componentes están efectivamente conectados entre sí, no solo desplegados por separado."

---

## Guion sugerido de cierre

"En resumen: reemplazamos la autenticación casera por un IDaaS real (Microsoft Entra ID) usando el estándar
OAuth 2.0/OpenID Connect; centralizamos el acceso al backend en Azure API Management, que valida el JWT en el
borde antes de que cualquier request llegue a los microservicios; y desplegamos todo — frontend, backend y base de
datos — en infraestructura Azure activa e integrada de punta a punta."
