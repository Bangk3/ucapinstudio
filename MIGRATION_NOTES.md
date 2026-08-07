# Migration Notes — pindah ke workspace/fork baru

Catatan lengkap semua perubahan yang sudah dikerjakan di workspace lama, supaya bisa
dikerjakan ulang di workspace baru. **PENTING**: fork GitHub cuma nyalin kode yang sudah
di-push ke `adhidevara/invyte` — semua ini masih di lokal, belum pernah di-push, jadi fork
barumu masih kode ASLI (belum ada satu pun perubahan di bawah ini). Copy file ini ke
workspace baru, lalu kerjakan checklist-nya dari atas ke bawah.

## Lokasi workspace baru

- **Repo fork**: https://github.com/Bangk3/ucapinstudio.git (rename dari `invyte` asli)
- **Folder lokal**: `/home/mrthinker/Project/ucapinstudio` (mesin `mrthinker-Lenovo-IdeaPad-Y510P`)
- Sudah di-clone di lokasi itu — struktur folder root sudah persis sama dengan `invyte` lama
  (`apps/`, `packages/`, `docker/`, `ARCHITECTURE.md`, `SCHEMA.md`, dst), tanda clone berhasil normal.
- Workspace lama (`/home/mrthinker/Project/invyte`) tetap ada di mesin yang sama — masih jadi
  sumber referensi kalau perlu bandingkan/copy file yang belum sempat dikerjakan ulang.

---

## 0. Setup awal di workspace baru

- [x] Clone fork barumu, cek `git remote -v` sudah nunjuk ke repo kamu sendiri (bukan `adhidevara/invyte`) — sudah, `origin` → `Bangk3/ucapinstudio`
- [x] `cp .env.example .env`, isi ulang secret (`BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, dst) — `.env` dibuat, `BETTER_AUTH_SECRET`/`GUEST_PHONE_HASH_SALT` di-generate acak (`openssl rand`); `POSTGRES_PASSWORD`/`MINIO_ROOT_PASSWORD` masih nilai default `.env.example`, **ganti sebelum deploy sungguhan**
- [x] Tambahkan ke `.gitignore`: `graphify-out/` (kalau nanti pakai `/graphify` lagi)

---

## 1. Docker & Deploy — fix yang sudah terbukti perlu

- [x] **`.dockerignore`** (file baru) — exclude `node_modules`, `**/.next`, `.git`, `.env*` (kecuali `.env.example`), `*.log`, `.turbo`, `coverage` dari build context Docker.
- [x] **`docker/scripts/setup.sh`** — tambahkan `set -a` sebelum `source "${ENV_FILE}"` dan `set +a` sesudahnya.
- [x] **`docker/docker-compose.yml`**:
  - Tambahkan `NEXT_PUBLIC_APP_URL: ${APP_URL}` di environment `web`. ✅
  - Healthcheck web: ganti `localhost` → `127.0.0.1`. **Catatan**: route `/api/health` **sudah ada** di codebase ini (`apps/web/app/api/health/route.ts`, cek DB+Redis) — beda dari klaim di notes ini, jadi healthcheck tetap pakai `/api/health`, cuma host-nya yang diperbaiki. Fix yang sama juga diterapkan ke `HEALTHCHECK` di `docker/Dockerfile` (root cause sama).
  - Konfirmasi: tidak ada `ports: ["3100:3000"]` di service `web` — sudah aman, tidak perlu diubah.
- [x] **`docker/docker-compose.coolify.yml`** (file baru) — dibuat, tanpa Caddy, tanpa host port di `web`, plus service `migrate` one-shot (`depends_on: service_completed_successfully`). `DATABASE_URL` pakai `${POSTGRES_PASSWORD}` (bukan literal).
- [x] **Cara jalanin compose yang benar** — sudah tercakup lewat fix `set -a`/`set +a` di `setup.sh` (jalur deploy resmi di `DEPLOYMENT.md`), yang mengekspor env var ke shell sebelum manggil `docker compose` sehingga interpolasi `${VAR}` jalan tanpa perlu `--env-file` eksplisit di situ.
- [x] Port 80/443 conflict — dicatat, tidak ada perbaikan kode (bukan bug app).
- [ ] **`docker/Dockerfile`** — mirror npm **di-skip**: registry resmi (`registry.npmjs.org`) terverifikasi reachable dari workspace ini, sesuai saran notes untuk skip kalau jaringan lancar.

---

## 2. Rebranding — hapus tag "gratis"/"open source" (sudah dikerjakan, tinggal ulang)

- [x] **`apps/web/app/layout.tsx`** — metadata description diringkas.
- [x] **`apps/web/app/_home/index.tsx`** (landing page, ~25 titik diganti total termasuk beberapa yang tidak eksplisit disebut tapi kategori sama — badge hero, trust bar, testimonial, DevLab section) — semua sub-poin di atas selesai:
  - "7 Template Gratis" → "7 Template Siap Pakai" (3 lokasi: FEATURES, trust bar, TemplatesSection heading) + "Desain Gratis" (stat) dan badge kartu template "Gratis" → "Siap Pakai"
  - Card fitur "Open Source" → "Dukungan Cepat" (2 lokasi: FEATURES card, trust bar)
  - Semua CTA "Mulai Gratis" → "Mulai Sekarang" (5 lokasi)
  - FAQ diganti jadi "Berapa biaya menggunakan Invyte?" — jawaban netral, tanpa sebut AGPLv3/gratis
  - Pricing: kedua plan price → "Hubungi Kami", headline "Selalu gratis" → "Transparan & jelas"
  - Tombol GitHub star diganti "💬 Hubungi Kami" (anchor ke `#pricing`, bukan link eksternal palsu)
  - Footer tagline dan DevLab section: kata "open-source"/"gratis selamanya" dihapus
  - Footer label legal → "Lisensi"
  - Footer copyright **dipertahankan utuh**: "© 2025 Invyte. Open source under AGPLv3."

---

## 3. Kepatuhan lisensi AGPL — WAJIB, bukan opsional

- [x] File `LICENSE` (AGPLv3) tetap ada di root repo, isi tidak diubah.
- [x] Copyright notice asli ("undangan-os contributors") tetap ada di `LICENSE`, ditambah baris "Modified by Kelvin Prasetya, 2026" di atasnya.
- [x] **Source Code link** ditambahkan — pill "GitHub" di footer landing page yang sebelumnya `href="/"` (dead link) sekarang mengarah ke `https://github.com/Bangk3/ucapinstudio`, label diganti "Source Code" (AGPL §13). Reuse pill yang sudah ada, bukan komponen baru.
- [x] Kredit DevLab.tgk dipertahankan — lihat bagian 4.

---

## 4. Template credit — sudah dikerjakan, tinggal ulang

- [x] **`packages/templates/src/components/powered-by.tsx`** — diubah dari `position: fixed` floating pill jadi baris statis (centered) di alur dokumen normal.
- [x] **7 file di `packages/templates/src/templates/*.tsx`** — import + `<InvyteCredit />` dihapus dari semua 7. Komponen `invyte-credit.tsx` sendiri **dihapus** (sudah tidak dipakai di mana pun, verified via grep) — sisa `<PoweredByDevLab />` saja.

---

## 5. Bug yang sudah ada dari awal (belum diperbaiki, bukan buatan sesi ini)

- [x] **`README.md`** — dicek, `# 6. Seed database` / `pnpm db:seed` **sudah benar** di fork ini, typo yang disebut notes tidak ada di sini (kemungkinan sudah kebetulan tidak ke-porting, atau versi lama fork). Tidak ada yang diubah.
- [x] **`packages/db/src/seed.ts`** — ditambahkan insert row `account` (`providerId: "credential"`) dengan password hash lewat `hashPassword` dari `better-auth/crypto` (hasher asli better-auth, bukan reimplementasi manual) — verified via source better-auth@1.6.10. Password default `admin12345`, bisa di-override lewat env `SEED_ADMIN_PASSWORD`, ikut di-log ke console setelah seed selesai. `better-auth` ditambah sebagai dependency `@invyte/db`. Typecheck `@invyte/db` lulus.
- [x] Dokumentasi (`CLAUDE.md`) — status diupdate: M0–M4 done (cek `todo.md`), bukan lagi "design/planning phase".

---

## 6. Sekadar diingat (sudah OK, tidak perlu diapa-apakan)

- RLS (`packages/db/rls.sql`), rate-limit login, AI cost-cap per-tenant (`ai/generate` & `ai/compose` routes) — sudah diverifikasi jalan dengan benar, jangan disederhanakan.
- `.env` sudah benar di-`.gitignore`, jangan pernah commit.
