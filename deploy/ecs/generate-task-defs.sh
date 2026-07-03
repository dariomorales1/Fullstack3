#!/usr/bin/env bash
# Genera los 12 JSON de task definition para ECS Fargate.
# Uso: ./generate-task-defs.sh   (desde deploy/ecs/)
#
# NOTA IMPORTANTE (2026-07-02): tras un diagnostico extenso, se decidio DESACTIVAR Eureka
# por completo en el entorno ECS (EUREKA_CLIENT_ENABLED=false en los 11 servicios) y usar
# URLs directas de Service Connect en su lugar (ROUTE_*_URI en api-gateway, MS_*_URL en bff).
# Causa: Eureka entraba en un ciclo persistente de "lease doesn't exist / Not Found (Renew)"
# sobre Service Connect que no se logro estabilizar (ver aws-resources-created.md, seccion
# "Diagnostico exhaustivo"). El servicio ECS `eureka-server` ya NO se despliega en ECS
# (queda solo su task definition registrada, sin servicio activo) - EC2 sigue usando Eureka
# sin cambios.
set -euo pipefail

ACCOUNT=215682485633
REGION=us-east-2
REGISTRY=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/grupocordillera
EXEC_ROLE=arn:aws:iam::$ACCOUNT:role/cordilleraEcsTaskExecutionRole
RDS_ENDPOINT=cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com
DB_PASSWORD_ARN=arn:aws:secretsmanager:$REGION:$ACCOUNT:secret:cordillera/db-password-DwMDdj
JWT_SECRET_ARN=arn:aws:secretsmanager:$REGION:$ACCOUNT:secret:cordillera/jwt-secret-9kAe1j
RESEND_KEY_ARN=arn:aws:secretsmanager:$REGION:$ACCOUNT:secret:cordillera/resend-api-key-iiAg5I
DNS_NS=cordillera-dns.local

mkdir -p task-definitions

# $1=service $2=port $3=cpu $4=memory $5=extra_env(json array items) $6=secrets(json array items) $7=healthcheck_path $8=image_tag
gen() {
  local service=$1 port=$2 cpu=$3 memory=$4 extra_env=$5 secrets=$6 hc_path=$7 tag=${8:-latest}
  cat > "task-definitions/${service}.json" << EOF
{
  "family": "cordillera-${service}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "${cpu}",
  "memory": "${memory}",
  "executionRoleArn": "${EXEC_ROLE}",
  "runtimePlatform": { "cpuArchitecture": "X86_64", "operatingSystemFamily": "LINUX" },
  "containerDefinitions": [
    {
      "name": "${service}",
      "image": "${REGISTRY}/${service}:${tag}",
      "essential": true,
      "portMappings": [
        { "containerPort": ${port}, "protocol": "tcp", "name": "${service}-${port}", "appProtocol": "http" }
      ],
      "environment": [
        { "name": "JAVA_OPTS", "value": "-Xmx$((memory * 3 / 4))m -Xms64m" },
        { "name": "EUREKA_CLIENT_ENABLED", "value": "false" }${extra_env}
      ]${secrets},
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cordillera/${service}",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:${port}${hc_path} || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF
  echo "generado: task-definitions/${service}.json"
}

# --- eureka-server (task def se mantiene registrada por si se vuelve a necesitar; el SERVICIO ya no se corre) ---
gen eureka-server 8761 512 1024 '' '' /actuator/health

# --- api-gateway: URIs de ruta apuntan directo a Service Connect, no a lb://<servicio> ---
gen api-gateway 8080 512 1024 ',
        { "name": "ROUTE_BFF_URI", "value": "http://bff.'"$DNS_NS"':8085" },
        { "name": "ROUTE_MS_SALES_URI", "value": "http://ms-sales.'"$DNS_NS"':8081" },
        { "name": "ROUTE_MS_INVENTORY_URI", "value": "http://ms-inventory.'"$DNS_NS"':8082" },
        { "name": "ROUTE_MS_FINANCE_URI", "value": "http://ms-finance.'"$DNS_NS"':8083" },
        { "name": "ROUTE_MS_CUSTOMER_URI", "value": "http://ms-customer.'"$DNS_NS"':8084" },
        { "name": "ROUTE_MS_DATA_INGESTION_URI", "value": "http://ms-data-ingestion.'"$DNS_NS"':8090" },
        { "name": "ROUTE_MS_AUTH_URI", "value": "http://ms-auth.'"$DNS_NS"':8086" },
        { "name": "SPRING_DOCKER_COMPOSE_ENABLED", "value": "false" }' '' /actuator/health

# --- bff: URLs directas a ms-kpis/ms-reporting/ms-data-ingestion via Service Connect ---
gen bff 8085 512 1024 ',
        { "name": "MS_KPIS_URL", "value": "http://ms-kpis.'"$DNS_NS"':8091" },
        { "name": "MS_REPORTING_URL", "value": "http://ms-reporting.'"$DNS_NS"':8092" },
        { "name": "MS_DATA_INGESTION_URL", "value": "http://ms-data-ingestion.'"$DNS_NS"':8090" },
        { "name": "SPRING_DOCKER_COMPOSE_ENABLED", "value": "false" }' '' /actuator/health

# --- ms-auth ---
gen ms-auth 8086 256 512 ',
        { "name": "SPRING_DATASOURCE_URL", "value": "jdbc:postgresql://'"$RDS_ENDPOINT"':5432/db_auth" },
        { "name": "SPRING_DATASOURCE_USERNAME", "value": "cordillera_admin" },
        { "name": "SPRING_FLYWAY_ENABLED", "value": "true" },
        { "name": "SPRING_JPA_HIBERNATE_DDL_AUTO", "value": "update" },
        { "name": "SPRING_DOCKER_COMPOSE_ENABLED", "value": "false" },
        { "name": "RESEND_FROM_EMAIL", "value": "onboarding@resend.dev" },
        { "name": "FRONTEND_URL", "value": "http://cordillera-alb-1476500823.us-east-2.elb.amazonaws.com" }' \
  ',
      "secrets": [
        { "name": "SPRING_DATASOURCE_PASSWORD", "valueFrom": "'"$DB_PASSWORD_ARN"'" },
        { "name": "JWT_SECRET", "valueFrom": "'"$JWT_SECRET_ARN"'" },
        { "name": "RESEND_API_KEY", "valueFrom": "'"$RESEND_KEY_ARN"'" }
      ]' /actuator/health

# --- data-sources (ms-sales, ms-inventory, ms-finance, ms-customer) ---
for pair in "ms-sales:8081:db_sales" "ms-inventory:8082:db_inventory" "ms-finance:8083:db_finance" "ms-customer:8084:db_customer"; do
  IFS=':' read -r svc port db <<< "$pair"
  gen "$svc" "$port" 256 512 ',
        { "name": "SPRING_DATASOURCE_URL", "value": "jdbc:postgresql://'"$RDS_ENDPOINT"':5432/'"$db"'" },
        { "name": "SPRING_DATASOURCE_USERNAME", "value": "cordillera_admin" },
        { "name": "SPRING_FLYWAY_ENABLED", "value": "true" },
        { "name": "SPRING_JPA_HIBERNATE_DDL_AUTO", "value": "update" },
        { "name": "SPRING_DOCKER_COMPOSE_ENABLED", "value": "false" }' \
    ',
      "secrets": [
        { "name": "SPRING_DATASOURCE_PASSWORD", "valueFrom": "'"$DB_PASSWORD_ARN"'" }
      ]' /actuator/health
done

# --- core-intelligence (ms-data-ingestion, ms-kpis, ms-reporting) ---
for pair in "ms-data-ingestion:8090:db_ingestion" "ms-kpis:8091:db_kpis" "ms-reporting:8092:db_reporting"; do
  IFS=':' read -r svc port db <<< "$pair"
  gen "$svc" "$port" 256 512 ',
        { "name": "SPRING_DATASOURCE_URL", "value": "jdbc:postgresql://'"$RDS_ENDPOINT"':5432/'"$db"'" },
        { "name": "SPRING_DATASOURCE_USERNAME", "value": "cordillera_admin" },
        { "name": "SPRING_FLYWAY_ENABLED", "value": "true" },
        { "name": "SPRING_JPA_HIBERNATE_DDL_AUTO", "value": "update" },
        { "name": "SPRING_DOCKER_COMPOSE_ENABLED", "value": "false" }' \
    ',
      "secrets": [
        { "name": "SPRING_DATASOURCE_PASSWORD", "valueFrom": "'"$DB_PASSWORD_ARN"'" }
      ]' /actuator/health
done

# --- frontend (nginx, sin JVM, tag :ecs) ---
cat > "task-definitions/frontend.json" << EOF
{
  "family": "cordillera-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${EXEC_ROLE}",
  "runtimePlatform": { "cpuArchitecture": "X86_64", "operatingSystemFamily": "LINUX" },
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${REGISTRY}/frontend:ecs",
      "essential": true,
      "portMappings": [
        { "containerPort": 80, "protocol": "tcp", "name": "frontend-80", "appProtocol": "http" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cordillera/frontend",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:80/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      }
    }
  ]
}
EOF
echo "generado: task-definitions/frontend.json"

echo "=== 12 task definitions generadas en task-definitions/ ==="
