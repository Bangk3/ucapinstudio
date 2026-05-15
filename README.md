# invyte

Open-source, self-hosted digital wedding invitation platform for Indonesia and beyond.

**License:** AGPLv3 (core) | MIT (templates)

---

## Quick Start (Local Dev)

**Prerequisites:** Node.js 22+, pnpm 9+, Docker

```bash
# 1. Clone
git clone https://github.com/your-org/invyte.git
cd invyte

# 2. Install dependencies
pnpm install

# 3. Start dev services (Postgres, Redis, MinIO, Mailpit)
docker compose -f docker/docker-compose.dev.yml up -d

# 4. Configure environment
cp .env.example .env
# Edit .env with your values

# 5. Run migrations
pnpm db:migrate

# 6. Seed database
pnpm db:seed

# 7. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

**Dev service UIs:**
- MinIO console: http://localhost:9001 (undangan_minio / undangan_minio_secret)
- Mailpit: http://localhost:8025

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache/Queue | Redis 7 + BullMQ |
| Storage | MinIO (S3-compatible) |
| Auth | Better Auth |
| UI | Tailwind CSS 4 + shadcn/ui |
| AI | Claude Haiku + Flux Schnell |
| Monorepo | Turborepo + pnpm workspaces |

---

## Project Structure

```
apps/
  web/              — Next.js main app (dashboard + public pages + API)
packages/
  db/               — Drizzle ORM schema + migrations
  ui/               — Shared UI components (shadcn/ui base)
  shared/           — Types, utils, constants, Zod schemas
  templates/        — Invitation templates (M2)
  messaging/        — Messaging provider adapters (M6)
  ai/               — AI generation logic (M7)
  storage/          — S3/MinIO abstraction (M2)
docker/
  docker-compose.dev.yml
  docker-compose.yml      — Production
  Dockerfile
```

---

## Roadmap

- **M0** ✅ — Monorepo scaffold, CI, tooling
- **M1** — Auth + multi-tenancy
- **M2** — Invitation editor + 5 templates
- **M3** — Guest list + RSVP
- **M4** — Public invitation polish
- **M5** — Docker self-host deployment
- 🚀 **v0.1.0 MVP**
- **M6** — Messaging (WhatsApp)
- **M7** — AI template generation
- **M8** — Digital amplop QRIS
- **M9** — Analytics dashboard
- **M10** — QR check-in PWA
- **M11** — Multi-language (ID/EN/AR/JV/SU)
- 🎉 **v0.2.0**

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Core: [AGPL-3.0](LICENSE) | Templates: MIT
