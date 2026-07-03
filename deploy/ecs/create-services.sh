#!/usr/bin/env bash
# Crea los 12 servicios ECS (11 backend sin ALB + frontend con ALB).
set -euo pipefail

CLUSTER=cordillera-cluster
REGION=us-east-2
SUBNETS="subnet-0c37930ff9a14e070,subnet-01ee6cc30cb65eee9"
SG=sg-05aaf94b0ea27a976
NAMESPACE_ARN="arn:aws:servicediscovery:us-east-2:215682485633:namespace/ns-sp6fvam7cj2qtgfg"
TG_FRONTEND="arn:aws:elasticloadbalancing:us-east-2:215682485633:targetgroup/cordillera-frontend-tg/11bd0f86c5fefab0"

DEPLOY_CFG='{"maximumPercent":200,"minimumHealthyPercent":100,"deploymentCircuitBreaker":{"enable":true,"rollback":true}}'

# $1=service $2=containerPort $3=portName
create_backend() {
  local svc=$1 port=$2 portname=$3
  aws ecs create-service \
    --cluster "$CLUSTER" \
    --service-name "$svc" \
    --task-definition "cordillera-$svc" \
    --desired-count 1 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=DISABLED}" \
    --deployment-configuration "$DEPLOY_CFG" \
    --health-check-grace-period-seconds 60 \
    --service-connect-configuration "{\"enabled\":true,\"namespace\":\"$NAMESPACE_ARN\",\"services\":[{\"portName\":\"$portname\",\"discoveryName\":\"$svc\",\"clientAliases\":[{\"port\":$port,\"dnsName\":\"${svc}.cordillera-dns.local\"}]}]}" \
    --region "$REGION" \
    --query 'service.{Name:serviceName,Status:status}' --output text
}

echo "=== eureka-server ==="
create_backend eureka-server 8761 eureka-server-8761

echo "=== api-gateway ==="
create_backend api-gateway 8080 api-gateway-8080

echo "=== bff ==="
create_backend bff 8085 bff-8085

echo "=== ms-auth ==="
create_backend ms-auth 8086 ms-auth-8086

echo "=== ms-sales ==="
create_backend ms-sales 8081 ms-sales-8081

echo "=== ms-inventory ==="
create_backend ms-inventory 8082 ms-inventory-8082

echo "=== ms-finance ==="
create_backend ms-finance 8083 ms-finance-8083

echo "=== ms-customer ==="
create_backend ms-customer 8084 ms-customer-8084

echo "=== ms-data-ingestion ==="
create_backend ms-data-ingestion 8090 ms-data-ingestion-8090

echo "=== ms-kpis ==="
create_backend ms-kpis 8091 ms-kpis-8091

echo "=== ms-reporting ==="
create_backend ms-reporting 8092 ms-reporting-8092

echo "=== frontend (con ALB) ==="
aws ecs create-service \
  --cluster "$CLUSTER" \
  --service-name frontend \
  --task-definition cordillera-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --deployment-configuration "$DEPLOY_CFG" \
  --health-check-grace-period-seconds 60 \
  --load-balancers "targetGroupArn=$TG_FRONTEND,containerName=frontend,containerPort=80" \
  --service-connect-configuration "{\"enabled\":true,\"namespace\":\"$NAMESPACE_ARN\",\"services\":[{\"portName\":\"frontend-80\",\"discoveryName\":\"frontend\",\"clientAliases\":[{\"port\":80,\"dnsName\":\"frontend.cordillera-dns.local\"}]}]}" \
  --region "$REGION" \
  --query 'service.{Name:serviceName,Status:status}' --output text

echo "=== 12 servicios creados ==="
