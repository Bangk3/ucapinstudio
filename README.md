<p align="center">
  <img src="docs/assets/banner.png" alt="Invyte — Undangan Digital Pernikahan" width="100%" />
</p>

<h1 align="center">Invyte</h1>
<p align="center">
  <strong>Undangan digital pernikahan yang indah, personal, dan sepenuhnya milik kamu.</strong><br/>
  <em>Beautiful, personalized digital wedding invitations — self-hosted & open source.</em>
</p>

<p align="center">
  <a href="#-fitur-utama">Fitur</a> ·
  <a href="#-cara-kerja">Cara Kerja</a> ·
  <a href="#-untuk-developer">Developer</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="https://github.com/adhidevara/invyte/discussions">Diskusi</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/templates-MIT-blue?style=flat-square" alt="Templates License" />
  <img src="https://img.shields.io/badge/status-early%20development-orange?style=flat-square" alt="Status" />
</p>

---

## 💌 Apa itu Invyte?

**Invyte** adalah platform undangan digital pernikahan yang bisa kamu hosting sendiri — gratis, tanpa berlangganan, dan data tamu sepenuhnya ada di tanganmu.

Tidak perlu bayar per undangan. Tidak perlu khawatir data tamu bocor ke pihak ketiga. Tidak perlu bergantung pada layanan yang bisa tutup kapan saja.

Invyte dirancang khusus untuk pasangan Indonesia yang ingin undangan digital yang **cantik, personal, dan modern** — dengan fitur lengkap seperti RSVP, buku tamu, galeri foto, hitungan mundur, hingga amplop digital.

---

## ✨ Fitur Utama

### 💑 Untuk Pasangan & Keluarga

| Fitur | Deskripsi |
|-------|-----------|
| 🎨 **Template Cantik** | Pilih dari berbagai desain elegan. Sesuaikan warna, font, dan foto sesuai tema pernikahanmu. |
| 📸 **Galeri Foto** | Tampilkan foto prewedding dengan tampilan masonry, carousel, atau polaroid yang memukau. |
| ⏳ **Hitung Mundur** | Countdown otomatis menuju hari pernikahanmu yang ditampilkan langsung di undangan. |
| 💌 **Link Personal per Tamu** | Setiap tamu mendapat link unik bertuliskan namanya sendiri — terasa lebih istimewa dari undangan biasa. |
| ✅ **RSVP Online** | Tamu konfirmasi kehadiran langsung dari undangan. Kamu pantau hasilnya dari dashboard. |
| 📖 **Buku Tamu Digital** | Tamu bisa titip doa dan ucapan. Kamu moderasi sebelum tampil di undangan. |
| 💰 **Amplop Digital** | Tampilkan QRIS, nomor rekening bank, dan dompet digital (GoPay, OVO, Dana, dll) — dalam satu halaman yang rapi. |
| 🗺️ **Peta & Livestream** | Integrasi Google Maps untuk venue, plus link livestream bagi tamu yang tidak bisa hadir. |
| 🎵 **Musik Latar** | Tambahkan lagu favorit sebagai background music undanganmu. |
| 📱 **Multi-Acara** | Dukung beberapa acara sekaligus (akad, resepsi, pengajian) dalam satu undangan. |

### 🛠️ Untuk Pengelola / Operator

| Fitur | Deskripsi |
|-------|-----------|
| 📋 **Manajemen Tamu** | Import ribuan tamu dari CSV, kelola kategori (VIP, keluarga, dll), lacak status undangan. |
| 📊 **Analitik** | Pantau siapa yang sudah membuka undangan, dari mana, dan kapan. |
| 💬 **Blast WhatsApp** | Kirim link undangan personal ke semua tamu sekaligus via WhatsApp. *(Segera)* |
| 📲 **QR Check-in** | Scan QR tamu di pintu masuk venue — tanpa koneksi internet sekalipun. *(Segera)* |
| 🤖 **Generate AI** | Buat desain undangan hanya dari deskripsi teks — AI yang kerjakan sisanya. |
| 🌐 **Multi-bahasa** | Dukungan Bahasa Indonesia, Inggris, Arab, Jawa, dan Sunda. *(Segera)* |

---

## 🎯 Untuk Siapa?

- **Pasangan yang menikah** — ingin undangan digital yang berkesan tanpa biaya langganan bulanan.
- **Wedding organizer & EO** — kelola ratusan undangan untuk berbagai klien dari satu platform.
- **Developer freelance** — deploy untuk klien, white-label, tanpa terikat vendor.
- **Pemerintah & institusi** — undangan resmi dengan data yang tidak keluar dari server sendiri.

---

## 🚀 Cara Kerja

Hanya 4 langkah dari nol hingga undangan terkirim:

```
1. Deploy  →  2. Buat Undangan  →  3. Tambah Tamu  →  4. Kirim & Pantau
```

**1. Deploy sekali, pakai selamanya**
Server sendiri, domain sendiri. Cukup satu perintah Docker untuk menjalankan semuanya.

**2. Buat undangan dalam menit**
Pilih template → isi nama pasangan, tanggal, lokasi → upload foto → sesuaikan warna. Pratinjau langsung tanpa harus publish dulu.

**3. Tambah daftar tamu**
Ketik manual atau import dari file Excel/CSV. Setiap tamu otomatis dapat link unik bertuliskan namanya.

**4. Kirim & pantau**
Bagikan link via WhatsApp, Instagram, atau email. Pantau RSVP masuk dari dashboard secara real-time.

---

## 🔒 Kenapa Self-Hosted?

- **Data tamu tetap di servermu** — nama, nomor HP, informasi kehadiran tidak pernah berpindah ke server orang lain.
- **Tidak ada biaya per undangan** — bayar hosting sendiri, bukan per undangan atau per bulan ke vendor.
- **Tidak bergantung layanan** — jika vendor tutup, undanganmu tetap online selama servermu hidup.
- **Open source & transparan** — kode bisa diaudit, dimodifikasi, dan dikembangkan sesuai kebutuhan.

---

## 🖼️ Tampilan

> *Screenshot menyusul — saat ini dalam tahap pengembangan aktif.*

<!-- Tambahkan screenshot dashboard, template, dan mobile view di sini -->

---

## 👨‍💻 Untuk Developer

### Prerequisites

- Node.js 22+, pnpm 9+, Docker

### Quick Start (Local Dev)

```bash
# 1. Clone
git clone https://github.com/adhidevara/invyte.git
cd invyte

# 2. Install dependencies
pnpm install

# 3. Start dev services (Postgres, Redis, MinIO, Mailpit)
docker compose -f docker/docker-compose.dev.yml up -d

# 4. Configure environment
cp .env.example .env
# Edit .env dengan nilai yang sesuai

# 5. Run migrations
pnpm db:migrate

# 6. Seed database
pnpm db:seed

# 7. Start development server
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

**Dev service UIs:**
- MinIO console: http://localhost:9001 (`undangan_minio` / `undangan_minio_secret`)
- Mailpit (email): http://localhost:8025

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache/Queue | Redis 7 + BullMQ |
| Storage | MinIO (S3-compatible) |
| Auth | Better Auth |
| UI | Tailwind CSS 4 + shadcn/ui |
| Animasi | Framer Motion |
| AI | Claude Haiku + Flux Schnell (fal.ai) |
| Monorepo | Turborepo + pnpm workspaces |
| Linter | Biome |

---

## 📁 Struktur Proyek

```
apps/
  web/              — Next.js app utama (dashboard + public pages + API)
packages/
  db/               — Drizzle ORM schema + migrations
  ui/               — Shared UI components (shadcn/ui)
  shared/           — Types, utils, constants, Zod schemas
  templates/        — Template undangan (React components + MIT license)
  messaging/        — Adapter messaging (WhatsApp, SMTP)
  ai/               — AI generation logic
  storage/          — S3/MinIO abstraction
docker/
  docker-compose.dev.yml   — Dev environment
  docker-compose.yml       — Production
  Dockerfile
```

---

## Roadmap

### MVP — v0.1.0 (~10 minggu)

- [x] **M0** — Monorepo scaffold, CI/CD, tooling
- [ ] **M1** — Auth + multi-tenancy
- [ ] **M2** — Invitation editor + 5 templates
- [ ] **M3** — Guest list + RSVP + personalized links
- [ ] **M4** — Public invitation polish (music, maps, countdown, share)
- [ ] **M5** — Docker self-host deployment
- 🚀 **v0.1.0**

### Phase 2 — v0.2.0 (~12 minggu)

- [ ] **M6** — Messaging (WhatsApp Cloud API + adapters)
- [ ] **M7** — AI template generation
- [ ] **M8** — Digital amplop QRIS
- [ ] **M9** — Analytics dashboard
- [ ] **M10** — QR check-in PWA
- [ ] **M11** — Multi-language (ID/EN/AR/JV/SU)
- 🎉 **v0.2.0**

---

## 🤝 Contributing

Kontribusi sangat disambut! Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap.

Punya pertanyaan atau ide? Buka diskusi di [GitHub Discussions](https://github.com/adhidevara/invyte/discussions).

---

## 📄 Lisensi

- **Core platform:** [AGPL-3.0](LICENSE) — bebas digunakan dan dimodifikasi, tapi perubahan harus tetap open source.
- **Templates (`packages/templates`):** MIT — bebas digunakan di mana saja, termasuk produk komersial.

---

<p align="center">
  Dibuat dengan ❤️ oleh <a href="https://github.com/adhidevara">adhidevara</a> &amp; kontributor<br/>
  Didukung oleh <strong>DevLab.tgk</strong>
</p>
