# API Endpoints — Grupo Cordillera

Documentacion de todos los endpoints REST disponibles en el sistema de microservicios.
El frontend consume estos servicios a traves del **API Gateway** (`localhost:8080`) o directamente al **BFF** (`localhost:8085`).

---

## Tabla de servicios

| Servicio | Puerto local | Base URL |
|---|---|---|
| API Gateway | 8080 | `http://localhost:8080` |
| ms-sales | 8081 | `http://localhost:8081` |
| ms-inventory | 8082 | `http://localhost:8082` |
| ms-finance | 8083 | `http://localhost:8083` |
| ms-customer | 8084 | `http://localhost:8084` |
| bff | 8085 | `http://localhost:8085` |
| ms-auth | 8086 | `http://localhost:8086` |
| ms-data-ingestion | 8090 | `http://localhost:8090` |
| ms-kpis | 8091 | `http://localhost:8091` |
| ms-reporting | 8092 | `http://localhost:8092` |

---

## ms-auth — Autenticacion JWT

> Puerto: **8086** | Base: `/api/auth`
> Los endpoints de login y register son **publicos**. El resto requiere `Authorization: Bearer <token>`.

---

### POST /api/auth/register

Registra un nuevo usuario y retorna un JWT.

**Request:**
```json
{
  "email": "felipe@cordillera.cl",
  "password": "MiClave123",
  "role": "USER"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmZWxpcGUuLi4",
  "email": "felipe@cordillera.cl",
  "role": "USER",
  "expiresIn": 86400000
}
```

**Response 401 (email ya existe):**
```json
{
  "timestamp": "2026-05-06T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "El email ya esta registrado: felipe@cordillera.cl"
}
```

---

### POST /api/auth/login

Autentica un usuario y retorna un JWT.

**Request:**
```json
{
  "email": "admin@cordillera.cl",
  "password": "Admin1234!"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbi4uLi4",
  "email": "admin@cordillera.cl",
  "role": "ADMIN",
  "expiresIn": 86400000
}
```

**Response 401 (credenciales incorrectas):**
```json
{
  "timestamp": "2026-05-06T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Credenciales invalidas"
}
```

---

### POST /api/auth/change-password

Cambia la contrasena del usuario autenticado.
Requiere: `Authorization: Bearer <token>`

**Request:**
```json
{
  "currentPassword": "Admin1234!",
  "newPassword": "NuevaClave2026"
}
```

**Response 200:**
```json
{
  "message": "Contrasena actualizada correctamente"
}
```

---

### GET /api/auth/validate

Verifica que el token es valido y retorna el email del usuario.
Requiere: `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "email": "admin@cordillera.cl",
  "status": "valid"
}
```

---

## ms-sales — Ventas

> Puerto: **8081** | Base: `/api/sales`

---

### GET /api/sales

Retorna todas las ventas.

**Response 200:**
```json
[
  {
    "id": 1,
    "date": "2026-01-15T10:30:00",
    "amount": 150000.00,
    "branchId": 1,
    "customerId": 1,
    "paymentMethod": "DEBITO",
    "status": "COMPLETADA",
    "details": [
      {
        "id": 1,
        "productoId": 1,
        "cantidad": 2,
        "precioUnitario": 50000.00,
        "subtotal": 100000.00
      }
    ]
  }
]
```

---

### GET /api/sales/{id}

Retorna una venta por ID.

**Response 200:**
```json
{
  "id": 1,
  "date": "2026-01-15T10:30:00",
  "amount": 150000.00,
  "branchId": 1,
  "customerId": 1,
  "paymentMethod": "DEBITO",
  "status": "COMPLETADA",
  "details": []
}
```

**Response 404:**
```json
{
  "message": "Sale not found"
}
```

---

### POST /api/sales

Crea una nueva venta.

**Request:**
```json
{
  "date": "2026-05-06T14:00:00",
  "amount": 95000.00,
  "branchId": 2,
  "customerId": 5,
  "paymentMethod": "CREDITO",
  "status": "COMPLETADA",
  "details": [
    {
      "productoId": 3,
      "cantidad": 1,
      "precioUnitario": 95000.00,
      "subtotal": 95000.00
    }
  ]
}
```

**Response 201:**
```json
{
  "id": 11,
  "date": "2026-05-06T14:00:00",
  "amount": 95000.00,
  "branchId": 2,
  "customerId": 5,
  "paymentMethod": "CREDITO",
  "status": "COMPLETADA",
  "details": []
}
```

---

### PUT /api/sales/{id}

Actualiza una venta existente (monto y estado).

**Request:**
```json
{
  "amount": 100000.00,
  "status": "ANULADA"
}
```

**Response 200:**
```json
{
  "id": 1,
  "amount": 100000.00,
  "status": "ANULADA"
}
```

---

### DELETE /api/sales/{id}

Elimina una venta.

**Response 200:**
```json
{
  "message": "Sale deleted successfully"
}
```

---

## ms-inventory — Inventario

> Puerto: **8082** | Base: `/api/inventory`

---

### GET /api/inventory

Retorna todos los productos con su stock.

**Response 200:**
```json
[
  {
    "id": 1,
    "sku": "SKU-001",
    "name": "Laptop HP ProBook",
    "category": "ELECTRONICA",
    "price": 850000.00,
    "active": true,
    "stocks": [
      {
        "id": 1,
        "sucursalId": 1,
        "cantidad": 15,
        "stockMinimo": 3
      }
    ]
  }
]
```

---

### GET /api/inventory/{id}

Retorna un producto por ID.

**Response 200:**
```json
{
  "id": 1,
  "sku": "SKU-001",
  "name": "Laptop HP ProBook",
  "category": "ELECTRONICA",
  "price": 850000.00,
  "active": true,
  "stocks": []
}
```

---

### POST /api/inventory

Crea un nuevo producto.

**Request:**
```json
{
  "sku": "SKU-010",
  "name": "Monitor Samsung 27\"",
  "category": "ELECTRONICA",
  "price": 320000.00,
  "active": true
}
```

**Response 201:**
```json
{
  "id": 10,
  "sku": "SKU-010",
  "name": "Monitor Samsung 27\"",
  "category": "ELECTRONICA",
  "price": 320000.00,
  "active": true,
  "stocks": []
}
```

---

### PUT /api/inventory/{id}

Actualiza un producto existente.

**Request:**
```json
{
  "price": 299000.00,
  "active": true
}
```

**Response 200:**
```json
{
  "id": 10,
  "price": 299000.00,
  "active": true
}
```

---

## ms-finance — Finanzas

> Puerto: **8083** | Base: `/api/finance`

---

### GET /api/finance/movements

Retorna todos los movimientos financieros.

**Response 200:**
```json
[
  {
    "id": 1,
    "type": "INCOME",
    "amount": 500000.00,
    "date": "2026-05-01T09:00:00",
    "branchId": 1,
    "description": "Pago cliente corporativo",
    "category": "VENTA"
  },
  {
    "id": 2,
    "type": "EXPENSE",
    "amount": 120000.00,
    "date": "2026-05-02T11:00:00",
    "branchId": 1,
    "description": "Pago proveedor",
    "category": "COMPRA"
  }
]
```

---

### GET /api/finance/balances

Retorna todos los balances por sucursal y periodo.

**Response 200:**
```json
[
  {
    "id": 1,
    "branchId": 1,
    "period": "2026-Q2",
    "income": 5000000.00,
    "expenses": 3200000.00,
    "profit": 1800000.00
  }
]
```

---

### POST /api/finance/movements

Registra un movimiento financiero. Actualiza automaticamente el balance del periodo.

**Request:**
```json
{
  "type": "INCOME",
  "amount": 350000.00,
  "date": "2026-05-06T10:00:00",
  "branchId": 2,
  "description": "Servicio mensual",
  "category": "SERVICIO"
}
```

**Response 201:**
```json
{
  "id": 15,
  "type": "INCOME",
  "amount": 350000.00,
  "date": "2026-05-06T10:00:00",
  "branchId": 2,
  "description": "Servicio mensual",
  "category": "SERVICIO"
}
```

---

## ms-customer — Clientes

> Puerto: **8084** | Base: `/api/customers`

---

### GET /api/customers

Retorna todos los clientes.

**Response 200:**
```json
[
  {
    "id": 1,
    "rut": "12345678-9",
    "name": "Empresa ABC SpA",
    "email": "contacto@abc.cl",
    "phone": "+56912345678",
    "type": "EMPRESA",
    "contacts": [
      {
        "id": 1,
        "name": "Juan Perez",
        "position": "Gerente",
        "email": "juan@abc.cl"
      }
    ]
  }
]
```

---

### GET /api/customers/{id}

Retorna un cliente por ID.

**Response 200:**
```json
{
  "id": 1,
  "rut": "12345678-9",
  "name": "Empresa ABC SpA",
  "email": "contacto@abc.cl",
  "phone": "+56912345678",
  "type": "EMPRESA",
  "contacts": []
}
```

---

### POST /api/customers

Crea un nuevo cliente.

**Request:**
```json
{
  "rut": "98765432-1",
  "name": "Distribuidora Sur Ltda",
  "email": "ventas@sur.cl",
  "phone": "+56987654321",
  "type": "EMPRESA"
}
```

**Response 201:**
```json
{
  "id": 11,
  "rut": "98765432-1",
  "name": "Distribuidora Sur Ltda",
  "email": "ventas@sur.cl",
  "phone": "+56987654321",
  "type": "EMPRESA",
  "contacts": []
}
```

---

### PUT /api/customers/{id}

Actualiza un cliente existente.

**Request:**
```json
{
  "email": "nuevo@sur.cl",
  "phone": "+56911111111"
}
```

**Response 200:**
```json
{
  "id": 11,
  "email": "nuevo@sur.cl",
  "phone": "+56911111111"
}
```

---

### DELETE /api/customers/{id}

Elimina un cliente.

**Response 204:** Sin contenido

---

## ms-data-ingestion — Ingesta de datos

> Puerto: **8090** | Base: `/api/ingestion`

---

### POST /api/ingestion/run

Ejecuta la ingesta completa consumiendo los 4 Data Sources en paralelo.

**Response 200:**
```json
{
  "executionDate": "2026-05-06T10:15:00",
  "totalRecordsProcessed": 4,
  "totalErrors": 0,
  "sourceResults": [
    {
      "sourceService": "ms-sales",
      "status": "SUCCESS",
      "recordsProcessed": 1,
      "error": null
    },
    {
      "sourceService": "ms-inventory",
      "status": "SUCCESS",
      "recordsProcessed": 1,
      "error": null
    },
    {
      "sourceService": "ms-finance",
      "status": "SUCCESS",
      "recordsProcessed": 1,
      "error": null
    },
    {
      "sourceService": "ms-customer",
      "status": "SUCCESS",
      "recordsProcessed": 1,
      "error": null
    }
  ]
}
```

---

### GET /api/ingestion/status

Retorna el estado de la ultima ingesta ejecutada.

**Response 200:**
```json
{
  "executionDate": "2026-05-06T10:15:00",
  "totalRecordsProcessed": 4,
  "totalErrors": 0,
  "sourceResults": [
    {
      "sourceService": "ms-sales",
      "status": "SUCCESS",
      "recordsProcessed": 1
    }
  ]
}
```

---

### GET /api/ingestion/data/{sourceService}

Retorna los datos ingestados de una fuente especifica.
Valores validos: `ms-sales`, `ms-inventory`, `ms-finance`, `ms-customer`

**Response 200:**
```json
[
  {
    "id": 1,
    "sourceService": "ms-sales",
    "rawData": "[{\"id\":1,\"amount\":150000,\"status\":\"COMPLETADA\"}]",
    "timestamp": "2026-05-06T10:15:00",
    "status": "SUCCESS"
  }
]
```

---

### GET /api/ingestion/logs

Retorna el historial de todas las ingestas.

**Response 200:**
```json
[
  {
    "id": 1,
    "executionDate": "2026-05-06T10:15:00",
    "recordsProcessed": 1,
    "errors": 0,
    "sourceService": "ms-sales",
    "status": "SUCCESS"
  }
]
```

---

## ms-kpis — KPIs

> Puerto: **8091** | Base: `/api/kpis`

---

### GET /api/kpis

Retorna todos los indicadores registrados.

**Response 200:**
```json
[
  {
    "id": 1,
    "codigo": "KPI-001",
    "nombre": "Cumplimiento de ventas mensual",
    "tipo": "PORCENTUAL",
    "unidad": "PORCENTAJE",
    "formula": "(ventas_actual / meta_ventas) * 100"
  },
  {
    "id": 2,
    "codigo": "KPI-002",
    "nombre": "Ventas acumuladas del trimestre",
    "tipo": "ACUMULADO",
    "unidad": "CLP",
    "formula": "SUM(ventas_mensuales)"
  }
]
```

---

### GET /api/kpis/{id}

Retorna un indicador por ID.

**Response 200:**
```json
{
  "id": 1,
  "codigo": "KPI-001",
  "nombre": "Cumplimiento de ventas mensual",
  "tipo": "PORCENTUAL",
  "unidad": "PORCENTAJE",
  "formula": "(ventas_actual / meta_ventas) * 100"
}
```

---

### POST /api/kpis

Crea un nuevo indicador.

**Request:**
```json
{
  "codigo": "KPI-006",
  "nombre": "Tasa de retención de clientes",
  "tipo": "PORCENTUAL",
  "unidad": "PORCENTAJE",
  "formula": "(clientes_activos / clientes_totales) * 100"
}
```

**Response 201:**
```json
{
  "id": 6,
  "codigo": "KPI-006",
  "nombre": "Tasa de retención de clientes",
  "tipo": "PORCENTUAL",
  "unidad": "PORCENTAJE",
  "formula": "(clientes_activos / clientes_totales) * 100"
}
```

---

### POST /api/kpis/calcular

Calcula un KPI a partir de valores manuales.

**Request:**
```json
{
  "indicadorId": 1,
  "periodoId": 3,
  "valores": [850000, 1000000]
}
```

**Response 200:**
```json
{
  "id": 10,
  "indicadorId": 1,
  "indicadorCodigo": "KPI-001",
  "periodoId": 3,
  "valorReal": 85.0000,
  "porcentajeCumplimiento": 85.0000,
  "variacion": 5.0000,
  "tendencia": "ALZA",
  "estado": "EN_RIESGO"
}
```

---

### POST /api/kpis/calcular-desde-ingestion

Calcula un KPI extrayendo valores directamente de los datos ingestados.

**Request:**
```json
{
  "indicadorId": 2,
  "periodoId": 3,
  "sourceService": "ms-sales",
  "campoNumerico": "amount"
}
```

**Response 200:**
```json
{
  "id": 11,
  "indicadorId": 2,
  "indicadorCodigo": "KPI-002",
  "periodoId": 3,
  "valorReal": 2028000.00,
  "porcentajeCumplimiento": 40.5600,
  "variacion": 12.3000,
  "tendencia": "ALZA",
  "estado": "CRITICO"
}
```

---

### GET /api/kpis/{id}/resultado

Retorna el ultimo resultado calculado de un indicador.

**Response 200:**
```json
{
  "id": 10,
  "indicadorId": 1,
  "indicadorCodigo": "KPI-001",
  "periodoId": 3,
  "valorReal": 85.0000,
  "porcentajeCumplimiento": 85.0000,
  "variacion": null,
  "tendencia": null,
  "estado": "EN_RIESGO"
}
```

---

### GET /api/kpis/periodo/{periodoId}

Retorna todos los resultados de un periodo.
Periodos disponibles: 1 (Enero), 2 (Febrero), 3 (Marzo), 4 (Abril)

**Response 200:**
```json
[
  {
    "id": 10,
    "indicadorId": 1,
    "indicadorCodigo": "KPI-001",
    "periodoId": 3,
    "valorReal": 85.0000,
    "porcentajeCumplimiento": 85.0000,
    "variacion": null,
    "tendencia": null,
    "estado": "EN_RIESGO"
  }
]
```

---

## ms-reporting — Reportes

> Puerto: **8092** | Base: `/api/reports`

---

### GET /api/reports

Retorna todos los reportes generados, ordenados por fecha descendente.

**Response 200:**
```json
[
  {
    "id": 1,
    "tipo": "VENTAS_POR_SUCURSAL",
    "titulo": "Reporte seed de ventas por sucursal",
    "fechaGeneracion": "2026-04-01T08:00:00",
    "parametros": "{\"periodo\":\"2026-03\"}",
    "estado": "GENERADO",
    "contenidos": [
      {
        "id": 1,
        "seccion": "totales_por_sucursal",
        "datosJson": "{\"1\":150000,\"2\":320000,\"3\":210000}",
        "orden": 1
      }
    ]
  }
]
```

---

### GET /api/reports/{id}

Retorna un reporte por ID con su contenido completo.

**Response 200:**
```json
{
  "id": 3,
  "tipo": "KPI_MENSUAL",
  "titulo": "Reporte seed KPI mensual",
  "fechaGeneracion": "2026-04-05T09:00:00",
  "parametros": "{\"periodoId\":3}",
  "estado": "GENERADO",
  "contenidos": [
    {
      "id": 5,
      "seccion": "indicadores",
      "datosJson": "[{\"codigo\":\"KPI-001\",\"tipo\":\"PORCENTUAL\"}]",
      "orden": 1
    },
    {
      "id": 6,
      "seccion": "resultados_periodo",
      "datosJson": "[{\"indicadorId\":1,\"valorReal\":80,\"estado\":\"EN_RIESGO\"}]",
      "orden": 2
    }
  ]
}
```

---

### POST /api/reports/generate

Genera un nuevo reporte consumiendo datos reales de ms-data-ingestion y ms-kpis.

Tipos disponibles: `VENTAS_POR_SUCURSAL` | `INVENTARIO_CONSOLIDADO` | `KPI_MENSUAL` | `BALANCE_FINANCIERO`

**Request VENTAS_POR_SUCURSAL:**
```json
{
  "tipo": "VENTAS_POR_SUCURSAL",
  "titulo": "Ventas Mayo 2026",
  "parametros": "{\"periodo\":\"2026-05\"}"
}
```

**Request KPI_MENSUAL:**
```json
{
  "tipo": "KPI_MENSUAL",
  "titulo": "KPIs Periodo 3",
  "parametros": "{\"periodoId\":3}"
}
```

**Request BALANCE_FINANCIERO:**
```json
{
  "tipo": "BALANCE_FINANCIERO",
  "titulo": "Balance Q2 2026",
  "parametros": "{\"trimestre\":\"2026-Q2\"}"
}
```

**Response 201:**
```json
{
  "id": 5,
  "tipo": "VENTAS_POR_SUCURSAL",
  "titulo": "Ventas Mayo 2026",
  "fechaGeneracion": "2026-05-06T10:30:00",
  "parametros": "{\"periodo\":\"2026-05\"}",
  "estado": "GENERADO",
  "contenidos": [
    {
      "id": 9,
      "seccion": "totales_por_sucursal",
      "datosJson": "{\"1\":500000,\"2\":320000}",
      "orden": 1
    }
  ]
}
```

---

### DELETE /api/reports/{id}

Elimina un reporte y su contenido.

**Response 204:** Sin contenido

---

### GET /api/reports/tipo/{tipo}

Filtra reportes por tipo.

**Response 200:**
```json
[
  {
    "id": 1,
    "tipo": "VENTAS_POR_SUCURSAL",
    "titulo": "Reporte seed de ventas por sucursal",
    "fechaGeneracion": "2026-04-01T08:00:00",
    "estado": "GENERADO",
    "contenidos": []
  }
]
```

---

## BFF — Backend For Frontend

> Puerto: **8085** | El frontend consume exclusivamente este servicio.

---

### GET /api/dashboard

Retorna el dashboard consolidado con datos agregados de los 3 MS del Core.
Llama en paralelo a ms-kpis, ms-reporting y ms-data-ingestion.

**Response 200:**
```json
{
  "summary": {
    "totalKpis": 5,
    "kpisCumplidos": 2,
    "kpisEnRiesgo": 2,
    "kpisCriticos": 1,
    "totalReportes": 4,
    "estadoIngestion": "SUCCESS"
  },
  "kpis": [
    {
      "id": 1,
      "codigo": "KPI-001",
      "nombre": "Cumplimiento de ventas mensual",
      "tipo": "PORCENTUAL",
      "unidad": "PORCENTAJE",
      "valorReal": null,
      "valorMeta": null,
      "porcentajeCumplimiento": null,
      "estado": null
    }
  ],
  "reportesRecientes": [
    {
      "id": 1,
      "tipo": "VENTAS_POR_SUCURSAL",
      "titulo": "Reporte seed de ventas por sucursal",
      "estado": "GENERADO"
    }
  ],
  "estadoIngestion": {
    "executionDate": "2026-05-06T10:15:00",
    "totalRecordsProcessed": 4,
    "totalErrors": 0
  },
  "degraded": false,
  "serviciosDegradados": [],
  "generatedAt": "2026-05-06T10:30:00"
}
```

**Response 200 (con servicio caido — degraded):**
```json
{
  "summary": {
    "totalKpis": 0,
    "kpisCumplidos": 0,
    "kpisEnRiesgo": 0,
    "kpisCriticos": 0,
    "totalReportes": 0,
    "estadoIngestion": "DEGRADADO"
  },
  "kpis": [],
  "reportesRecientes": [],
  "estadoIngestion": { "degraded": true },
  "degraded": true,
  "serviciosDegradados": ["ms-kpis", "ms-data-ingestion"],
  "generatedAt": "2026-05-06T10:30:00"
}
```

---

### GET /api/kpis (BFF proxy)

Proxy hacia ms-kpis. Retorna la misma respuesta que `GET /api/kpis` del ms-kpis.

---

### GET /api/reports (BFF proxy)

Proxy hacia ms-reporting. Retorna la misma respuesta que `GET /api/reports`.

---

### GET /api/reports/{id} (BFF proxy)

Proxy hacia ms-reporting. Retorna el reporte con ID especificado.

---

### POST /api/reports/generate (BFF proxy)

Proxy hacia ms-reporting para generar un nuevo reporte.
Mismo body y response que `POST /api/reports/generate` del ms-reporting.

---

## Estados y valores validos

### Estados KPI (`estado`)
| Valor | Condicion |
|---|---|
| `CUMPLIDO` | porcentajeCumplimiento >= 100% |
| `EN_RIESGO` | porcentajeCumplimiento >= umbralAlerta |
| `CRITICO` | porcentajeCumplimiento < umbralAlerta |

### Tendencia KPI (`tendencia`)
| Valor | Condicion |
|---|---|
| `ALZA` | variacion > 0% |
| `BAJA` | variacion < 0% |
| `ESTABLE` | variacion = 0% |

### Tipos de indicador (`tipo`)
`PORCENTUAL` | `ACUMULADO` | `PROMEDIO`

### Tipos de reporte (`tipo`)
`VENTAS_POR_SUCURSAL` | `INVENTARIO_CONSOLIDADO` | `KPI_MENSUAL` | `BALANCE_FINANCIERO`

### Estados de reporte (`estado`)
`EN_PROCESO` | `GENERADO` | `ERROR`

### Roles de usuario (`role`)
`ADMIN` | `USER`

### Usuarios seed disponibles
| Email | Password | Role |
|---|---|---|
| `admin@cordillera.cl` | `Admin1234!` | ADMIN |
| `usuario@cordillera.cl` | `Admin1234!` | USER |
