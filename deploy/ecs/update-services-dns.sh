#!/usr/bin/env bash
# Actualiza los 12 servicios ECS: nueva revision de task definition + nuevo namespace DNS de Service Connect.
set -euo pipefail

CLUSTER=cordillera-cluster
REGION=us-east-2
NAMESPACE_ARN="arn:aws:servicediscovery:us-east-2:215682485633:namespace/ns-sp6fvam7cj2qtgfg"

update_backend() {
  local svc=$1 port=$2 portname=$3
  aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$svc" \
    --task-definition "cordillera-$svc" \
    --service-connect-configuration "{\"enabled\":true,\"namespace\":\"$NAMESPACE_ARN\",\"services\":[{\"portName\":\"$portname\",\"discoveryName\":\"$svc\",\"clientAliases\":[{\"port\":$port,\"dnsName\":\"${svc}.cordillera-dns.local\"}]}]}" \
    --force-new-deployment \
    --region "$REGION" \
    --query 'service.{Name:serviceName,Desired:desiredCount}' --output text
}

update_backend eureka-server 8761 eureka-server-8761
update_backend api-gateway 8080 api-gateway-8080
update_backend bff 8085 bff-8085
update_backend ms-auth 8086 ms-auth-8086
update_backend ms-sales 8081 ms-sales-8081
update_backend ms-inventory 8082 ms-inventory-8082
update_backend ms-finance 8083 ms-finance-8083
update_backend ms-customer 8084 ms-customer-8084
update_backend ms-data-ingestion 8090 ms-data-ingestion-8090
update_backend ms-kpis 8091 ms-kpis-8091
update_backend ms-reporting 8092 ms-reporting-8092

aws ecs update-service \
  --cluster "$CLUSTER" \
  --service frontend \
  --task-definition cordillera-frontend \
  --service-connect-configuration "{\"enabled\":true,\"namespace\":\"$NAMESPACE_ARN\",\"services\":[{\"portName\":\"frontend-80\",\"discoveryName\":\"frontend\",\"clientAliases\":[{\"port\":80,\"dnsName\":\"frontend.cordillera-dns.local\"}]}]}" \
  --force-new-deployment \
  --region "$REGION" \
  --query 'service.{Name:serviceName,Desired:desiredCount}' --output text

echo "=== 12 servicios actualizados con namespace DNS ==="
