#!/bin/bash
set -euo pipefail

# Deploy a new Buzzle CRM image on the production VPS.
# Usage:  ./deploy-crm-image.sh <image-tag>
# Example: ./deploy-crm-image.sh ghcr.io/agence-buzzle/crm-full:v1.1.1-s2

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <full-image-tag>" >&2
  exit 2
fi

IMAGE="$1"
COMPOSE_FILE="/opt/twenty/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 3
fi

CURRENT=$(sudo grep -m1 -E 'image: ' "$COMPOSE_FILE" | awk '{print $2}')
echo "Current image: $CURRENT"
echo "Target image:  $IMAGE"

# Pre-flight: pull first, if fails don't touch compose file
echo "Pulling $IMAGE..."
sudo docker pull "$IMAGE"

# Backup compose file
sudo cp "$COMPOSE_FILE" "$COMPOSE_FILE.bak.$(date +%s)"

# Swap image
sudo sed -i "s|image: ${CURRENT}|image: ${IMAGE}|g" "$COMPOSE_FILE"

# Restart server + worker only (leave db + redis)
echo "Restarting server + worker..."
sudo docker compose -f "$COMPOSE_FILE" up -d --force-recreate server worker

# Wait for healthy
echo -n "Waiting for server healthy..."
timeout=180
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if sudo docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | grep -q 'twenty-server-1.*healthy'; then
    echo " OK"
    break
  fi
  echo -n "."
  sleep 3
  elapsed=$((elapsed + 3))
done

if [ $elapsed -ge $timeout ]; then
  echo ""
  echo "Timed out waiting for healthy. Rolling back to $CURRENT."
  sudo sed -i "s|image: ${IMAGE}|image: ${CURRENT}|g" "$COMPOSE_FILE"
  sudo docker compose -f "$COMPOSE_FILE" up -d --force-recreate server worker
  exit 4
fi

# Public URL check
if curl -sSL -o /dev/null -w '%{http_code}' https://crm.agence-buzzle.com/healthz --max-time 10 | grep -q '200'; then
  echo "Deploy successful: $IMAGE live"
else
  echo "Health check failed at public URL. Rolling back."
  sudo sed -i "s|image: ${IMAGE}|image: ${CURRENT}|g" "$COMPOSE_FILE"
  sudo docker compose -f "$COMPOSE_FILE" up -d --force-recreate server worker
  exit 5
fi
