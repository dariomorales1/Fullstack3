#!/bin/bash
# deploy-all.sh - Script de despliegue manual (Parte B del CI/CD)
# Uso: ./deploy-all.sh <rds-endpoint>
# Requiere: reward.pem en ~/.ssh/, AWS CLI configurado, variables de entorno

set -e

ECR_REGISTRY="215682485633.dkr.ecr.us-east-2.amazonaws.com"
AWS_REGION="us-east-2"
BASTION="3.133.80.5"
EC2_2="10.0.2.107"
EC2_3="10.0.2.118"
EC2_4="10.0.2.1078"
SSH_KEY="~/.ssh/reward.pem"
RDS_ENDPOINT="${1:-cordillera-rds.cfmsu2gu68ai.us-east-2.rds.amazonaws.com}"

if [ -z "$RDS_ENDPOINT" ]; then
  echo "ERROR: Especifica el endpoint RDS: ./deploy-all.sh <rds-endpoint>"
  exit 1
fi

echo "==> Autenticando en ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

ssh_cmd() {
  local host=$1; shift
  ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@$host "$@"
}

ssh_proxy() {
  local host=$1; shift
  ssh -i $SSH_KEY -o StrictHostKeyChecking=no \
    -o ProxyCommand="ssh -i $SSH_KEY -o StrictHostKeyChecking=no -W %h:%p ec2-user@$BASTION" \
    ec2-user@$host "$@"
}

deploy_ec2() {
  local host=$1
  local folder=$2
  local env_vars=$3
  local ssh_fn=$4

  echo "==> Copiando docker-compose a $host..."
  scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    ${ssh_fn:+-o ProxyCommand="ssh -i $SSH_KEY -o StrictHostKeyChecking=no -W %h:%p ec2-user@$BASTION"} \
    deploy/$folder/docker-compose.yml ec2-user@$host:~/docker-compose.yml

  echo "==> Desplegando en $host..."
  local deploy_cmd="
    export ECR_REGISTRY=$ECR_REGISTRY
    $env_vars
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    docker compose pull
    docker compose up -d
    docker compose ps
  "
  if [ "$ssh_fn" = "proxy" ]; then
    ssh_proxy $host "$deploy_cmd"
  else
    ssh_cmd $host "$deploy_cmd"
  fi
}

echo ""
echo "=========================================="
echo " DEPLOY Grupo Cordillera - AWS us-east-2"
echo "=========================================="
echo " EC2-1 (bastion):  $BASTION"
echo " EC2-2 (Eureka):   $EC2_2"
echo " EC2-3 (Core):     $EC2_3"
echo " EC2-4 (Data):     $EC2_4"
echo " RDS:              $RDS_ENDPOINT"
echo "=========================================="

# EC2-2: Eureka + BFF (primero, los demas dependen de Eureka)
deploy_ec2 $EC2_2 "ec2-2" "" "proxy"
echo "==> Esperando que Eureka levante (30s)..."
sleep 30

# EC2-4: Data Sources
deploy_ec2 $EC2_4 "ec2-4" \
  "export RDS_ENDPOINT=$RDS_ENDPOINT; export DB_PASSWORD=${DB_PASSWORD:-Cordillera2026!}" \
  "proxy"

# EC2-3: Core Intelligence
deploy_ec2 $EC2_3 "ec2-3" \
  "export RDS_ENDPOINT=$RDS_ENDPOINT; export DB_PASSWORD=${DB_PASSWORD:-Cordillera2026!}" \
  "proxy"

# EC2-1: Frontend + Gateway + Auth (ultimo, depende de todo)
echo "==> Esperando servicios internos (20s)..."
sleep 20
deploy_ec2 $BASTION "ec2-1" \
  "export RDS_ENDPOINT=$RDS_ENDPOINT; export DB_PASSWORD=${DB_PASSWORD:-Cordillera2026!}; export JWT_SECRET=${JWT_SECRET:-cordillera-secret-key-2026}; export RESEND_API_KEY=${RESEND_API_KEY:-}" \
  ""

echo ""
echo "==> Verificando health checks..."
sleep 15
ssh_cmd $BASTION "curl -sf http://localhost:8080/actuator/health && echo ' Gateway OK'" || echo " Gateway no responde aun"
ssh_proxy $EC2_2 "curl -sf http://localhost:8761/actuator/health && echo ' Eureka OK'" || echo " Eureka no responde aun"

echo ""
echo "Frontend disponible en: http://$BASTION"
echo "Eureka dashboard:       http://$BASTION:8761"
echo "API Gateway:            http://$BASTION:8080"
