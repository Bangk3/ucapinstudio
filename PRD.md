# Product Requirements Document (PRD)

**Project codename:** `invyte` (final name TBD)
**Version:** 0.1 — Initial Draft
**Last updated:** 2026-05-12
**Status:** Draft, awaiting team review

---

## 1. Executive Summary

`invyte` adalah platform open-source self-hostable untuk membuat undangan digital, dengan fokus pada pasar Indonesia. Diposisikan sebagai alternatif self-hostable dari Satu Momen / Viding / Kekondangan, dengan diferensiasi pada AI-native template generation, multi-tenancy untuk Wedding Organizer/reseller, dan integrasi pembayaran lokal (QRIS).

### 1.1 Problem Statement

1. **Untuk mempelai (B2C):** Platform komersial berbayar (Lifetime Rp 200-500rb), data tamu tersimpan di server vendor, tidak ada portabilitas, sering kena retensi data terbatas.
2. **Untuk Wedding Organizer (B2B):** Tidak ada solusi white-label open-source. Harus pilih antara: (a) bayar reseller fee ke platform komersial, (b) hire developer untuk bikin dari nol.
3. **Untuk developer/agency:** Project open-source yang ada di GitHub semuanya single-tenant ("fork & customize"), bukan platform.

### 1.2 Success Metrics

| Metric | 3 bulan | 6 bulan | 12 bulan |
|--------|---------|---------|----------|
| GitHub stars | 100 | 500 | 2000 |
| Self-host installs (telemetry opsional) | 10 | 100 | 500 |
| Production deployments (registered) | 3 | 25 | 100 |
| Contributors | 3 | 10 | 30 |
| Template library | 5 handcrafted | 15 | 30 + AI gen |

### 1.3 Non-Goals (MVP)

- ❌ Hosted SaaS offering (self-host only di Phase 1)
- ❌ Mobile native apps (PWA cukup)
- ❌ Marketplace template berbayar
- ❌ Wedding planning suite lengkap (budget, vendor, dll)
- ❌ Print/cetak undangan fisik

---

## 2. Target Users & Personas

### Persona 1: Calon Mempelai (B2C)
- **Profil:** 25-35 tahun, urban Indonesia, tech-savvy moderate
- **Pain:** Mau undangan unik tanpa bayar mahal, ingin kontrol data
- **Behavior:** Riset 2-4 platform, baca review, sensitif harga
- **Need:** Setup cepat (< 30 menit), template bagus, mudah share

### Persona 2: Wedding Organizer / Reseller (B2B)
- **Profil:** Small business, freelance WO, agency 2-10 orang
- **Pain:** Klien minta undangan digital, harus bayar lisensi reseller
- **Behavior:** Mengelola 10-50 klien/tahun, butuh dashboard manajemen
- **Need:** Multi-tenant, white-label, branding sendiri, analytics

### Persona 3: Developer / Tech Hobbyist
- **Profil:** Developer yang nikah sendiri atau bantu teman
- **Pain:** Project di GitHub semuanya outdated atau single-use
- **Behavior:** Mau modify, contribute back
- **Need:** Modern stack, good DX, dokumentasi solid

---

## 3. Feature Specification

### 3.1 Feature Prioritization Matrix

Notation: **P0** = MVP must-have, **P1** = Phase 2, **P2** = Phase 3, **P3** = Future/Backlog

| # | Feature | Priority | Effort | Differentiator? |
|---|---------|----------|--------|-----------------|
| F-01 | Auth & user management | P0 | M | - |
| F-02 | Multi-tenant (path-based) | P0 | M | ✅ |
| F-03 | Invitation CRUD | P0 | M | - |
| F-04 | Template gallery (5-10 handcrafted) | P0 | L | ✅ |
| F-05 | Theme customizer (color/font/photo) | P0 | M | - |
| F-06 | Guest list manual + CSV bulk | P0 | S | - |
| F-07 | Personalized link per guest (?to=) | P0 | S | - |
| F-08 | RSVP + buku tamu (ucapan) | P0 | M | - |
| F-09 | Countdown timer | P0 | S | - |
| F-10 | Google Maps embed + Add to Calendar | P0 | S | - |
| F-11 | Share to WhatsApp/IG/FB | P0 | S | - |
| F-12 | Background music player | P0 | S | - |
| F-13 | Multi-event (akad/resepsi) | P0 | M | - |
| F-14 | Docker Compose one-liner deploy | P0 | M | ✅ |
| F-15 | Self-hosted file storage (MinIO) | P0 | S | - |
| F-16 | **AI template generation (full layout + copy)** | **P1** | **XL** | ✅✅✅ |
| F-17 | **QR check-in tamu + PWA scanner** | P1 | L | ✅✅ |
| F-18 | **Digital amplop QRIS** | P1 | L | ✅✅ |
| F-19 | **Analytics dashboard** | P1 | M | ✅ |
| F-20 | **Multi-bahasa (ID/EN/Jawa/Sunda/AR)** | P1 | M | ✅ |
| F-21 | Galeri foto/video (love story) | P1 | M | - |
| F-22 | Messaging adapter (Cloud API + Fonnte) | P1 | L | ✅ |
| F-23 | Live streaming embed | P2 | S | - |
| F-24 | AI photo enhancer | P2 | M | ✅ |
| F-25 | AI voice greeting per guest | P2 | L | ✅ |
| F-26 | Custom domain per tenant | P2 | M | - |
| F-27 | Email broadcast | P2 | M | - |
| F-28 | Plugin/theme marketplace | P3 | XL | - |
| F-29 | Wedding planner suite | P3 | XL | - |

### 3.2 Detailed Specs — P0 (MVP)

---

#### F-01: Auth & User Management

**User Stories:**
- US-01-01: Sebagai user, saya bisa daftar dengan email + password, login, logout
- US-01-02: Sebagai user, saya bisa reset password via email
- US-01-03: Sebagai user, saya bisa login dengan Google OAuth
- US-01-04: Sebagai admin tenant, saya bisa invite anggota tim

**Acceptance Criteria:**
- Password minimum 8 char, ada validasi strength
- Email verification required sebelum bisa publish undangan
- Session JWT dengan refresh token, expire 7 hari
- Rate limiting di endpoint login (5 attempts / 15 menit)

**Tech notes:** Better Auth atau Auth.js v5

---

#### F-02: Multi-Tenant (Path-Based)

**User Stories:**
- US-02-01: WO bisa register sebagai tenant dengan slug (e.g. `bali-wedding-co`)
- US-02-02: WO bisa akses dashboard di `app.com/bali-wedding-co/dashboard`
- US-02-03: Setiap tenant bisa kustomisasi branding (logo, warna primary)
- US-02-04: B2C user otomatis masuk ke tenant "personal" default

**Acceptance Criteria:**
- Slug unique, validation regex `^[a-z0-9-]{3,50}$`
- Route middleware extract tenant dari path, inject ke context
- Row-level security di DB (semua query filter by `tenant_id`)
- Tenant tidak bisa lihat data tenant lain (verified via integration test)

**Tech notes:**
- Next.js middleware untuk path-based tenant extraction
- Drizzle ORM dengan helper `withTenant(db, tenantId)` wrapper

---

#### F-03: Invitation CRUD

**User Stories:**
- US-03-01: User bisa create invitation, pilih jenis acara (wedding/khitanan/aqiqah/ultah)
- US-03-02: User bisa edit semua field: mempelai/host, tanggal, lokasi, kontak
- US-03-03: User bisa preview undangan sebelum publish
- US-03-04: User bisa publish/unpublish, undangan published dapat URL public
- US-03-05: User bisa duplicate undangan (untuk WO yang punya banyak klien similar)
- US-03-06: User bisa delete invitation (soft delete dengan retention 30 hari)

**Acceptance Criteria:**
- Auto-save draft setiap 30 detik
- Validation: tanggal acara tidak boleh masa lalu (dengan override flag)
- Slug undangan unique per tenant: `tenant-slug/invite-slug`
- Published URL: `app.com/{tenant}/u/{invitation-slug}`

---

#### F-04: Template Gallery

**User Stories:**
- US-04-01: User bisa browse template dengan filter (jenis acara, gaya, warna)
- US-04-02: User bisa preview template dengan data dummy sebelum pilih
- US-04-03: User bisa apply template, semua data invitation auto-mapped
- US-04-04: User bisa ganti template kapan saja, data tidak hilang

**Acceptance Criteria:**
- Minimum 5 template handcrafted di MVP launch
- Template harus responsive (mobile-first)
- Template loading < 2s di 3G simulated
- Lighthouse score > 90 untuk template default

**Tech notes:**
- Template = React components dengan well-defined "slots" untuk data
- Theme tokens via CSS variables (color, font, spacing)
- Stored di `templates/` folder dalam codebase, bukan di DB

**Recommended template list (MVP):**
1. Minimalist Modern (sage green, serif)
2. Floral Classic (cream + rose, ornamental)
3. Islamic Elegant (gold + navy, kaligrafi)
4. Tropical Bali (palm green + terracotta)
5. Royal Java (maroon + gold, batik motif)

---

#### F-05: Theme Customizer

**User Stories:**
- US-05-01: User bisa ganti warna primary/secondary
- US-05-02: User bisa ganti font family (preset 6-8 pilihan)
- US-05-03: User bisa upload foto cover, prewedding, mempelai
- US-05-04: User bisa preview perubahan real-time

**Acceptance Criteria:**
- Color picker dengan accessibility check (contrast ratio)
- Foto upload: max 5MB, auto-resize, WebP conversion
- Preview pane update dalam < 200ms
- Reset to default button

---

#### F-06: Guest List Manual + CSV Bulk

**User Stories:**
- US-06-01: User bisa add tamu satu per satu (nama, kontak, kategori)
- US-06-02: User bisa upload CSV (template downloadable)
- US-06-03: User bisa edit/delete tamu, bulk select
- US-06-04: User bisa group tamu (keluarga, teman kerja, dll)
- US-06-05: User bisa filter & search di tabel tamu

**CSV Schema:**
```csv
name,phone,email,group,plus_one,notes
"Budi Santoso","+628123456789","budi@email.com","keluarga",2,"sahabat papa"
```

**Acceptance Criteria:**
- CSV max 10,000 rows per upload
- Validation per row, error report sebagai downloadable CSV
- Deduplication berdasarkan phone+email
- Progress bar untuk upload besar (chunk via streaming)

---

#### F-07: Personalized Link per Guest

**User Stories:**
- US-07-01: Sistem auto-generate unique slug per tamu
- US-07-02: URL format: `app.com/{tenant}/u/{invite}/{guest-slug}`
- US-07-03: Saat dibuka, undangan tampilkan "Kepada Yth. [Nama]"
- US-07-04: User bisa copy link individual atau bulk export

**Acceptance Criteria:**
- Guest slug = nanoid 8 char (collision-safe)
- Bulk export CSV: nama, link, QR code URL
- Track open count per guest link
- Link tetap valid setelah edit nama tamu

---

#### F-08: RSVP + Buku Tamu

**User Stories:**
- US-08-01: Tamu bisa konfirmasi hadir/tidak hadir/maybe
- US-08-02: Tamu bisa input jumlah pendamping (kalau di-enable)
- US-08-03: Tamu bisa tulis ucapan/doa
- US-08-04: Host bisa lihat list RSVP dengan filter & export

**Acceptance Criteria:**
- Ucapan moderation: auto-approve / manual approval (per tenant setting)
- Spam protection: rate limit, optional captcha (Cloudflare Turnstile)
- Show ucapan public di undangan (paginated)
- Webhook on RSVP submit (untuk WhatsApp notif)

---

#### F-09 to F-12: Standard Features

**F-09 Countdown:** Display days/hours/minutes/seconds, timezone-aware (Asia/Jakarta, WIB/WITA/WIT)

**F-10 Maps & Calendar:**
- Google Maps embed (atau OpenStreetMap fallback)
- Generate `.ics` file + deeplinks (Google/Apple/Outlook)
- Tombol "Buka di Waze" dan "Buka di Google Maps"

**F-11 Share:**
- WhatsApp deeplink dengan pre-filled message
- Instagram story share (image render)
- Facebook share dialog
- Copy link button

**F-12 Music:**
- Library 20+ instrumental music (royalty-free)
- Custom upload (MP3, max 8MB)
- Default autoplay muted, prompt unmute (browser compliance)

---

#### F-13: Multi-Event Support

**User Stories:**
- US-13-01: Satu undangan bisa punya multiple event (akad pagi, resepsi siang/malam)
- US-13-02: Per event punya tanggal, waktu, lokasi terpisah
- US-13-03: RSVP per event (tamu bisa konfirmasi hadir di akad tapi tidak resepsi)

---

#### F-14: Docker Compose Deploy

**User Stories:**
- US-14-01: User bisa deploy dengan `docker-compose up -d` di < 5 menit
- US-14-02: Default config aman untuk production (no exposed admin, secrets random)
- US-14-03: Backup script untuk DB + storage

**Acceptance Criteria:**
- Single `docker-compose.yml` untuk: app, postgres, minio, redis
- Setup wizard di first visit (create admin user)
- Health checks untuk semua service
- Documented upgrade path

---

#### F-15: Self-Hosted Storage

- MinIO sebagai default S3-compatible storage
- Konfigurasi external S3/R2 via env var
- Image processing: Sharp untuk resize, WebP conversion
- CDN-ready: cache headers, ETag

---

### 3.3 Detailed Specs — P1 (Phase 2)

---

#### F-16: AI Template Generation (Full Layout + Copy)

**The Big Bet.** Ini differentiator utama proyek.

**User Stories:**
- US-16-01: User input prompt natural language ("undangan tema rustic warna sage green dengan ornamen daun, mood elegan tapi santai")
- US-16-02: AI generate 3 variasi template (layout + warna + copy + font pairing)
- US-16-03: User bisa pilih, atau request iterasi ("buat lebih minimalis")
- US-16-04: Template hasil generate bisa di-fine-tune manual via theme customizer

**Technical Approach (Staged Implementation):**

**Stage 1 — Constrained generation (Recommended start):**
- Define DSL/schema untuk template (JSON dengan slots: hero, story, events, gallery, rsvp)
- LLM generate hanya: warna palette, font pairing, copy/text, ornament selection dari library
- Layout tetap dari template skeleton (3-5 variant skeleton)
- **Pros:** Deterministic, fast, hasil konsisten
- **Cons:** Bukan "full layout generation"

**Stage 2 — Component composition:**
- LLM compose dari library 20+ section components ("hero-floral", "events-timeline", "rsvp-elegant")
- Validation layer ensure compositional rules (e.g. exactly 1 hero, 1 rsvp)
- Generate styling tokens (color, font, spacing)

**Stage 3 — True layout generation:**
- LLM generate full Tailwind/CSS dengan iterative refinement loop
- Auto-screenshot + visual QA via vision model
- Sandbox execution untuk validasi tidak break

**Recommendation untuk MVP P1:** Mulai dari Stage 1, expand ke Stage 2 setelah validation.

**Acceptance Criteria:**
- Generation time < 30s end-to-end
- 80% generated templates pass auto QA (no broken layout, contrast OK)
- User satisfaction ≥ 70% (thumbs up/down feedback)
- Cost per generation < $0.10 (Claude Haiku tier)

**LLM Stack:**
- **Text generation:** Claude (via Anthropic API) atau OpenAI fallback
- **Image generation (for ornaments/backgrounds):** Flux via fal.ai atau Replicate
- **Vision QA:** Claude vision atau GPT-4V

---

#### F-17: QR Check-in PWA Scanner

**User Stories:**
- US-17-01: Setiap personalized guest link include QR code
- US-17-02: Panitia bisa scan QR via PWA di hari H
- US-17-03: Sistem record check-in dengan timestamp
- US-17-04: Real-time dashboard untuk host: berapa tamu sudah datang

**Tech:**
- PWA dengan offline-first (IndexedDB queue, sync saat online)
- Camera API + jsQR library
- WebSocket untuk real-time dashboard

---

#### F-18: Digital Amplop QRIS

**User Stories:**
- US-18-01: Mempelai bisa generate QRIS static dari bank/e-wallet
- US-18-02: Tamu bisa transfer dengan scan QR atau tap "Open in [E-wallet]"
- US-18-03: Mempelai bisa link rekening bank (manual, tidak ada API integration)
- US-18-04: Optional: ucapan terima kasih otomatis setelah transfer (dengan trust caveat)

**Important:** MVP **TIDAK** integrate dengan payment gateway. Hanya display QRIS dan info rekening. Transfer terjadi di luar sistem.

**Phase 2:** Integration dengan Midtrans/Xendit untuk auto-detect transfer (premium feature).

---

#### F-19: Analytics Dashboard

**Metrics tracked:**
- Total view, unique view per invitation
- Open rate per guest (siapa sudah buka, kapan)
- RSVP funnel: viewed → opened RSVP → submitted
- Device breakdown (mobile/desktop, browser, OS)
- Geographic (country/city berdasarkan IP, dengan privacy opt-in)
- Source referrer (WA/IG/direct)
- Top moments (kapan paling banyak dibuka)

**Privacy:**
- No third-party trackers
- Self-hosted Plausible-style analytics
- GDPR/UU PDP compliant (no PII tracking by default)

---

#### F-20: Multi-Bahasa & Regional

**Languages MVP:**
- 🇮🇩 Bahasa Indonesia (default)
- 🇬🇧 English
- 🇸🇦 العربية (Arabic, RTL support)
- ꦗꦮ Bahasa Jawa (krama)
- Basa Sunda

**Implementation:**
- i18n via next-intl
- Per-invitation language setting
- UI app: ID/EN only di MVP
- Template content: full multi-language

**Specific challenges:**
- RTL layout untuk Arabic (different from LTR templates)
- Aksara Jawa optional rendering (Noto Sans Javanese)
- Tanggal Hijriah untuk Islamic invitations

---

#### F-22: Messaging Adapter

**Architecture:** Provider-agnostic interface, plugin-based.

```ts
interface MessagingProvider {
  send(to: string, message: TemplatedMessage): Promise<SendResult>;
  sendBulk(recipients: Recipient[], message: TemplatedMessage): Promise<BulkResult>;
  getStatus(messageId: string): Promise<MessageStatus>;
}
```

**Bundled providers (MVP P1):**
1. **WhatsApp Cloud API** (Meta official, free tier 1000/bulan)
2. **Fonnte** (Indonesia, popular, mereka handle Baileys risk)
3. **Wablas** (Indonesia)
4. **SMTP** (email fallback)

**Optional plugin (separate repo):**
- `invyte-baileys` — community plugin dengan disclaimer ToS violation

**Configuration:**
- Per-tenant provider selection
- Bring-your-own-credentials (BYOC)
- Rate limiting per provider sesuai kuota

---

## 4. Non-Functional Requirements

### 4.1 Performance
- TTI (Time to Interactive) undangan public: < 2.5s di 3G
- API p95 latency: < 300ms
- Concurrent users per single Docker host: 500+ untuk view, 50 untuk edit

### 4.2 Security
- OWASP Top 10 compliance
- All secrets via env var, never committed
- Rate limiting (per IP + per user)
- Input sanitization, XSS prevention (DOMPurify)
- CSRF tokens
- Optional 2FA (Phase 2)

### 4.3 Privacy & Data
- Data ownership 100% user (self-host)
- Export semua data user (GDPR/UU PDP right to portability)
- Soft delete dengan 30 hari retention, hard delete option
- No analytics tracking ke server developer

### 4.4 Accessibility
- WCAG 2.1 AA compliance untuk dashboard
- WCAG 2.1 A untuk template public (relaksasi karena artistic)
- Keyboard navigation
- Screen reader friendly

### 4.5 Browser Support
- Chrome/Edge: last 2 versions
- Safari: last 2 versions
- Firefox: last 2 versions
- Mobile: iOS 14+, Android 8+
- PWA support required

### 4.6 Internationalization
- All strings via i18n keys
- Locale-aware date/time/number formatting
- Timezone handling: store UTC, display tenant timezone

---

## 5. Out of Scope (Explicitly)

- ❌ Native mobile apps
- ❌ Print-on-demand fisik undangan
- ❌ Wedding planner full suite (budget, vendor, tasks)
- ❌ E-commerce / souvenir tracker
- ❌ Hosted SaaS by core team (community boleh)
- ❌ Built-in payment processing (just QRIS display)

---

## 6. Open Questions

1. **Lisensi?** AGPLv3 (protect dari komersial bypass) vs MIT (max adoption). Recommend: **AGPLv3** untuk core, MIT untuk template & plugin.
2. **Naming?** `invyte` placeholder. Final candidates: `kondangan`, `nikahin`, `ondangan`, `undangin`.
3. **Logo & brand?** Defer ke setelah MVP demo working.
4. **Funding model?** Donation (GitHub Sponsors, Open Collective), atau dual license (free for personal, commercial license for SaaS resellers)?

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI generation quality buruk | High | High | Stage 1 implementation, manual QA, fallback ke template |
| Pasar terlalu kompetitif | High | Medium | Fokus diferensiasi (self-host + AI), bukan compete head-on |
| WhatsApp ban via Baileys | High | Medium | Adapter pattern, default ke Cloud API |
| Self-host complexity scare users | Medium | High | One-click installer, hosted demo, clear docs |
| Template kualitas rendah | High | High | Hire/contract 1-2 designer untuk 5 flagship template |
| Maintenance burden | Medium | High | Modular architecture, plugin system early |

---

## 8. Glossary

- **Tenant:** Workspace dengan slug unik, bisa B2C (personal) atau B2B (WO)
- **Invitation:** Satu undangan untuk satu acara (bisa multi-event)
- **Event:** Acara dalam invitation (akad/resepsi/dll)
- **Guest:** Tamu undangan dengan personalized link
- **Template:** React component pattern, styling via tokens
- **Theme:** Customization layer di atas template (color/font/photo)
