Yang di Hapus
Section
1. Self-Hosted · Indonesia 
2. Self-Hosted - Data di server sendiri. Privasi penuh. Deploy Docker sekali klik.
3. FAQ Sesuaikan dengan layanan/jasa yang berbayar Apa yang di butuhkan untuk self-hosting?, Apakah data kami aman? dll
4. Di Balik Invyte
DL
DevLab.tgk

Trenggalek · Indonesia
🇮🇩 Berbasis di IndonesiaCustomer-FirstProduct-Led

DevLab.tgk adalah software house Indonesia yang berfokus membangun solusi digital berkualitas tinggi. Kami percaya teknologi terbaik adalah teknologi yang terbuka, dapat diakses semua orang, dan dibangun bersama komunitas.

Invyte adalah produk andalan kami — platform undangan pernikahan digital yang dirancang khusus untuk pasangan Indonesia dengan standar kelas dunia.
@devlab.tgk

Invyte × DevLab.tgk — membangun masa depan undangan digital Indonesia

Text
1. - data di server anda
2. Self-host sendiri, kontrol penuh, tanpa biaya tersembunyi.
3. Self-hosted. Data di server Anda. Deploy dalam hitungan menit.

YAng di Ganti
1. Brand = UcapinStudio

Note :
Semua kata self hosted dihapus
footer perbaharui dengan modifikasi/perubahan kelvin prasetya

---

## Progress Log

### 2026-08-08 — Rebranding checklist di atas: SELESAI

- [x] Section "Self-Hosted · Indonesia" (hero eyebrow badge) — dihapus
- [x] Section "Self-Hosted" feature card — dihapus dari grid fitur
- [x] FAQ self-hosting — dihapus; "Apakah data kami aman?" ditulis ulang tanpa framing self-hosted
- [x] Section "Di Balik Invyte" (DevLab.tgk about-section) — dihapus total (komponen + pemanggilannya)
- [x] Text #1 "— data di server anda" — dihapus dari hero subtext
- [x] Text #2 "Self-host sendiri..." — diganti "Kontrol penuh, tanpa biaya tersembunyi."
- [x] Text #3 "Self-hosted. Data di server Anda..." — diganti "Cepat, mudah, dan siap kirim dalam hitungan menit."
- [x] Brand Invyte → UcapinStudio — bukan cuma landing page: title metadata, navbar, footer, sidebar dashboard, header dashboard, halaman login/register, halaman undangan publik, 1 pesan error API
- [x] Semua kata "self hosted/self-host" lain (testimonial, trust bar, daftar model AI, bullet paket Personal, tagline footer) — dihapus
- [x] Footer copyright → `© 2025 UcapinStudio. Modifikasi oleh Kelvin Prasetya. Open source under AGPLv3.` (referensi AGPL tetap ada, kewajiban hukum)

Verifikasi: `pnpm --filter @invyte/web typecheck` lulus, Biome 0 error.

### 2026-08-08 — Fitur lanjutan: Credit System, Premium Templates & Admin Dashboard

Dibahas terpisah dari checklist rebranding di atas (bukan soal teks/brand lagi, ini
fitur baru). Status:

- [x] Brainstorming selesai — keputusan: model kredit manual (bukan Midtrans/Xendit
  otomatis), 5 dari 7 template jadi premium (bebas: Minimalist Modern, Islamic
  Elegant), role `superadmin`/`admin` via better-auth admin plugin, dashboard admin
  4 halaman (overview, top-up, users, transactions)
- [x] Spec ditulis & di-commit: `docs/superpowers/specs/2026-08-08-credit-system-admin-dashboard-design.md`
- [x] Sudah disetujui user, lanjut ke implementation plan
- [ ] **Belum dikerjakan**: WhatsApp concierge ordering (user kirim data lewat WA,
  admin buatkan undangan) — sengaja ditunda, jadi brainstorming terpisah nanti
- [ ] Implementation plan (`docs/superpowers/plans/...`) — sedang ditulis
- [ ] Eksekusi plan — belum mulai
