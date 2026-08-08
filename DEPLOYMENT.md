# Invyte — Self-Host Deployment Guide

Deploy Invyte on a VPS in under 10 minutes using Docker Compose + Caddy (auto-TLS).

---

## Requirements

| Item | Minimum |
|---|---|
| OS | Ubuntu 22.04 / Debian 12 |
| RAM | 1 GB (2 GB recommended) |
| CPU | 1 vCPU |
| Disk | 10 GB |
| Docker | 24+ with Compose v2 |
| Domain | A record pointing to your VPS IP |

---

## Step 1 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## Step 2 — Clone the Repository

```bash
git clone https://github.com/your-org/invyte.git
cd invyte
```

---

## Step 3 — Configure Environment

```bash
cp .env.example .env
nano .env   # or use your editor of choice
```

**Required fields to fill in:**

```env
# Your domain (must have A record → this server)
APP_DOMAIN=undangan.example.com
APP_URL=https://undangan.example.com

# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=<generate_me>

# Database
POSTGRES_PASSWORD=<strong_password>

# MinIO storage
MINIO_ROOT_USER=invyte_minio
MINIO_ROOT_PASSWORD=<strong_password>

# Public URL for uploaded media
STORAGE_PUBLIC_URL=https://undangan.example.com/storage
```

---

## Step 4 — Run Setup

```bash
chmod +x docker/scripts/setup.sh
./docker/scripts/setup.sh
```

This script will:
1. Verify `.env` exists (copies from `.env.example` if missing)
2. Start infrastructure services (postgres, redis, minio)
3. Create the MinIO storage bucket
4. Run Drizzle database migrations
5. Apply PostgreSQL Row Level Security policies
6. Start the web app and Caddy reverse proxy

---

## Step 5 — Verify

```bash
# Check all services are healthy
docker compose -f docker/docker-compose.yml ps

# Tail web app logs
docker compose -f docker/docker-compose.yml logs -f web
```

Open `https://your-domain.com` — Caddy auto-obtains a TLS certificate on first request (takes ~30 seconds).

---

## Deploying with Coolify

Coolify provides its own reverse proxy + TLS, so use `docker/docker-compose.coolify.yml`
instead (no Caddy, no host ports on `web`) — point Coolify's "Docker Compose" resource at
that file.

1. In Coolify, set the app's domain (e.g. `ucapinstudio.visilogi.com`) and confirm its DNS
   `A`/`CNAME` record points at the server.
2. Fill in the same env vars as the table below in Coolify's environment editor — at minimum
   `APP_URL=https://ucapinstudio.visilogi.com`, `NEXT_PUBLIC_APP_URL` (same value),
   `BETTER_AUTH_SECRET`, `GUEST_PHONE_HASH_SALT`, `ENCRYPTION_KEY`, `POSTGRES_PASSWORD`,
   `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`.
3. `STORAGE_PUBLIC_URL` needs a domain that actually reaches the `minio` service — expose
   MinIO as a second Coolify service/domain (e.g. `storage.ucapinstudio.visilogi.com` →
   container port `9000`) and set `STORAGE_PUBLIC_URL` to that URL + `/${STORAGE_BUCKET}`.
   Without this, uploaded media links will point nowhere.
4. Deploy. The compose file's `migrate` and `createbucket` one-shot services run
   automatically before `web` starts (migrations + RLS policies, then MinIO bucket
   creation) — no manual `setup.sh` step needed on Coolify.

---

## Upgrading

```bash
git pull origin main
docker compose -f docker/docker-compose.yml build web
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @invyte/db db:migrate
```

Or with the one-liner (re-runs setup, idempotent):

```bash
./docker/scripts/setup.sh
```

---

## Backup & Restore

### Manual Backup

```bash
./docker/scripts/backup.sh /backups
```

Creates:
- `/backups/postgres_YYYYMMDD_HHMMSS.sql.gz` — full PostgreSQL dump
- `/backups/minio_YYYYMMDD_HHMMSS/minio_data.tar.gz` — MinIO object store

### Scheduled Backup (cron)

```bash
# Daily at 2 AM, keep 14 days
0 2 * * * /path/to/invyte/docker/scripts/backup.sh /backups >> /var/log/invyte-backup.log 2>&1
```

### Restore PostgreSQL

```bash
gunzip -c /backups/postgres_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker/docker-compose.yml exec -T postgres \
  psql -U invyte invyte
```

### Restore MinIO

```bash
docker compose -f docker/docker-compose.yml exec -T minio \
  sh -c "tar -xzf /tmp/restore.tar.gz -C / 2>/dev/null"
# Copy backup archive into container first:
docker compose -f docker/docker-compose.yml cp \
  /backups/minio_YYYYMMDD_HHMMSS/minio_data.tar.gz minio:/tmp/restore.tar.gz
```

---

## VPS Sizing Guide

| Users / Month | Invitations | VPS | RAM | Storage |
|---|---|---|---|---|
| < 500 | < 50 | $5–6/mo | 1 GB | 25 GB |
| 500–2000 | 50–200 | $12/mo | 2 GB | 50 GB |
| 2000–10000 | 200–1000 | $24/mo | 4 GB | 100 GB |
| > 10000 | > 1000 | $48/mo | 8 GB | 200 GB |

Tested on [Hetzner CX21](https://www.hetzner.com/cloud) (€3.79/mo) for hobby use.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `APP_URL` | ✅ | — | Full URL of your app (`https://...`) |
| `APP_DOMAIN` | ✅ | — | Domain only, used by Caddy for TLS |
| `BETTER_AUTH_SECRET` | ✅ | — | 32-byte random secret for JWT signing |
| `GUEST_PHONE_HASH_SALT` | ✅ | — | ≥16-char secret for guest phone dedup hashing (`openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | ✅ | — | 64-char hex (32 bytes) for encrypting stored messaging credentials (`openssl rand -hex 32`) |
| `POSTGRES_USER` | — | `invyte` | Database username |
| `POSTGRES_PASSWORD` | ✅ | — | Database password |
| `POSTGRES_DB` | — | `invyte` | Database name |
| `DATABASE_URL` | — | auto | Full Postgres URL (auto-built from above) |
| `MINIO_ROOT_USER` | ✅ | — | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | ✅ | — | MinIO admin password |
| `STORAGE_BUCKET` | — | `invyte` | S3 bucket name |
| `STORAGE_REGION` | — | `us-east-1` | S3 region (MinIO ignores this) |
| `STORAGE_PUBLIC_URL` | ✅ | — | Public base URL for media files |
| `ANTHROPIC_API_KEY` | — | — | For AI generation (Phase 2) |
| `FAL_API_KEY` | — | — | For image ornament generation (Phase 2) |

---

## Troubleshooting

### Caddy won't obtain TLS certificate

1. Verify your domain A record points to the server IP: `dig +short your-domain.com`
2. Ensure ports 80 and 443 are open: `sudo ufw allow 80 && sudo ufw allow 443`
3. Check Caddy logs: `docker compose -f docker/docker-compose.yml logs caddy`

### Web app fails to start

```bash
docker compose -f docker/docker-compose.yml logs web
```

Common causes:
- `DATABASE_URL` doesn't match postgres service credentials
- `BETTER_AUTH_SECRET` not set
- Postgres service not healthy yet (wait 10s and retry)

### MinIO bucket not created

```bash
docker compose -f docker/docker-compose.yml exec minio \
  mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" \
  && mc mb local/invyte
```

### Reset everything (⚠️ data loss)

```bash
docker compose -f docker/docker-compose.yml down -v
./docker/scripts/setup.sh
```

---

## Security Hardening (Production)

1. **Firewall:** only expose ports 80, 443, and 22 (SSH)
   ```bash
   sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
   sudo ufw enable
   ```

2. **SSH key auth only** — disable password auth:
   ```bash
   sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

3. **Rotate secrets** — regenerate `BETTER_AUTH_SECRET` quarterly:
   ```bash
   openssl rand -base64 32
   # Update .env, then restart: docker compose up -d web
   ```

4. **Keep Docker updated:**
   ```bash
   sudo apt update && sudo apt upgrade docker-ce docker-ce-cli
   ```

---

## License

Invyte core is licensed under [AGPLv3](LICENSE).
Templates are licensed under [MIT](packages/templates/LICENSE).
