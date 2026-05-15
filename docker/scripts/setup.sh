#!/usr/bin/env bash
# Invyte — First-Run Setup Script
# Prepares the environment, creates MinIO bucket, runs DB migrations.
# Usage: ./docker/scripts/setup.sh

set -euo pipefail

COMPOSE_FILE="$(dirname "$0")/../docker-compose.yml"
ROOT_DIR="$(dirname "$0")/../.."
ENV_FILE="${ROOT_DIR}/.env"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       Invyte — First-Run Setup           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Check .env ───────────────────────────────────────────────
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "  .env not found. Copying from .env.example..."
  cp "${ROOT_DIR}/.env.example" "${ENV_FILE}"
  echo ""
  echo "  ┌─────────────────────────────────────────────────┐"
  echo "  │ ACTION REQUIRED                                 │"
  echo "  │ Edit .env and fill in real secrets before       │"
  echo "  │ starting Invyte in production.                  │"
  echo "  │                                                 │"
  echo "  │ Key fields:                                     │"
  echo "  │   BETTER_AUTH_SECRET  (run: openssl rand -b64 32) │"
  echo "  │   POSTGRES_PASSWORD                             │"
  echo "  │   MINIO_ROOT_PASSWORD                           │"
  echo "  │   APP_URL / APP_DOMAIN                         │"
  echo "  └─────────────────────────────────────────────────┘"
  echo ""
  read -r -p "  Press Enter after editing .env, or Ctrl-C to abort..."
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

# ── Start infrastructure services ───────────────────────────
echo ""
echo "  Starting infrastructure services (postgres, redis, minio)..."
docker compose -f "${COMPOSE_FILE}" up -d postgres redis minio

echo "  Waiting for services to be healthy..."
for service in postgres redis minio; do
  echo -n "    ${service}..."
  for i in $(seq 1 30); do
    status=$(docker compose -f "${COMPOSE_FILE}" ps --format json "${service}" 2>/dev/null \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    if [[ "${status}" == "healthy" ]]; then
      echo " ready"
      break
    fi
    if [[ "${i}" -eq 30 ]]; then
      echo " TIMEOUT — check logs with: docker compose logs ${service}"
      exit 1
    fi
    sleep 2
  done
done

# ── Create MinIO bucket ──────────────────────────────────────
BUCKET="${STORAGE_BUCKET:-invyte}"
echo ""
echo "  Creating MinIO bucket: ${BUCKET}"
docker compose -f "${COMPOSE_FILE}" exec minio \
  sh -c "mc alias set local http://localhost:9000 \"\${MINIO_ROOT_USER}\" \"\${MINIO_ROOT_PASSWORD}\" --quiet \
    && (mc ls local/${BUCKET} > /dev/null 2>&1 && echo '    Bucket already exists.') \
    || (mc mb local/${BUCKET} --quiet && mc anonymous set download local/${BUCKET} --quiet && echo '    Bucket created.')"

# ── Run database migrations ──────────────────────────────────
echo ""
echo "  Running database migrations..."
(cd "${ROOT_DIR}" && pnpm --filter @invyte/db db:migrate) || {
  echo "  ERROR: Migration failed. Check DATABASE_URL in .env."
  exit 1
}
echo "  Migrations applied."

# ── Start remaining services ─────────────────────────────────
echo ""
echo "  Starting web and caddy..."
docker compose -f "${COMPOSE_FILE}" up -d

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           Setup Complete! 🎉             ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  App URL:   ${APP_URL:-http://localhost}"
echo ""
echo "  Useful commands:"
echo "    docker compose -f docker/docker-compose.yml logs -f web"
echo "    docker compose -f docker/docker-compose.yml ps"
echo "    ./docker/scripts/backup.sh"
echo ""
