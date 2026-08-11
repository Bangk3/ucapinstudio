"use client";

import { InvitationPreview } from "@/components/invitations/invitation-preview";
import { PRESET_MUSIC_TRACKS } from "@/lib/preset-music";
import type { InvitationContent } from "@invyte/templates";
import {
  AnimatePresence,
  type Variants,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Check, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LenisProvider } from "./lenis-provider";

// ── Data ────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "minimalist-modern",
    name: "Minimalist Modern",
    filosifi: "Kesederhanaan adalah kemewahan sejati.",
    desc: "Bersih, kontemporer, elegan. Cocok untuk pasangan modern.",
    palette: ["#f4f7f4", "#6b8f6e", "#4a6b4d"],
    emoji: "🌿",
    tags: ["modern", "minimalis", "hijau"],
  },
  {
    id: "floral-classic",
    name: "Floral Classic",
    filosifi: "Cinta mekar seperti bunga di musim semi.",
    desc: "Romantis dengan sentuhan bunga dan warna krem hangat.",
    palette: ["#fdf5f2", "#c4826a", "#8b5e4a"],
    emoji: "🌸",
    tags: ["romantis", "floral", "klasik"],
  },
  {
    id: "islamic-elegant",
    name: "Islamic Elegant",
    filosifi: "Berkah dari Yang Maha Kuasa untuk dua jiwa yang bersatu.",
    desc: "Islami dengan ornamen kaligrafi dan ayat Al-Quran.",
    palette: ["#0f1b2d", "#c9a84c", "#e8d5a3"],
    emoji: "☪️",
    tags: ["islami", "elegan", "gelap"],
    dark: true,
  },
  {
    id: "tropical-bali",
    name: "Tropical Bali",
    filosifi: "Seindah alam, setulus hati.",
    desc: "Nuansa tropis Bali dengan warna hijau dan terrakota.",
    palette: ["#f0f7f4", "#2d6a4f", "#c87941"],
    emoji: "🌴",
    tags: ["tropis", "bali", "alam"],
  },
  {
    id: "royal-java",
    name: "Royal Java",
    filosifi: "Agung dalam tradisi, abadi dalam cinta.",
    desc: "Mewah bergaya Jawa dengan motif batik dan warna kerajaan.",
    palette: ["#1a0a0d", "#8b1a2e", "#c9a84c"],
    emoji: "👑",
    tags: ["jawa", "batik", "mewah"],
    dark: true,
  },
  {
    id: "serene-garden",
    name: "Serene Garden",
    filosifi: "Di taman ketenangan, cinta kita bersemi.",
    desc: "Elegan romantis dengan nuansa krem hangat, bunga, dan sentuhan Islami.",
    palette: ["#fdf8f4", "#9c7050", "#c9a87a"],
    emoji: "🪻",
    tags: ["islami", "romantis", "floral"],
  },
  {
    id: "modern-boho",
    name: "Modern Boho",
    filosifi: "Alam yang hangat, cinta yang apa adanya.",
    desc: "Nuansa earthy hangat dengan aksen pampas dan huruf kursif hand-lettered.",
    palette: ["#f7f3ec", "#b08968", "#8a5a3b"],
    emoji: "🌾",
    tags: ["boho", "earthy", "romantis"],
  },
  {
    id: "vintage-classic",
    name: "Vintage Classic",
    filosifi: "Kenangan indah yang tak lekang oleh waktu.",
    desc: "Nuansa krem sepia dengan bingkai ornamen dan tipografi serif klasik.",
    palette: ["#f5ecdc", "#8a6d3b", "#c9a86a"],
    emoji: "🕰️",
    tags: ["vintage", "klasik", "sepia"],
  },
  {
    id: "watercolor-botanical",
    name: "Watercolor Botanical",
    filosifi: "Cinta mekar lembut seperti sapuan kuas.",
    desc: "Ilustrasi bunga cat air lembut dengan tekstur kuas yang longgar.",
    palette: ["#fbf8f4", "#7c9a7e", "#a8c3a0"],
    emoji: "🎨",
    tags: ["watercolor", "botanical", "lembut"],
  },
  {
    id: "dark-luxury",
    name: "Dark Luxury",
    filosifi: "Kemewahan tak pernah berteriak, ia hadir dengan tenang.",
    desc: "Hitam emas dengan kesan foil stamp, serif editorial, estetika old money.",
    palette: ["#0c0c0e", "#c9a84c", "#f5e3a0"],
    emoji: "🥂",
    tags: ["luxury", "gelap", "emas"],
    dark: true,
  },
  {
    id: "pastel-dreamy",
    name: "Pastel Dreamy",
    filosifi: "Bermimpi pelan-pelan, mencinta sepenuh hati.",
    desc: "Gradasi pastel lembut dengan elemen ilustrasi whimsical yang menggemaskan.",
    palette: ["#fdf6f8", "#c98fb5", "#a3c4bc"],
    emoji: "🩷",
    tags: ["pastel", "dreamy", "whimsical"],
  },
  {
    id: "rustic-kraft",
    name: "Rustic Kraft",
    filosifi: "Sederhana dari tangan, tulus dari hati.",
    desc: "Tekstur kertas kraft dengan huruf hand-lettered dan aksen kayu/tali.",
    palette: ["#efe6d3", "#8d6e4a", "#b98a5e"],
    emoji: "🪵",
    tags: ["rustic", "kraft", "handmade"],
  },
  {
    id: "geometric-modern",
    name: "Geometric Modern",
    filosifi: "Garis yang tegas, janji yang pasti.",
    desc: "Bentuk geometris tegas, motif line-art bersih, layout editorial grid.",
    palette: ["#fafafa", "#2f4f4f", "#c87941"],
    emoji: "📐",
    tags: ["geometric", "editorial", "modern"],
  },
  {
    id: "photo-editorial",
    name: "Photo Editorial",
    filosifi: "Setiap bingkai menyimpan cerita cinta kita.",
    desc: "Foto hero besar dengan layout tipografi ala majalah mode.",
    palette: ["#ffffff", "#b02a30", "#111111"],
    emoji: "📸",
    tags: ["foto", "editorial", "majalah"],
  },
  {
    id: "minimal-line-art",
    name: "Minimal Line Art",
    filosifi: "Satu garis, satu kisah tanpa akhir.",
    desc: "Ilustrasi garis tunggal ultra-minimal dengan banyak ruang putih.",
    palette: ["#ffffff", "#3a3a3a", "#9a9a9a"],
    emoji: "✏️",
    tags: ["minimalis", "line-art", "modern"],
  },
  {
    id: "sundanese-elegant",
    name: "Sundanese Elegant",
    filosifi: "Mega mendung menaungi, cinta menaungi selamanya.",
    desc: "Motif mega mendung khas Sunda dengan nuansa earth tone lembut.",
    palette: ["#f3ede2", "#6b5b3e", "#a8916a"],
    emoji: "☁️",
    tags: ["sunda", "adat", "mega-mendung"],
  },
  {
    id: "minang-heritage",
    name: "Minang Heritage",
    filosifi: "Songket menyimpan benang emas, cinta menyimpan janji.",
    desc: "Aksen songket emas khas Minang dengan palet merah marun dan emas.",
    palette: ["#fbf7f0", "#8c2f39", "#c9a84c"],
    emoji: "🧵",
    tags: ["minang", "adat", "songket"],
  },
  {
    id: "batak-traditional",
    name: "Batak Traditional",
    filosifi: "Ulos membungkus hangat, doa membungkus bahagia.",
    desc: "Aksen ulos ragidup khas Batak dengan palet merah, hitam, dan putih.",
    palette: ["#faf6f0", "#a3232f", "#2b2b2b"],
    emoji: "🪢",
    tags: ["batak", "adat", "ulos"],
  },
  {
    id: "betawi-modern",
    name: "Betawi Modern",
    filosifi: "Gigi balang menjagai rumah, cinta menjagai hati.",
    desc: "Aksen gigi balang khas Betawi dengan palet merah hangat dan emas.",
    palette: ["#fdf6ef", "#b23a2a", "#c9a84c"],
    emoji: "🏮",
    tags: ["betawi", "adat", "modern"],
  },
  {
    id: "bugis-makassar-elegant",
    name: "Bugis-Makassar Elegant",
    filosifi: "Tenun menyambung benang, takdir menyambung dua insan.",
    desc: "Aksen tenun sarung khas Bugis-Makassar dengan palet jewel tone.",
    palette: ["#f7f3ec", "#2e5d4f", "#c9a84c"],
    emoji: "🧶",
    tags: ["bugis", "makassar", "tenun"],
  },
  {
    id: "arabic-calligraphy-luxe",
    name: "Arabic Calligraphy Luxe",
    filosifi: "Kaligrafi menulis nama-Nya, hati menulis janji kita.",
    desc: "Kaligrafi Arab emas di atas hijau zamrud — kemewahan bernuansa islami.",
    palette: ["#f4f6f2", "#0f4c3a", "#c9a84c"],
    emoji: "🕌",
    tags: ["islami", "kaligrafi", "luxe"],
  },
  {
    id: "ai-composer",
    name: "AI Composer",
    filosifi: "Kreasi tanpa batas, ekspresi tanpa limit.",
    desc: "Layout dibuat oleh AI — pilih blok, gaya, dan animasi sesuka hati.",
    palette: ["#fff0f8", "#DB2777", "#A16207"],
    emoji: "✨",
    tags: ["ai", "dinamis", "kustom"],
  },
];

// "Siap Pakai" excludes AI Composer — that one's build-your-own, not a fixed design.
const TEMPLATE_COUNT = TEMPLATES.filter((t) => t.id !== "ai-composer").length;

// Shared sample content for the homepage template preview modal — one realistic
// invitation reused across every template, only theme colors change per card.
// Free-to-use Unsplash/Pexels photos (verified individually) so the homepage
// preview shows real couple/venue imagery instead of blank space — this is
// demo content only, not the actual couple.
const PREVIEW_COVER_PHOTO =
  "https://images.unsplash.com/photo-1769812343890-4e406a33cfbe?q=80&w=1600&auto=format&fit=crop";

// biome-ignore lint/style/noNonNullAssertion: PRESET_MUSIC_TRACKS is a non-empty constant
const PREVIEW_MUSIC = PRESET_MUSIC_TRACKS[0]!;

const PREVIEW_CONTENT: InvitationContent = {
  hosts: {
    groomName: "Bagas",
    groomFull: "Bagas Pratama",
    groomParents: "Putra dari Bpk. Slamet & Ibu Wulan",
    groomPhotoUrl:
      "https://images.unsplash.com/photo-1567023286549-0e3953fa05a8?q=80&w=600&auto=format&fit=crop",
    brideName: "Cinta",
    brideFull: "Cinta Amelia",
    brideParents: "Putri dari Bpk. Hendra & Ibu Sari",
    bridePhotoUrl: "https://images.pexels.com/photos/10166749/pexels-photo-10166749.jpeg?w=600",
  },
  events: [
    {
      id: "akad",
      name: "Akad Nikah",
      date: "2026-11-14",
      time: "08:00",
      venueName: "Kediaman Mempelai Wanita",
      venueAddress: "Jl. Melati No. 12, Bandung",
    },
    {
      id: "resepsi",
      name: "Resepsi",
      date: "2026-11-14",
      time: "11:00",
      venueName: "Gedung Serbaguna Kartika",
      venueAddress: "Jl. Kartika No. 5, Bandung",
    },
  ],
  story:
    "Kami bertemu di bangku kuliah, tumbuh bersama selama enam tahun, dan kini melangkah ke babak baru dalam hidup — bersama, selamanya.",
  quote: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup.",
  quoteAuthor: "QS. Ar-Rum: 21",
  galleryUrls: [
    "https://images.unsplash.com/photo-1758810410416-0d4dd2a7a6cc?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1769038936715-738ab99f1362?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1686125616977-34f6d5979eb1?q=80&w=800&auto=format&fit=crop",
  ],
  timeline: [
    { year: "2019", title: "Pertama Bertemu", emoji: "💫" },
    { year: "2023", title: "Melamar", emoji: "💍" },
    { year: "2026", title: "Menikah", emoji: "💒" },
  ],
};

const FEATURES = [
  {
    title: `${TEMPLATE_COUNT} Template Siap Pakai`,
    desc: `Dari minimalis modern sampai adat Jawa, Sunda, Batak, Minang, dan lainnya — plus AI Composer untuk bikin gaya sendiri.`,
    icon: "✦",
    size: "tall",
    color: "from-brand-50 to-brand-100",
  },
  {
    title: "RSVP Real-Time",
    desc: "Tamu konfirmasi langsung dari undangan. Dashboard update otomatis.",
    icon: "📋",
    size: "normal",
    color: "from-emerald-50 to-teal-100",
  },
  {
    title: "Kirim via WhatsApp",
    desc: "Broadcast personal ke semua tamu — via Fonnte, Cloud API, atau SMTP.",
    icon: "💬",
    size: "normal",
    color: "from-amber-50 to-yellow-100",
  },
  {
    title: "AI Generate",
    desc: "Tulis nama & tema, AI langsung susun teks undangan yang indah.",
    icon: "✨",
    size: "wide",
    color: "from-violet-50 to-purple-100",
  },
  {
    title: "Dukungan Cepat",
    desc: "Tim support responsif. Bantuan setup dan kustomisasi kapan pun dibutuhkan.",
    icon: "⚙️",
    size: "normal",
    color: "from-blue-50 to-indigo-100",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Buat Workspace",
    desc: "Daftar dan pilih nama workspace. Selesai dalam 30 detik.",
  },
  {
    num: "02",
    title: "Pilih Template & Isi Detail",
    desc: "Pilih desain, masukkan nama, tanggal, venue, dan foto kenangan.",
  },
  {
    num: "03",
    title: "Kirim & Pantau",
    desc: "Broadcast via WhatsApp, pantau RSVP live dari dashboard.",
  },
];

const TESTIMONIALS = [
  {
    name: "Rina & Bagas",
    loc: "Jakarta",
    text: "Undangan digital paling cantik yang pernah kami lihat. Tamu kami terpukau!",
  },
  {
    name: "Sari & Dino",
    loc: "Surabaya",
    text: "Setup 20 menit, broadcast ke 300 tamu lewat WA. Luar biasa mudah.",
  },
  {
    name: "Dita & Farel",
    loc: "Bandung",
    text: "Template Lotus persis vibe yang kami mau. Privasi terjaga.",
  },
  {
    name: "Mega & Rio",
    loc: "Yogyakarta",
    text: "Fitur RSVP real-time membantu banget saat koordinasi katering.",
  },
  {
    name: "Vivi & Andri",
    loc: "Bali",
    text: "AI-nya nulis teks undangan dengan bahasa puitis yang kami suka banget!",
  },
  {
    name: "Dewi & Hendra",
    loc: "Medan",
    text: "Bisa custom sesuai adat Batak kami. Keren!",
  },
];

const FAQS = [
  {
    q: "Berapa biaya menggunakan UcapinStudio?",
    a: "Hubungi tim kami untuk info paket dan harga yang sesuai kebutuhan pernikahan Anda.",
  },
  {
    q: "Bisakah mengirim ke WhatsApp tanpa Cloud API?",
    a: "Ya. UcapinStudio mendukung Fonnte dan Wablas sebagai alternatif Cloud API resmi Meta. Juga bisa via SMTP untuk email.",
  },
  {
    q: "Berapa banyak tamu yang bisa diundang?",
    a: "Tidak ada batas tamu per undangan. Batasan hanya pada plan workspace (personal: 3 undangan, org: unlimited).",
  },
  {
    q: "Apakah data kami aman?",
    a: "Data Anda dienkripsi dan disimpan dengan aman di server kami, dilindungi sesuai standar keamanan data.",
  },
];

// ── Shared Motion Variants ────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── Navbar ─────────────────────────────────────────────────────────────────────

function Navbar({ showAdminCta }: { showAdminCta: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctaOpen, setCtaOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-brand-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-script text-3xl leading-none" style={{ color: "var(--hp-pink)" }}>
            UcapinStudio
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-brand-600 transition-colors">
            Fitur
          </a>
          <a href="#templates" className="hover:text-brand-600 transition-colors">
            Template
          </a>
          <a href="#pricing" className="hover:text-brand-600 transition-colors">
            Harga
          </a>
          <a href="#faq" className="hover:text-brand-600 transition-colors">
            FAQ
          </a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors px-3 py-1.5"
          >
            Masuk
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--hp-pink), var(--color-brand-600))",
            }}
          >
            Mulai Sekarang
          </Link>
          {showAdminCta && (
            <button
              type="button"
              onClick={() => setCtaOpen(true)}
              className="text-sm font-semibold px-4 py-2 rounded-full border transition-colors hover:bg-brand-50"
              style={{ borderColor: "var(--hp-gold-light)", color: "var(--hp-dark)" }}
            >
              Di Buatin Admin?
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-brand-50 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-brand-100"
          >
            <div className="flex flex-col gap-1 px-6 py-4 text-sm font-medium text-slate-600">
              {["features", "templates", "pricing", "faq"].map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMenuOpen(false)}
                  className="py-2 capitalize hover:text-brand-600 transition-colors"
                >
                  {id === "faq" ? "FAQ" : id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  className="py-2 text-center border border-brand-200 rounded-full hover:bg-brand-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="py-2 text-center rounded-full text-white font-semibold"
                  style={{
                    background: "linear-gradient(135deg, var(--hp-pink), var(--color-brand-600))",
                  }}
                >
                  Mulai Sekarang
                </Link>
                {showAdminCta && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setCtaOpen(true);
                    }}
                    className="py-2 text-center border rounded-full font-semibold"
                    style={{ borderColor: "var(--hp-gold-light)", color: "var(--hp-dark)" }}
                  >
                    Di Buatin Admin?
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {ctaOpen && <AdminCtaModal onClose={() => setCtaOpen(false)} />}
    </motion.nav>
  );
}

// ── Invitation Card (parallax + template cycle) ────────────────────────────────

function InvitationCard() {
  const [current, setCurrent] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(smoothY, [0, 1], [12, -12]);
  const rotateY = useTransform(smoothX, [0, 1], [-12, 12]);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % TEMPLATES.length), 3000);
    return () => clearInterval(timer);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  // biome-ignore lint/style/noNonNullAssertion: TEMPLATES is non-empty constant, index is always valid
  const tpl = TEMPLATES[current] ?? TEMPLATES[0]!;

  return (
    <div
      ref={cardRef}
      className="relative flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "900px" }}
    >
      {/* Glow blob */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 60% 40%, ${tpl.palette[1]}88, transparent 70%)`,
        }}
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-72 md:w-80 rounded-3xl shadow-2xl overflow-hidden cursor-default"
      >
        {/* Card background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
            style={{ backgroundColor: tpl.palette[0] }}
          >
            {/* Card header ornament */}
            <div
              className="h-2 w-full"
              style={{ background: `linear-gradient(90deg, ${tpl.palette[1]}, ${tpl.palette[2]})` }}
            />

            {/* Card content */}
            <div className="px-8 py-10 text-center">
              <div className="text-4xl mb-3">{tpl.emoji}</div>
              <p
                className="text-xs font-medium tracking-widest uppercase mb-2"
                style={{ color: tpl.palette[2] }}
              >
                Dengan Rahmat Tuhan Yang Maha Esa
              </p>
              <div
                className="my-4 h-px w-16 mx-auto opacity-30"
                style={{ background: tpl.palette[1] }}
              />
              <p
                className="text-xs mb-1 opacity-60"
                style={{ color: tpl.dark ? "#fff" : "#64748b" }}
              >
                Kami mengundang kehadiran Bapak/Ibu/Sdr/i
              </p>
              <div
                className="font-serif text-2xl font-bold my-3 leading-tight"
                style={{ color: tpl.palette[1] }}
              >
                Rizky Fahreza
                <br />
                <span className="text-lg font-medium opacity-70">&amp; Siti Ramadhani</span>
              </div>
              <p
                className="text-xs mt-3 opacity-50"
                style={{ color: tpl.dark ? "#fff" : "#64748b" }}
              >
                Sabtu, 21 Juni 2025 · Gedung Serbaguna Ananda
              </p>
              <div
                className="mt-5 inline-flex items-center gap-1 text-xs font-medium px-4 py-1.5 rounded-full"
                style={{ background: `${tpl.palette[1]}33`, color: tpl.palette[1] }}
              >
                RSVP →
              </div>
            </div>

            {/* Template badge — name + filosifi */}
            <div className="px-6 pb-5 border-t pt-3" style={{ borderColor: `${tpl.palette[1]}22` }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: tpl.palette[1] }}>
                {tpl.name}
              </p>
              <p
                className="text-xs italic leading-snug opacity-60"
                style={{ color: tpl.dark ? "#e2e8f0" : "#475569" }}
              >
                &ldquo;{tpl.filosifi}&rdquo;
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Template dots */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
        {TEMPLATES.map((_, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setCurrent(i)}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i === current ? "var(--hp-pink)" : "var(--hp-gold-light)",
              width: i === current ? "1.5rem" : "0.375rem",
            }}
          />
        ))}
      </div>

      {/* Floating petals */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-petal pointer-events-none absolute text-base"
          style={{
            left: `${10 + i * 15}%`,
            top: `-${20 + i * 10}%`,
            animationDuration: `${6 + i * 1.5}s`,
            animationDelay: `${i * 0.9}s`,
            opacity: 0,
          }}
        >
          {i % 2 === 0 ? "🌸" : "✿"}
        </div>
      ))}
    </div>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────────

function HeroSection({ showAdminCta }: { showAdminCta: boolean }) {
  const [ctaOpen, setCtaOpen] = useState(false);
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{
        background:
          "linear-gradient(135deg, var(--hp-blush) 0%, #fff 50%, var(--hp-blush-mid) 100%)",
      }}
    >
      {/* Background decorative circles */}
      <div
        className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--hp-gold-light), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--hp-pink), transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left: copy */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* Headline */}
          <motion.div variants={fadeUp}>
            <h1
              className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
              style={{ color: "var(--hp-dark)" }}
            >
              Undangan Digital
              <br />
              <span
                className="font-script text-6xl md:text-7xl lg:text-8xl font-normal"
                style={{ color: "var(--hp-pink)", display: "block", lineHeight: 1.2 }}
              >
                yang Berkesan
              </span>
            </h1>
          </motion.div>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-slate-500 max-w-md leading-relaxed"
          >
            Buat undangan pernikahan digital yang indah, kirim ke semua tamu via WhatsApp, dan
            pantau RSVP secara real-time.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-4 items-center">
              <MagneticButton href="/auth/register" primary>
                Mulai Sekarang
              </MagneticButton>
              {showAdminCta && (
                <MagneticButton href="#" onClick={() => setCtaOpen(true)}>
                  Di Buatin Admin aja?
                </MagneticButton>
              )}
            </div>
            <a
              href="#templates"
              className="group flex items-center gap-2 text-sm font-medium transition-colors w-fit"
              style={{ color: "var(--hp-dark)" }}
            >
              <span className="underline-offset-4 group-hover:underline">Lihat Template</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {["R", "S", "D", "V", "M"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: ["#DB2777", "#A16207", "#166534", "#7C3AED", "#B91C1C"][i] }}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Dipercaya <span className="font-semibold text-slate-700">500+ pasangan</span>{" "}
              Indonesia
            </p>
          </motion.div>
        </motion.div>

        {/* Right: invitation card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end pb-10"
        >
          <InvitationCard />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 hover:text-brand-500 transition-colors"
      >
        <span className="text-[10px] tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.a>
      {ctaOpen && <AdminCtaModal onClose={() => setCtaOpen(false)} />}
    </section>
  );
}

// ── Magnetic Button ────────────────────────────────────────────────────────────

function MagneticButton({
  href,
  children,
  primary,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.4);
    y.set((e.clientY - cy) * 0.4);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const btnStyle = primary
    ? {
        x: sx,
        y: sy,
        background: "linear-gradient(135deg, var(--hp-pink) 0%, var(--color-brand-600) 100%)",
        color: "#fff",
        boxShadow: "0 8px 30px var(--hp-pink)55",
      }
    : {
        x: sx,
        y: sy,
        background: "#fff",
        color: "var(--hp-dark)",
        border: "1.5px solid var(--border)",
      };

  return (
    <motion.a
      ref={ref}
      href={href}
      style={btnStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={
        onClick
          ? (e) => {
              e.preventDefault();
              onClick();
            }
          : undefined
      }
      whileTap={{ scale: 0.96 }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold shadow-lg transition-shadow hover:shadow-xl"
    >
      {children}
    </motion.a>
  );
}

// ── "Dibuatin Admin aja" — self-service order form ──────────────────────────────
// Collects the same wedding details as the token-based intake form
// (components/orders/order-intake-form.tsx), but standalone since there's no
// order yet — submitting creates one (see /api/v1/orders/public) instead of
// filling in an admin-created one.

interface CtaEventRow {
  id: string;
  name: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
}

function newCtaEvent(): CtaEventRow {
  return { id: crypto.randomUUID(), name: "", date: "", time: "", venueName: "", venueAddress: "" };
}

function AdminCtaModal({ onClose }: { onClose: () => void }) {
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [contact, setContact] = useState("");
  const [story, setStory] = useState("");
  const [events, setEvents] = useState<CtaEventRow[]>([newCtaEvent()]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  function updateEvent(id: string, patch: Partial<CtaEventRow>) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!groomName.trim() || !brideName.trim()) {
      setError("Nama mempelai wajib diisi");
      return;
    }
    if (!contact.trim()) {
      setError("Nomor WhatsApp wajib diisi");
      return;
    }
    if (!proofFile) {
      setError("Bukti transfer wajib diupload");
      return;
    }
    if (!events.some((ev) => ev.name.trim())) {
      setError("Minimal isi 1 acara (nama acara wajib diisi)");
      return;
    }
    if (galleryFiles.length > 10) {
      setError("Maksimal 10 foto galeri");
      return;
    }

    setSubmitting(true);
    try {
      const submittedData = {
        hosts: { groomName: groomName.trim(), brideName: brideName.trim() },
        events: events
          .filter((ev) => ev.name.trim())
          .map((ev) => ({
            id: ev.id,
            name: ev.name.trim(),
            ...(ev.date ? { date: ev.date } : {}),
            ...(ev.time ? { time: ev.time } : {}),
            ...(ev.venueName ? { venueName: ev.venueName } : {}),
            ...(ev.venueAddress ? { venueAddress: ev.venueAddress } : {}),
          })),
        ...(story.trim() ? { story: story.trim() } : {}),
      };

      const formData = new FormData();
      formData.append("customerContact", contact.trim());
      formData.append("submittedData", JSON.stringify(submittedData));
      formData.append("proofImage", proofFile);
      for (const file of galleryFiles) formData.append("galleryImages", file);

      const res = await fetch("/api/v1/orders/public", { method: "POST", body: formData });
      const data = (await res.json().catch(() => ({}))) as { error?: string; publicUrl?: string };
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim");
      setResultUrl(data.publicUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden="true"
      />
      <dialog
        open
        aria-label="Form Dibuatin Admin"
        className="fixed inset-x-0 top-[5vh] z-[100] mx-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {resultUrl ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-2xl">🎉</p>
            <p className="text-lg font-semibold" style={{ color: "var(--hp-dark)" }}>
              Terkirim!
            </p>
            <p className="text-sm text-slate-500">
              Tim kami akan memproses pembayaran & mulai menyiapkan undangan Anda.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, var(--hp-pink), var(--color-brand-600))",
              }}
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold" style={{ color: "var(--hp-dark)" }}>
                Di Buatin Admin Aja
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Isi data undangan Anda, kami yang bikinkan. Tim kami akan follow-up lewat WhatsApp.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Nama Mempelai Pria"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Nama Mempelai Wanita"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <input
                required
                type="tel"
                placeholder="Nomor WhatsApp Anda (mis. 6281234567890)"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Acara</p>
                {events.map((event) => (
                  <div key={event.id} className="space-y-2 rounded-lg border p-3">
                    <input
                      placeholder="Nama acara (mis. Akad, Resepsi)"
                      value={event.name}
                      onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={event.date}
                        onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="time"
                        value={event.time}
                        onChange={(e) => updateEvent(event.id, { time: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <input
                      placeholder="Nama lokasi"
                      value={event.venueName}
                      onChange={(e) => updateEvent(event.id, { venueName: e.target.value })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEvents((prev) => [...prev, newCtaEvent()])}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--hp-pink)" }}
                >
                  + Tambah acara
                </button>
              </div>

              <textarea
                placeholder="Cerita singkat (opsional)"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />

              <div className="space-y-1.5">
                <label htmlFor="cta-gallery" className="text-xs font-medium text-slate-500">
                  Foto Pasangan (opsional, maks. 10)
                </label>
                <input
                  id="cta-gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []).slice(0, 10))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cta-proof" className="text-xs font-medium text-slate-500">
                  Bukti Transfer *
                </label>
                <input
                  id="cta-proof"
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--hp-pink), var(--color-brand-600))",
                }}
              >
                {submitting ? "Mengirim..." : "Kirim"}
              </button>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}

// ── Social Proof / Trust bar ───────────────────────────────────────────────────

function TrustBar() {
  const items = [
    `🌸 ${TEMPLATE_COUNT} Template Siap Pakai`,
    "💬 WhatsApp Broadcast",
    "✨ AI Text Generator",
    "📊 RSVP Real-Time",
    "🔒 Data Aman",
    "⚙️ Dukungan Cepat",
    "🎯 Multi-Tenant",
    "📁 Manajemen Tamu CSV",
  ];

  return (
    <section
      className="py-6 border-y overflow-hidden"
      style={{ borderColor: "var(--hp-gold-light)", background: "var(--hp-blush)" }}
    >
      <div className="flex" aria-hidden>
        <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="text-sm font-medium text-slate-500 flex items-center gap-2">
              {item}
              <span className="text-brand-300 mx-2">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features Bento ─────────────────────────────────────────────────────────────

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--hp-gold)" }}
          >
            Fitur Unggulan
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-4xl md:text-5xl font-bold"
            style={{ color: "var(--hp-dark)" }}
          >
            Semua yang Anda butuhkan
            <br />
            <span
              className="font-script font-normal text-5xl md:text-6xl"
              style={{ color: "var(--hp-pink)" }}
            >
              dalam satu platform
            </span>
          </motion.h2>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.25 }}
              className={`relative rounded-2xl p-6 bg-gradient-to-br ${f.color} border border-white/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                f.size === "tall" ? "md:row-span-2" : f.size === "wide" ? "lg:col-span-2" : ""
              }`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3
                className="font-serif text-xl font-semibold mb-2"
                style={{ color: "var(--hp-dark)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>

              {/* Decorative corner */}
              <div
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, var(--hp-gold), transparent)" }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── AI Generate ─────────────────────────────────────────────────────────────

const AI_MODELS = [
  {
    id: "claude",
    name: "Claude 3.5",
    vendor: "Anthropic",
    color: "#D97706",
    initials: "Cl",
    output:
      "Dengan segenap kebahagiaan dan rasa syukur kepada Tuhan YME, kami mengundang kehadiran Bapak/Ibu/Saudara/i untuk turut bersuka cita dalam pernikahan kami.\n\nAhmad & Fatimah\nSabtu, 15 Maret 2025 · 09.00 WIB\nGedung Al-Hikmah, Jakarta\n\nKehadiran dan doa restu Anda adalah kebahagiaan terbesar bagi kami.",
  },
  {
    id: "gpt4o",
    name: "GPT-4o",
    vendor: "OpenAI",
    color: "#10B981",
    initials: "G4",
    output:
      "It is our greatest honor to invite you to witness the union of Ahmad & Fatimah.\n\nSaturday, March 15, 2025 · 09:00 AM\nGedung Al-Hikmah, Jakarta\n\nYour presence and blessings would make this moment truly complete. We look forward to celebrating with you.",
  },
  {
    id: "gemini",
    name: "Gemini 2.0",
    vendor: "Google",
    color: "#4285F4",
    initials: "Gm",
    output:
      "Hai! Ahmad & Fatimah akan melangsungkan pernikahan dan mengundang kamu untuk hadir bersama.\n\n📅 Sabtu, 15 Maret 2025 · 09.00 WIB\n📍 Gedung Al-Hikmah, Jakarta\n\nAyo rayakan momen spesial ini bersama! Konfirmasi kehadiran via tombol RSVP di bawah ya.",
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    vendor: "DeepSeek AI",
    color: "#06B6D4",
    initials: "DS",
    output:
      "Dengan rendah hati kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam pernikahan kami:\n\nAhmad & Fatimah\nSabtu, 15 Maret 2025 · Pukul 09.00 – selesai\nGedung Al-Hikmah, Jakarta\n\nKehadiran Anda adalah anugerah dan doa terbaik bagi kami berdua.",
  },
  {
    id: "llama",
    name: "Llama 3",
    vendor: "Meta · Lokal",
    color: "#8B5CF6",
    initials: "L3",
    output:
      "Assalamu'alaikum Warahmatullahi Wabarakatuh\n\nKami mengundang Bapak/Ibu/Saudara/i:\n\nPernikahan Ahmad & Fatimah\nSabtu, 15 Maret 2025 · 09.00 WIB\nGedung Al-Hikmah, Jakarta\n\nKehadiran Anda sungguh berarti bagi kami.\n\nWassalamu'alaikum Wr. Wb.",
  },
] as const;

/* Stable star positions — seeded, no Math.random() in render (avoids hydration mismatch) */
const STARS = Array.from({ length: 36 }, (_, i) => ({
  left: ((i * 137.508 + 11) % 100).toFixed(2),
  top: ((i * 97.3 + 7) % 100).toFixed(2),
  size: ((i % 3) + 1).toFixed(1),
  opacity: (((i % 5) + 1) * 0.08).toFixed(2),
}));

function AIGenerateSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeModel = AI_MODELS[activeIdx]!;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayed("");
    setIsTyping(true);
    let i = 0;
    const target = activeModel.output;
    intervalRef.current = setInterval(() => {
      i += 1;
      setDisplayed(target.slice(0, i));
      if (i >= target.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, 16);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      ref={ref}
      className="py-24 px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)",
      }}
      aria-label="Generate teks undangan dengan AI"
    >
      {/* Stable stars bg */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {STARS.map((s, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "rgba(167,139,250,0.7)" }}
          >
            Didukung berbagai model AI
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Teks Undangan,{" "}
            <span style={{ color: activeModel.color, transition: "color 0.3s" }}>Ditulis AI</span>
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
            Pilih model AI favoritmu — UcapinStudio kirim prompt terstruktur, AI tulis teksnya dalam
            hitungan detik.
          </p>
        </motion.div>

        {/* Model selector tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-2 flex-wrap justify-center mb-8"
          role="tablist"
          aria-label="Pilih model AI"
        >
          {AI_MODELS.map((model, idx) => (
            <button
              key={model.id}
              type="button"
              role="tab"
              aria-selected={activeIdx === idx}
              onClick={() => setActiveIdx(idx)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
              style={
                activeIdx === idx
                  ? {
                      background: `${model.color}1a`,
                      border: `1px solid ${model.color}55`,
                      color: model.color,
                      boxShadow: `0 0 16px ${model.color}1a`,
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.4)",
                    }
              }
            >
              <span
                className="inline-flex items-center justify-center rounded font-black"
                style={{
                  width: 18,
                  height: 18,
                  fontSize: 7,
                  letterSpacing: "-0.5px",
                  background: activeIdx === idx ? model.color : "rgba(255,255,255,0.12)",
                  color: "white",
                  borderRadius: 4,
                  flexShrink: 0,
                  fontFamily: "system-ui, sans-serif",
                }}
                aria-hidden="true"
              >
                {model.initials}
              </span>
              {model.name}
            </button>
          ))}
        </motion.div>

        {/* Main 2-col card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Left — prompt (decorative) */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Input Prompt
            </p>
            <div
              className="rounded-xl p-4 font-mono text-xs leading-loose"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.55)",
                minHeight: 170,
              }}
            >
              <span style={{ color: "rgba(167,139,250,0.6)" }}>nama</span>
              {":   "}
              <span style={{ color: "#86efac" }}>Ahmad & Fatimah</span>
              <br />
              <span style={{ color: "rgba(167,139,250,0.6)" }}>tanggal</span>
              {": "}
              <span style={{ color: "#86efac" }}>15 Maret 2025</span>
              <br />
              <span style={{ color: "rgba(167,139,250,0.6)" }}>tema</span>
              {":   "}
              <span style={{ color: "#86efac" }}>Islami Elegan</span>
              <br />
              <span style={{ color: "rgba(167,139,250,0.6)" }}>lokasi</span>
              {":  "}
              <span style={{ color: "#86efac" }}>Gedung Al-Hikmah, Jakarta</span>
              <br />
              <span style={{ color: "rgba(167,139,250,0.6)" }}>bahasa</span>
              {":  "}
              <span style={{ color: "#86efac" }}>Indonesia</span>
              <br />
              <span style={{ color: "rgba(167,139,250,0.6)" }}>model</span>
              {":   "}
              <span style={{ color: activeModel.color, transition: "color 0.3s" }}>
                {activeModel.name}
              </span>
            </div>

            {/* Model info */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center rounded font-black text-white"
                style={{
                  width: 20,
                  height: 20,
                  fontSize: 7,
                  background: activeModel.color,
                  borderRadius: 5,
                  flexShrink: 0,
                  fontFamily: "system-ui, sans-serif",
                  transition: "background 0.3s",
                }}
                aria-hidden="true"
              >
                {activeModel.initials}
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                via <span style={{ color: "rgba(255,255,255,0.55)" }}>{activeModel.vendor}</span>
              </span>
              {isTyping && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${activeModel.color}18`,
                    color: activeModel.color,
                    fontSize: 10,
                    transition: "all 0.3s",
                  }}
                >
                  generating…
                </span>
              )}
            </div>
          </div>

          {/* Right — typed output */}
          <div
            className="rounded-2xl p-5 transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${activeModel.color}33`,
              boxShadow: `0 0 32px ${activeModel.color}0d`,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: activeModel.color, opacity: 0.65, transition: "color 0.3s" }}
            >
              Output
            </p>
            <div
              className="text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.72)",
                minHeight: 170,
                whiteSpace: "pre-wrap",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
              aria-live="polite"
              aria-label="Teks undangan yang di-generate AI"
            >
              {displayed}
              {isTyping && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: "1em",
                    background: activeModel.color,
                    marginLeft: 1,
                    verticalAlign: "text-bottom",
                    animation: "blink 0.65s step-end infinite",
                    transition: "background 0.3s",
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-10 text-center"
        >
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-all hover:scale-105 hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
            }}
          >
            Coba AI Composer
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            Claude · GPT-4o · Gemini · DeepSeek · Llama
          </p>
        </motion.div>
      </div>

      {/* Cursor blink keyframe */}
      <style>{"@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}"}</style>
    </section>
  );
}

// ── Template Showcase ──────────────────────────────────────────────────────────

function TemplatePreviewModal({
  templateId,
  templateName,
  onClose,
}: {
  templateId: string;
  templateName: string;
  onClose: () => void;
}) {
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden="true"
      />
      <dialog
        open
        aria-label={`Preview ${templateName}`}
        className="fixed inset-x-0 top-[3vh] z-[100] mx-auto flex max-h-[94vh] w-[390px] max-w-[92vw] flex-col overflow-hidden rounded-[2rem] bg-white p-0 shadow-2xl"
      >
        <div className="flex flex-none items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold" style={{ color: "var(--hp-dark)" }}>
            {templateName}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup preview"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {/* Music auto-play is intentionally disabled inside preview mode (across
            every template) so it doesn't fire repeatedly while editing — this
            gives visitors a manual, muted-by-default way to hear an example
            track without touching that gate. */}
        <div className="flex flex-none items-center gap-2 border-b bg-slate-50 px-4 py-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">🎵 Musik contoh:</span>
          <audio
            src={PREVIEW_MUSIC.url}
            controls
            preload="none"
            className="h-8 flex-1"
            aria-label={`Contoh musik latar: ${PREVIEW_MUSIC.title}`}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <InvitationPreview
            templateId={templateId}
            content={PREVIEW_CONTENT}
            theme={{
              primaryColor: tpl?.palette[1] ?? "#6b8f6e",
              accentColor: tpl?.palette[2] ?? "#4a6b4d",
              coverPhotoUrl: PREVIEW_COVER_PHOTO,
            }}
            slug="preview"
            tenantSlug="preview"
            guestName="Tamu Undangan"
          />
        </div>
      </dialog>
    </>
  );
}

function TemplatesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTemplate = TEMPLATES.find((t) => t.id === previewId);

  // Auto-shift the card row so all templates surface without manual dragging;
  // pause while a visitor is actually interacting with it. Continuous
  // rAF crawl (not periodic smooth-scroll jumps) so the motion reads as one
  // steady glide instead of a start-stop every couple seconds.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const CRAWL_SPEED = 40; // px/second

  useEffect(() => {
    if (paused) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const el = scrollerRef.current;
      if (el) {
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        el.scrollLeft = atEnd ? 0 : el.scrollLeft + CRAWL_SPEED * dt;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return (
    <section
      id="templates"
      className="py-24 overflow-hidden"
      ref={ref}
      style={{ background: "linear-gradient(180deg, var(--hp-blush) 0%, #fff 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--hp-gold)" }}
          >
            {TEMPLATE_COUNT} Template Siap Pakai
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-4xl md:text-5xl font-bold"
            style={{ color: "var(--hp-dark)" }}
          >
            Elegan oleh{" "}
            <span
              className="font-script font-normal text-5xl md:text-6xl"
              style={{ color: "var(--hp-pink)" }}
            >
              seniman lokal
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-slate-500 max-w-lg mx-auto">
            Setiap template dirancang khusus untuk pernikahan adat Indonesia — dari Jawa, Sunda,
            Batak, hingga modern minimalis.
          </motion.p>
        </motion.div>

        {/* Template cards — auto-shifting horizontal scroll, pauses on hover/touch */}
        <motion.div
          ref={scrollerRef}
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          className={`flex gap-6 overflow-x-auto pb-6 no-scrollbar ${paused ? "snap-x snap-mandatory" : ""}`}
          style={{ scrollbarWidth: "none" }}
        >
          {TEMPLATES.map((tpl) => (
            <motion.div
              key={tpl.id}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="flex-none w-72 rounded-2xl shadow-lg overflow-hidden snap-start cursor-pointer flex flex-col"
              style={{ background: tpl.palette[0] }}
            >
              {/* Top accent bar */}
              <div
                className="h-2 flex-none"
                style={{
                  background: `linear-gradient(90deg, ${tpl.palette[1]}, ${tpl.palette[2]})`,
                }}
              />

              <div className="p-6 flex flex-col flex-1">
                {/* Emoji + name */}
                <div className="text-4xl mb-3">{tpl.emoji}</div>
                <div
                  className="font-serif text-xl font-bold mb-1"
                  style={{ color: tpl.palette[1] }}
                >
                  {tpl.name}
                </div>

                {/* Filosifi */}
                <p
                  className="text-xs italic font-medium mb-3 leading-relaxed"
                  style={{ color: tpl.palette[2] }}
                >
                  &ldquo;{tpl.filosifi}&rdquo;
                </p>

                {/* Desc */}
                <p
                  className="text-xs leading-relaxed mb-4 opacity-70"
                  style={{ color: tpl.dark ? "#e2e8f0" : "#475569" }}
                >
                  {tpl.desc}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{
                        background: `${tpl.palette[1]}18`,
                        color: tpl.palette[1],
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Color swatches */}
                <div className="flex gap-1.5 mb-4">
                  {tpl.palette.map((c, j) => (
                    <div
                      key={j}
                      className="w-4 h-4 rounded-full border-2 shadow-sm"
                      style={{ background: c, borderColor: tpl.dark ? "#ffffff22" : "#00000011" }}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewId(tpl.id)}
                    className="flex-1 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors hover:bg-slate-50"
                    style={{ borderColor: tpl.palette[1], color: tpl.palette[1] }}
                  >
                    👁 Preview
                  </button>
                  <Link
                    href={`/auth/register?template=${tpl.id}`}
                    className="flex-1 text-center text-[11px] font-bold px-3 py-1.5 rounded-full text-white transition-transform hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${tpl.palette[1]}, ${tpl.palette[2]})`,
                    }}
                  >
                    Siap Pakai
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {previewTemplate && (
        <TemplatePreviewModal
          templateId={previewTemplate.id}
          templateName={previewTemplate.name}
          onClose={() => setPreviewId(null)}
        />
      )}
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--hp-gold)" }}
          >
            Cara Kerja
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-4xl md:text-5xl font-bold"
            style={{ color: "var(--hp-dark)" }}
          >
            Siap dalam{" "}
            <span
              className="font-script font-normal text-5xl md:text-6xl"
              style={{ color: "var(--hp-pink)" }}
            >
              3 langkah
            </span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px"
            style={{ background: "linear-gradient(90deg, var(--hp-pink), var(--hp-gold))" }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white mb-6 shadow-lg relative z-10"
                style={{ background: "linear-gradient(135deg, var(--hp-pink), var(--hp-gold))" }}
              >
                {step.num}
              </div>
              <h3
                className="font-serif text-xl font-semibold mb-3"
                style={{ color: "var(--hp-dark)" }}
              >
                {step.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats Counter ──────────────────────────────────────────────────────────────

function CountUpNumber({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) {
        setVal(to);
        clearInterval(timer);
      } else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const stats = [
    { val: 500, suffix: "+", label: "Pasangan Bahagia" },
    { val: 50000, suffix: "+", label: "Tamu Diundang" },
    { val: TEMPLATE_COUNT, suffix: " Template", label: "Desain Siap Pakai" },
    { val: 99, suffix: "%", label: "Tingkat Pengiriman WA" },
  ];

  return (
    <section
      className="py-20 px-6"
      style={{
        background: "linear-gradient(135deg, var(--hp-dark) 0%, oklch(0.18 0.04 285) 100%)",
      }}
      ref={ref}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {stats.map((s, i) => (
            <motion.div key={i} variants={fadeUp}>
              <div
                className="font-serif text-4xl md:text-5xl font-bold mb-1"
                style={{ color: "var(--hp-gold)" }}
              >
                <CountUpNumber to={s.val} suffix={s.suffix} />
              </div>
              <p className="text-sm text-white/60">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Cultural Section ───────────────────────────────────────────────────────────

function CulturalSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="py-24 px-6 overflow-hidden"
      style={{ background: "var(--hp-blush)" }}
      ref={ref}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeUp}>
            <p
              className="text-sm font-semibold tracking-widest uppercase mb-3"
              style={{ color: "var(--hp-gold)" }}
            >
              Dibuat untuk Indonesia
            </p>
            <h2
              className="font-serif text-4xl md:text-5xl font-bold mb-6"
              style={{ color: "var(--hp-dark)" }}
            >
              Menghormati{" "}
              <span
                className="font-script font-normal text-5xl"
                style={{ color: "var(--hp-pink)" }}
              >
                tradisi
              </span>
              <br />
              dalam sentuhan modern
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Dari undangan adat Jawa yang penuh makna hingga desain modern minimalis — UcapinStudio
              memahami kekayaan budaya pernikahan Indonesia. Dukungan multi-bahasa (ID, EN, JV, SU,
              AR) segera hadir.
            </p>
            <ul className="space-y-3">
              {[
                "Akad & Resepsi sebagai event terpisah",
                "Dukungan tanggal Hijriyah (segera)",
                "Amplop digital QRIS & e-wallet",
                "Teks undangan bahasa Jawa & Sunda (segera)",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-none"
                    style={{ background: "var(--hp-pink)", color: "#fff" }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Decorative pattern */}
          <motion.div variants={fadeUp} className="relative flex items-center justify-center h-80">
            {/* Layered circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[1, 0.7, 0.45].map((scale, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border-2"
                  style={{
                    width: `${scale * 100}%`,
                    height: `${scale * 100}%`,
                    borderColor:
                      i === 0
                        ? "var(--hp-gold-light)"
                        : i === 1
                          ? "var(--hp-pink)44"
                          : "var(--hp-gold)33",
                  }}
                />
              ))}
            </div>
            {/* Center content */}
            <div className="relative z-10 text-center">
              <div className="font-script text-7xl" style={{ color: "var(--hp-pink)" }}>
                Barakah
              </div>
              <p className="text-xs tracking-widest text-slate-400 mt-2">بَارَكَ اللَّهُ</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-24 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <p
          className="text-sm font-semibold tracking-widest uppercase mb-3"
          style={{ color: "var(--hp-gold)" }}
        >
          Testimoni
        </p>
        <h2
          className="font-serif text-4xl md:text-5xl font-bold"
          style={{ color: "var(--hp-dark)" }}
        >
          Kata{" "}
          <span
            className="font-script font-normal text-5xl md:text-6xl"
            style={{ color: "var(--hp-pink)" }}
          >
            mereka
          </span>
        </h2>
      </div>

      {/* Row 1 — forward */}
      <div className="flex overflow-hidden mb-4" aria-hidden>
        <div className="animate-marquee flex gap-4 whitespace-nowrap">
          {doubled.map((t, i) => (
            <TestimonialCard key={`a-${i}`} {...t} />
          ))}
        </div>
      </div>

      {/* Row 2 — reverse */}
      <div className="flex overflow-hidden" aria-hidden>
        <div className="animate-marquee-rev flex gap-4 whitespace-nowrap">
          {[...doubled].reverse().map((t, i) => (
            <TestimonialCard key={`b-${i}`} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, loc, text }: { name: string; loc: string; text: string }) {
  return (
    <div
      className="flex-none w-72 rounded-2xl p-5 border shadow-sm"
      style={{ background: "var(--hp-blush)", borderColor: "var(--hp-gold-light)" }}
    >
      <div className="flex mb-3 gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-sm" style={{ color: "var(--hp-gold)" }}>
            ★
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4 whitespace-normal">
        &quot;{text}&quot;
      </p>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--hp-dark)" }}>
          {name}
        </p>
        <p className="text-xs text-slate-400">{loc}</p>
      </div>
    </div>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────────

function PricingSection({ showAdminCta }: { showAdminCta: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [ctaOpen, setCtaOpen] = useState(false);

  const plans = [
    {
      name: "Personal",
      price: "Hubungi Kami",
      desc: "Untuk pasangan yang ingin mencoba",
      features: [
        "3 Undangan",
        `Semua ${TEMPLATE_COUNT} Template`,
        "RSVP & Buku Tamu",
        "WhatsApp Broadcast",
      ],
      cta: "Mulai Sekarang",
      href: "/auth/register",
      highlight: false,
    },
    {
      name: "Organisasi",
      price: "Hubungi Kami",
      desc: "Untuk wedding organizer & bisnis",
      features: [
        "Unlimited Undangan",
        `Semua ${TEMPLATE_COUNT} Template`,
        "RSVP & Buku Tamu",
        "WhatsApp Broadcast",
        "AI Generator",
        "Multi-Anggota",
        "Analytics Dashboard",
      ],
      cta: "Daftar Sekarang",
      href: "/auth/register",
      highlight: true,
    },
    ...(showAdminCta
      ? [
          {
            name: "Dibuatin Admin",
            price: "Hubungi Kami",
            desc: "Isi data, tim kami yang bikinkan",
            features: [
              "Desain dibuatkan tim",
              "Revisi via WhatsApp",
              `Semua ${TEMPLATE_COUNT} Template`,
            ],
            cta: "Di Buatin Admin aja",
            href: null,
            highlight: false,
          },
        ]
      : []),
  ];

  return (
    <section
      id="pricing"
      className="py-24 px-6"
      ref={ref}
      style={{ background: "linear-gradient(180deg, #fff 0%, var(--hp-blush) 100%)" }}
    >
      <div className={plans.length === 3 ? "max-w-6xl mx-auto" : "max-w-4xl mx-auto"}>
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--hp-gold)" }}
          >
            Harga
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-4xl md:text-5xl font-bold"
            style={{ color: "var(--hp-dark)" }}
          >
            Transparan{" "}
            <span
              className="font-script font-normal text-5xl md:text-6xl"
              style={{ color: "var(--hp-pink)" }}
            >
              & jelas
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-slate-500">
            Kontrol penuh, tanpa biaya tersembunyi.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className={`grid grid-cols-1 gap-6 ${plans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
        >
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`relative rounded-3xl p-8 border transition-all hover:-translate-y-1 ${
                plan.highlight
                  ? "border-transparent shadow-2xl"
                  : "border-brand-100 shadow-sm bg-white"
              }`}
              style={
                plan.highlight
                  ? {
                      background: "linear-gradient(135deg, var(--hp-dark), oklch(0.2 0.04 285))",
                    }
                  : {}
              }
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: "linear-gradient(90deg, var(--hp-pink), var(--hp-gold))" }}
                >
                  Paling Populer
                </div>
              )}
              <div className="mb-6">
                <p
                  className={`text-sm font-medium mb-1 ${plan.highlight ? "text-white/60" : "text-slate-400"}`}
                >
                  {plan.name}
                </p>
                <div
                  className={`font-serif text-4xl font-bold ${plan.highlight ? "text-white" : ""}`}
                  style={!plan.highlight ? { color: "var(--hp-dark)" } : {}}
                >
                  {plan.price}
                </div>
                <p
                  className={`text-sm mt-1 ${plan.highlight ? "text-white/60" : "text-slate-400"}`}
                >
                  {plan.desc}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li
                    key={j}
                    className={`flex items-center gap-3 text-sm ${plan.highlight ? "text-white/80" : "text-slate-600"}`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-none flex items-center justify-center"
                      style={{ background: plan.highlight ? "var(--hp-gold)" : "var(--hp-pink)" }}
                    >
                      <Check size={9} strokeWidth={3} color="#fff" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.href ? (
                <a
                  href={plan.href}
                  className="block w-full text-center py-3 rounded-full text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
                  style={
                    plan.highlight
                      ? {
                          background: "linear-gradient(135deg, var(--hp-pink), var(--hp-gold))",
                          color: "#fff",
                        }
                      : {
                          background: "var(--hp-blush)",
                          color: "var(--hp-dark)",
                          border: "1.5px solid var(--hp-gold-light)",
                        }
                  }
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setCtaOpen(true)}
                  className="block w-full text-center py-3 rounded-full text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: "var(--hp-blush)",
                    color: "var(--hp-dark)",
                    border: "1.5px solid var(--hp-gold-light)",
                  }}
                >
                  {plan.cta}
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
      {ctaOpen && <AdminCtaModal onClose={() => setCtaOpen(false)} />}
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────────

function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--hp-gold)" }}
          >
            FAQ
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-4xl md:text-5xl font-bold"
            style={{ color: "var(--hp-dark)" }}
          >
            Pertanyaan{" "}
            <span
              className="font-script font-normal text-5xl md:text-6xl"
              style={{ color: "var(--hp-pink)" }}
            >
              umum
            </span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="space-y-3"
        >
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: open === i ? "var(--hp-gold)" : "var(--border)" }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-brand-50"
              >
                <span className="font-medium text-sm" style={{ color: "var(--hp-dark)" }}>
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown size={16} className="text-slate-400 flex-none" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────────

function FinalCTASection({ showAdminCta }: { showAdminCta: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [ctaOpen, setCtaOpen] = useState(false);

  return (
    <section
      className="py-32 px-6 overflow-hidden relative"
      ref={ref}
      style={{
        background: "linear-gradient(135deg, var(--hp-dark) 0%, oklch(0.22 0.06 320) 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--hp-pink), transparent)" }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--hp-gold), transparent)" }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
          <motion.p
            variants={fadeUp}
            className="font-script text-4xl mb-4"
            style={{ color: "var(--hp-gold)" }}
          >
            Hari spesial Anda menanti
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Mulai buat undangan digital
            <br />
            yang <span style={{ color: "var(--hp-pink)" }}>tidak terlupakan</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Cepat, mudah, dan siap kirim dalam hitungan menit.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
            <MagneticButton href="/auth/register" primary>
              Mulai Sekarang
            </MagneticButton>
            <MagneticButton
              href={showAdminCta ? "#" : "#pricing"}
              {...(showAdminCta ? { onClick: () => setCtaOpen(true) } : {})}
            >
              💬 Hubungi Kami
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
      {ctaOpen && <AdminCtaModal onClose={() => setCtaOpen(false)} />}
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

interface FooterContactSettings {
  supportEmail: string | null;
  instagram: string | null;
  twitter: string | null;
}

function Footer({ contactSettings }: { contactSettings: FooterContactSettings }) {
  const socialLinks = [
    // AGPLv3 §13: prominent link to this instance's corresponding source.
    { label: "Source Code", href: "https://github.com/Bangk3/ucapinstudio" },
    ...(contactSettings.twitter ? [{ label: "Twitter", href: contactSettings.twitter }] : []),
    ...(contactSettings.instagram ? [{ label: "Instagram", href: contactSettings.instagram }] : []),
    ...(contactSettings.supportEmail
      ? [{ label: "Email Support", href: `mailto:${contactSettings.supportEmail}` }]
      : []),
  ];

  return (
    <footer
      className="py-8 px-6 border-t"
      style={{ background: "var(--hp-blush)", borderColor: "var(--hp-gold-light)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 mb-6 border-b"
          style={{ borderColor: "var(--hp-gold-light)" }}
        >
          <div className="flex items-center gap-3">
            <span className="font-script text-3xl" style={{ color: "var(--hp-pink)" }}>
              UcapinStudio
            </span>
            <span className="hidden md:inline text-sm text-slate-500">
              Platform undangan pernikahan digital untuk Indonesia.
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-brand-50"
                style={{ borderColor: "var(--hp-gold-light)", color: "var(--hp-dark)" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2025 UcapinStudio. Modifikasi oleh Kelvin Prasetya. Open source under AGPLv3.</p>

          {/* UcapinStudio attribution */}
          <span className="inline-flex items-center gap-2" aria-label="UcapinStudio">
            <span className="text-slate-400">Dikembangkan oleh</span>
            {/* US icon */}
            <span
              className="inline-flex items-center justify-center rounded-md text-white font-extrabold"
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: "linear-gradient(135deg, #6b8f6e 0%, #4a6b4d 100%)",
                fontSize: 7,
                letterSpacing: "-0.5px",
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              US
            </span>
            <span className="font-semibold text-slate-600">UcapinStudio</span>
          </span>

          <p>Dibuat dengan ❤️ untuk pasangan Indonesia</p>
        </div>
      </div>
    </footer>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────────

export function HomepageClient({
  adminWhatsappNumber,
  contactSettings,
}: {
  adminWhatsappNumber: string | null;
  contactSettings: FooterContactSettings;
}) {
  const showAdminCta = adminWhatsappNumber !== null;
  return (
    <>
      <LenisProvider />
      <Navbar showAdminCta={showAdminCta} />
      <HeroSection showAdminCta={showAdminCta} />
      <TrustBar />
      <FeaturesSection />
      <AIGenerateSection />
      <TemplatesSection />
      <HowItWorksSection />
      <CulturalSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection showAdminCta={showAdminCta} />
      <FAQSection />
      <FinalCTASection showAdminCta={showAdminCta} />
      <Footer contactSettings={contactSettings} />
    </>
  );
}
