# Mapa de Red AWS — Grupo Cordillera
## Región: us-east-2 (Ohio) · Cuenta: 215682485633

```
                              INTERNET
                                 │
                    ┌────────────▼────────────┐
                    │    Internet Gateway      │
                    │   igw-003eb7d09a3f99334  │
                    └────────────┬────────────┘
                                 │
╔════════════════════════════════▼══════════════════════════════════════════╗
║              VPC: cordillera-vpc  (10.0.0.0/16)                          ║
║              vpc-0b9c0a321dc30fa83                                        ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │          SUBRED PÚBLICA — 10.0.1.0/24 — us-east-2a                 │  ║
║  │          subnet-0d026163d43190d68                                   │  ║
║  │          Route Table: 0.0.0.0/0 → IGW                              │  ║
║  │                                                                     │  ║
║  │  ┌──────────────────────────────────────────────────────────────┐  │  ║
║  │  │  EC2-1: cordillera-ec2-1-public    [SG-PUBLIC]               │  │  ║
║  │  │  i-05d008dd7dd644af4 · t3.micro · Amazon Linux 2023          │  │  ║
║  │  │                                                              │  │  ║
║  │  │  IP Privada : 10.0.1.58                                      │  │  ║
║  │  │  IP Pública : 3.133.80.5 ◄── Elastic IP (entrada internet)   │  │  ║
║  │  │                                                              │  │  ║
║  │  │  Servicios Docker:                                           │  │  ║
║  │  │   ├─ frontend     :80    (Nginx + React SPA)                 │  │  ║
║  │  │   ├─ api-gateway  :8080  (Spring Cloud Gateway)              │  │  ║
║  │  │   └─ ms-auth      :8086  (JWT Auth)                          │  │  ║
║  │  │                                                              │  │  ║
║  │  │  Roles adicionales:                                          │  │  ║
║  │  │   ├─ Bastion Host (SSH jump point → EC2 privadas)            │  │  ║
║  │  │   └─ NAT Instance (salida internet para subredes privadas)   │  │  ║
║  │  └──────────────────────────────────────────────────────────────┘  │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                              │  NAT                                       ║
║                   ┌──────────▼──────────────────────────────────────┐    ║
║                   │     Route Table Privada (rtb-03c7217fc4d221f6d) │    ║
║                   │     0.0.0.0/0 → EC2-1 (NAT Instance)            │    ║
║                   └──────────┬──────────────────────────────────────┘    ║
║                              │                                            ║
║  ┌───────────────────────────▼─────────────────────────────────────────┐  ║
║  │          SUBRED PRIVADA — 10.0.2.0/24 — us-east-2a                 │  ║
║  │          subnet-0c37930ff9a14e070                                   │  ║
║  │                                                                     │  ║
║  │  ┌──────────────────────────┐  ┌──────────────────────────────────┐ │  ║
║  │  │ EC2-2 [SG-PRIVATE]       │  │ EC2-3 [SG-PRIVATE]               │ │  ║
║  │  │ cordillera-ec2-2-eureka  │  │ cordillera-ec2-3-core            │ │  ║
║  │  │ i-0ca0519f821489086      │  │ i-03a2918d757fc81bb              │ │  ║
║  │  │ t3.micro · 10.0.2.107    │  │ t3.micro · 10.0.2.118            │ │  ║
║  │  │                          │  │                                  │ │  ║
║  │  │ Servicios Docker:        │  │ Servicios Docker:                │ │  ║
║  │  │  ├─ eureka-server :8761  │  │  ├─ ms-data-ingestion :8090      │ │  ║
║  │  │  └─ bff           :8085  │  │  ├─ ms-kpis          :8091      │ │  ║
║  │  │                          │  │  └─ ms-reporting      :8092      │ │  ║
║  │  └──────────────────────────┘  └──────────────────────────────────┘ │  ║
║  │                                                                     │  ║
║  │  ┌──────────────────────────────────────────────────────────────┐  │  ║
║  │  │ EC2-4 [SG-PRIVATE]                                           │  │  ║
║  │  │ cordillera-ec2-4-datasources                                 │  │  ║
║  │  │ i-0fdd7a0e7d39e6d9f · t3.micro · 10.0.2.100                 │  │  ║
║  │  │                                                              │  │  ║
║  │  │ Servicios Docker:                                            │  │  ║
║  │  │  ├─ ms-sales      :8081                                      │  │  ║
║  │  │  ├─ ms-inventory  :8082                                      │  │  ║
║  │  │  ├─ ms-finance    :8083                                      │  │  ║
║  │  │  └─ ms-customer   :8084                                      │  │  ║
║  │  └──────────────────────────────────────────────────────────────┘  │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │          SUBRED PRIVADA — 10.0.3.0/24 — us-east-2b                 │  ║
║  │          subnet-01ee6cc30cb65eee9  (requerida por RDS multi-AZ)     │  ║
║  │                                                                     │  ║
║  │  ┌──────────────────────────────────────────────────────────────┐  │  ║
║  │  │  RDS PostgreSQL 16 [SG-DATABASE]                             │  │  ║
║  │  │  cordillera-rds · db.t3.micro · us-east-2b                   │  │  ║
║  │  │  cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com    │  │  ║
║  │  │  Puerto: 5432                                                │  │  ║
║  │  │                                                              │  │  ║
║  │  │  Bases de datos lógicas:                                     │  │  ║
║  │  │   ├─ db_auth       ├─ db_ingestion                           │  │  ║
║  │  │   ├─ db_sales      ├─ db_kpis                                │  │  ║
║  │  │   ├─ db_inventory  └─ db_reporting                           │  │  ║
║  │  │   ├─ db_finance                                              │  │  ║
║  │  │   └─ db_customer                                             │  │  ║
║  │  └──────────────────────────────────────────────────────────────┘  │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════════╝

═══════════════════════ SECURITY GROUPS ═══════════════════════════════════

  SG-PUBLIC  (sg-0f02d2dd03261cc21)  →  EC2-1
  ┌──────────────────────────────────────────────────────┐
  │  INBOUND                                             │
  │  TCP :22    desde Mi IP (186.189.96.86/32)  → SSH   │
  │  TCP :22    desde Runner CI/CD (dinámico)    → SSH   │
  │  TCP :80    desde 0.0.0.0/0               → HTTP    │
  │  TCP :443   desde 0.0.0.0/0               → HTTPS   │
  │  TCP :8080  desde 0.0.0.0/0               → Gateway │
  │  TCP :8761  desde 0.0.0.0/0               → Eureka  │
  └──────────────────────────────────────────────────────┘

  SG-PRIVATE  (sg-014a8e82c80fae331)  →  EC2-2, EC2-3, EC2-4
  ┌──────────────────────────────────────────────────────┐
  │  INBOUND                                             │
  │  TCP :22        desde SG-PUBLIC      → SSH bastion   │
  │  TCP :8081-8092 desde SG-PUBLIC      → APIs          │
  │  TCP :8081-8092 desde SG-PRIVATE     → inter-MS      │
  │  TCP :8761      desde SG-PRIVATE     → Eureka        │
  │  TCP :8085      desde SG-PUBLIC      → BFF           │
  └──────────────────────────────────────────────────────┘

  SG-DATABASE  (sg-0835efe9646e1028c)  →  RDS
  ┌──────────────────────────────────────────────────────┐
  │  INBOUND                                             │
  │  TCP :5432  desde SG-PRIVATE  → Microservicios       │
  │  TCP :5432  desde SG-PUBLIC   → EC2-1 (ms-auth)      │
  └──────────────────────────────────────────────────────┘

═══════════════════════ FLUJO DE TRÁFICO ══════════════════════════════════

  Usuario Browser
      │  HTTP/HTTPS
      ▼
  3.133.80.5 (Elastic IP) → EC2-1
      │
      ├─ :80  → Frontend React (Nginx)
      │         └─ /api/* → proxy → api-gateway:8080
      │
      └─ :8080 → API Gateway → Eureka (10.0.2.107:8761)
                     │         └─ descubre servicios por nombre lógico
                     ├─────────────────────────────────────┐
                     ▼                                     ▼
              BFF :8085 (10.0.2.107)             ms-sales  :8081 (10.0.2.100)
              Circuit Breaker                    ms-inventory :8082
                     │                           ms-finance   :8083
                     ▼                           ms-customer  :8084
              ms-kpis    :8091 (10.0.2.118)
              ms-reporting :8092                        │
              ms-ingestion :8090 ─────────────────────── ┘
                     │                                   │
                     └─────────────┬─────────────────────┘
                                   ▼
                          RDS PostgreSQL 16
                    (10.0.3.x — us-east-2b)
                    Puerto 5432 · 8 bases de datos

═══════════════════════ CI/CD EXTERNO ═════════════════════════════════════

  GitHub (dariomorales1/Fullstack3)
      │  push develop
      ▼
  GitHub Actions Runner
      ├─ Build Maven (backend)
      ├─ Build npm (frontend)
      ├─ docker build + push ──→ Amazon ECR
      │                          215682485633.dkr.ecr.us-east-2.amazonaws.com
      │                          grupocordillera/{12 repos}
      │
      └─ SSH → 3.133.80.5 (EC2-1 bastion)
               ProxyJump → EC2-2, EC2-3, EC2-4
               docker compose pull (desde ECR)
               docker compose up -d

═══════════════════════ RESUMEN DE RECURSOS ═══════════════════════════════

  VPC            1  (10.0.0.0/16)
  Subredes       3  (1 pública + 2 privadas)
  IGW            1
  Route Tables   2  (pública → IGW / privada → NAT EC2-1)
  EC2            4  t3.micro · Amazon Linux 2023
  RDS            1  db.t3.micro · PostgreSQL 16
  Elastic IP     1  (3.133.80.5 → EC2-1)
  Security Groups 3 (PUBLIC / PRIVATE / DATABASE)
  ECR Repos      12 (1 por microservicio + frontend)
```

---
*Grupo Cordillera · DSY1106 · us-east-2 (Ohio) · Mayo 2026*
