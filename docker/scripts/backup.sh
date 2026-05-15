#!/usr/bin/env bash
# Invyte — Backup Script
# Creates timestamped backups of PostgreSQL and MinIO data.
# Usage: ./docker/scripts/backup.sh [output-dir]
#
# Recommended cron (daily at 2 AM):
#   0 2 * * * /path/to/invyte/docker/scripts/backup.sh /backups >> /var/log/invyte-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
COMPOSE_FILE="$(dirname "$0")/../docker-compose.yml"

# Load .env if present
if [[ -f "$(dirname "$0")/../../.env" ]]; then
  # shellcheck disable=SC1091
  source "$(dirname "$0")/../../.env"
fi

POSTGRES_USER="${POSTGRES_USER:-invyte}"
POSTGRES_DB="${POSTGRES_DB:-invyte}"

mkdir -p "${BACKUP_DIR}"

echo "[${TIMESTAMP}] Starting Invyte backup..."

# ── PostgreSQL dump ──────────────────────────────────────────
PG_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"
echo "  Dumping PostgreSQL → ${PG_FILE}"
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" \
  | gzip > "${PG_FILE}"
echo "  PostgreSQL backup: $(du -sh "${PG_FILE}" | cut -f1)"

# ── MinIO sync ───────────────────────────────────────────────
MINIO_DIR="${BACKUP_DIR}/minio_${TIMESTAMP}"
echo "  Syncing MinIO data → ${MINIO_DIR}"
mkdir -p "${MINIO_DIR}"
docker compose -f "${COMPOSE_FILE}" exec -T minio \
  sh -c "mc alias set local http://localhost:9000 \"\${MINIO_ROOT_USER}\" \"\${MINIO_ROOT_PASSWORD}\" --quiet && mc mirror local/ /tmp/minio_mirror --quiet" 2>/dev/null || true
# Copy from container
docker compose -f "${COMPOSE_FILE}" exec -T minio \
  sh -c "tar -czf /tmp/minio_backup.tar.gz /data 2>/dev/null" || true
docker compose -f "${COMPOSE_FILE}" cp minio:/tmp/minio_backup.tar.gz "${MINIO_DIR}/minio_data.tar.gz" 2>/dev/null || \
  echo "  Warning: MinIO backup skipped (container may not support cp). Use volume backup instead."

# ── Cleanup old backups (keep last 14 days) ──────────────────
echo "  Removing backups older than 14 days..."
find "${BACKUP_DIR}" -name "postgres_*.sql.gz" -mtime +14 -delete 2>/dev/null || true
find "${BACKUP_DIR}" -name "minio_*" -mtime +14 -exec rm -rf {} + 2>/dev/null || true

echo "[$(date +"%Y%m%d_%H%M%S")] Backup complete. Files in ${BACKUP_DIR}"
