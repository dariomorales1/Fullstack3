#!/usr/bin/env bash
# Crea los topicos de negocio en el cluster Kafka con 3 particiones y 3 replicas,
# aplicando las politicas de limpieza y retencion de la rubrica.
#
# Uso:  bash infra/kafka/create-topics.sh            (usa el broker p360c-kafka1)
#       bash infra/kafka/create-topics.sh <broker>
set -euo pipefail

BROKER="${1:-p360c-kafka1}"
BS="localhost:29092"   # listener INTERNAL dentro del contenedor

crear() {
  local nombre="$1"; shift
  docker exec "$BROKER" kafka-topics --bootstrap-server "$BS" --create --if-not-exists \
    --topic "$nombre" --partitions 3 --replication-factor 3 "$@"
  echo "  creado/existente: $nombre"
}

echo "=== creando topicos (3 particiones, 3 replicas) ==="
crear orders.events      --config cleanup.policy=delete         --config retention.ms=604800000
crear audit.timeline     --config cleanup.policy=compact,delete --config retention.ms=2592000000
crear orders.events.DLT  --config cleanup.policy=delete         --config retention.ms=1209600000
crear audit.timeline.DLT --config cleanup.policy=delete         --config retention.ms=1209600000

echo "=== detalle de los topicos ==="
for t in orders.events audit.timeline orders.events.DLT audit.timeline.DLT; do
  docker exec "$BROKER" kafka-topics --bootstrap-server "$BS" --describe --topic "$t" | head -1
done
