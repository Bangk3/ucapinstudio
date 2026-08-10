"use client";

import type { ComposerRecipe } from "@invyte/templates";
import { AnimatePresence, type Variants, motion, useReducedMotion } from "framer-motion";
import { Check, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  year: string;
  title: string;
  description?: string;
  emoji?: string;
}

interface GenerationVariant {
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  headline: string;
  tagline: string;
  story: string;
  quote: string;
  quoteAuthor: string;
  moodLabel: string;
  timeline?: TimelineEntry[];
}

type AiProvider = "auto" | "claude" | "gemini" | "nvidia-nim";
type GenState = "idle" | "loading" | "done";

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Tradisional" },
  { value: "islamic", label: "Islami" },
  { value: "romantic", label: "Romantis" },
  { value: "minimalist", label: "Minimalis" },
  { value: "botanical", label: "Botanis" },
] as const;

const MOOD_OPTIONS = [
  { value: "elegant", label: "Elegan" },
  { value: "romantic", label: "Romantis" },
  { value: "cheerful", label: "Ceria" },
  { value: "luxurious", label: "Mewah" },
  { value: "natural", label: "Natural" },
] as const;

const PROVIDER_OPTIONS: { value: AiProvider; label: string; sublabel: string; color: string }[] = [
  { value: "auto", label: "Otomatis", sublabel: "Round-robin + fallback", color: "#9333ea" },
  { value: "claude", label: "Claude", sublabel: "Anthropic · Haiku 4.5", color: "#d97706" },
  { value: "gemini", label: "Gemini", sublabel: "Google · 3 Flash Preview", color: "#2563eb" },
  { value: "nvidia-nim", label: "NVIDIA", sublabel: "NIM · Llama 3.1 8B", color: "#76b900" },
];

const HERO_LABELS: Record<number, string> = {
  1: "Hero Sentral",
  2: "Hero Split",
  3: "Hero Botanis",
};
const GALLERY_LABELS: Record<number, string> = {
  1: "Masonry",
  2: "Carousel",
  3: "Polaroid",
};
const STORY_LABELS: Record<number, string> = {
  1: "Kisah Prosa",
  2: "Timeline",
};
const ANIMATION_LABELS: Record<string, string> = {
  "soft-fade": "Soft Fade",
  "slide-up": "Slide Up",
  spring: "Spring",
  minimal: "Minimal",
  dramatic: "Dramatis",
};
const DIVIDER_LABELS: Record<string, string> = {
  petal: "🌸 Kelopak",
  geometric: "◇ Geometris",
  wave: "〜 Gelombang",
  none: "— Polos",
};

// ─── Style-driven motion variants ─────────────────────────────────────────────
// Each style maps to an entrance animation that matches its aesthetic feel.

const STYLE_MOTION: Record<string, Variants> = {
  // Soft, flowing — like petals drifting in
  romantic: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
  },
  botanical: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
  },
  // Crisp, purposeful — modern precision
  modern: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
  minimalist: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  },
  // Dignified fade — traditional gravitas
  traditional: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  },
  islamic: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  },
  // Spring-scale reveal — luxurious presence
  luxurious: {
    hidden: { opacity: 0, scale: 0.93 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 210, damping: 22 } },
  },
};

const REDUCED_MOTION_VARIANT: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
};

// Parent that staggers children entrance
const STAGGER_PARENT: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// Explicit fallback so the ?? operator always yields Variants (not Variants | undefined)
const DEFAULT_MOTION_VARIANT: Variants = STYLE_MOTION.modern ?? REDUCED_MOTION_VARIANT;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
      role="alert"
    >
      {message}
    </div>
  );
}

function MiniDivider({ label }: { label: string }) {
  return (
    <div className="relative py-1" aria-hidden="true">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-2 text-[9px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Layout result card ───────────────────────────────────────────────────────

function RecipeCard({ recipe, accentColor }: { recipe: ComposerRecipe; accentColor: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
      <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
        Struktur Layout
      </span>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          {
            label: "Hero",
            value: HERO_LABELS[recipe.heroVariant] ?? `Varian ${recipe.heroVariant}`,
          },
          {
            label: "Galeri",
            value: GALLERY_LABELS[recipe.galleryVariant] ?? `Varian ${recipe.galleryVariant}`,
          },
          {
            label: "Kisah",
            value: STORY_LABELS[recipe.storyVariant] ?? `Varian ${recipe.storyVariant}`,
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
              {label}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: accentColor }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 pt-2 border-t">
        <span
          className="text-[10px] rounded-full px-2 py-0.5 font-medium"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          ✨ {ANIMATION_LABELS[recipe.animationPreset] ?? recipe.animationPreset}
        </span>
        <span
          className="text-[10px] rounded-full px-2 py-0.5 font-medium"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          {DIVIDER_LABELS[recipe.dividerStyle] ?? recipe.dividerStyle}
        </span>
        {recipe.sections
          .filter((s) => s.enabled)
          .map((s) => (
            <span
              key={s.type}
              className="text-[10px] rounded-full px-2 py-0.5 capitalize"
              style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
            >
              {s.type}
            </span>
          ))}
      </div>
    </div>
  );
}

// ─── Theme variant selector ───────────────────────────────────────────────────

function ThemeSelector({
  variants,
  selected,
  onSelect,
}: {
  variants: GenerationVariant[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const v = variants[selected];
  if (!v) return null;

  return (
    <div className="space-y-2">
      {/* Tab row — compact */}
      <div className="grid grid-cols-3 gap-1.5">
        {variants.map((vt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selected === i}
            className={`rounded-xl border-2 p-2.5 text-left transition-all ${
              selected === i
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className="flex gap-1 mb-1.5 items-center">
              <ColorSwatch color={vt.primaryColor} />
              <ColorSwatch color={vt.accentColor} />
              {selected === i && (
                <span className="ml-auto flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary shrink-0">
                  <Check className="h-2 w-2 text-primary-foreground" aria-hidden="true" />
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-semibold block leading-tight"
              style={{ color: selected === i ? vt.primaryColor : undefined }}
            >
              {vt.moodLabel}
            </span>
            <span className="text-[9px] text-muted-foreground block truncate">
              {vt.fontHeading}
            </span>
          </button>
        ))}
      </div>

      {/* Selected variant detail */}
      <div
        className="rounded-lg border-l-2 bg-muted/20 px-3 py-2.5 space-y-1.5"
        style={{ borderLeftColor: v.primaryColor }}
      >
        <p className="text-xs font-semibold leading-snug">{v.headline}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{v.tagline}</p>
        <div className="text-[10px] text-muted-foreground pt-1.5 border-t flex gap-2 flex-wrap">
          <span>
            Heading: <strong className="text-foreground">{v.fontHeading}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Body: <strong className="text-foreground">{v.fontBody}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  invitationId: string;
  tenantSlug: string;
  groomName: string;
  brideName: string;
}

export function AiGenerationWizardPage({ invitationId, tenantSlug, groomName, brideName }: Props) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // ── Form ──────────────────────────────────────────────────────────────────
  const [groom, setGroom] = useState(groomName);
  const [bride, setBride] = useState(brideName);
  const [style, setStyle] = useState<string>("modern");
  const [mood, setMood] = useState<string>("elegant");
  const [aiProvider, setAiProvider] = useState<AiProvider>("auto");

  // ── Generation ────────────────────────────────────────────────────────────
  const [genState, setGenState] = useState<GenState>("idle");
  const [recipe, setRecipe] = useState<ComposerRecipe | null>(null);
  const [variants, setVariants] = useState<GenerationVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [partialErrors, setPartialErrors] = useState<{ layout?: string; theme?: string }>({});

  // ── Apply ─────────────────────────────────────────────────────────────────
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const canGenerate = groom.trim().length > 0 && bride.trim().length > 0;
  const motionVariant: Variants = shouldReduceMotion
    ? REDUCED_MOTION_VARIANT
    : (STYLE_MOTION[style] ?? DEFAULT_MOTION_VARIANT);

  // Use selected theme's primary color for accent in layout card + apply button
  const displayColor = variants[selectedVariant]?.primaryColor ?? "#DB2777";

  // ── Generate both layout + theme in parallel ───────────────────────────────

  async function handleGenerate() {
    setGenError(null);
    setPartialErrors({});
    setApplyError(null);
    setGenState("loading");

    const shared = { tenantSlug, groomName: groom, brideName: bride, style, mood, aiProvider };

    const [composeResult, themeResult] = await Promise.allSettled([
      fetch(`/api/v1/invitations/${invitationId}/ai/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shared),
      }).then(async (r) => {
        const data = (await r.json()) as
          | { generationId: string; recipe: ComposerRecipe }
          | { error: string };
        if (!r.ok || "error" in data)
          throw new Error("error" in data ? data.error : "Gagal membuat layout");
        return data;
      }),
      fetch(`/api/v1/invitations/${invitationId}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shared),
      }).then(async (r) => {
        const data = (await r.json()) as
          | { generationId: string; variants: GenerationVariant[] }
          | { error: string };
        if (!r.ok || "error" in data)
          throw new Error("error" in data ? data.error : "Gagal membuat variasi tema");
        return data;
      }),
    ]);

    const newRecipe = composeResult.status === "fulfilled" ? composeResult.value.recipe : null;
    const newVariants = themeResult.status === "fulfilled" ? themeResult.value.variants : [];

    // Both failed — hard error
    if (!newRecipe && !newVariants.length) {
      const msg =
        composeResult.status === "rejected"
          ? (composeResult.reason as Error).message
          : themeResult.status === "rejected"
            ? (themeResult.reason as Error).message
            : undefined;
      setGenError(msg ?? "Generasi gagal. Coba lagi.");
      setGenState("idle");
      return;
    }

    // Partial failures
    const newPartial: { layout?: string; theme?: string } = {};
    if (!newRecipe && composeResult.status === "rejected") {
      newPartial.layout = (composeResult.reason as Error).message ?? "Layout gagal";
    }
    if (!newVariants.length && themeResult.status === "rejected") {
      newPartial.theme = (themeResult.reason as Error).message ?? "Tema gagal";
    }

    setRecipe(newRecipe);
    setVariants(newVariants);
    setSelectedVariant(0);
    setPartialErrors(newPartial);
    setGenState("done");
  }

  // ── Apply layout + theme + text in a single PATCH ─────────────────────────

  async function handleApply() {
    const variant = variants[selectedVariant];
    if (!recipe && !variant) return;

    setApplyError(null);
    setApplying(true);

    try {
      const contentPatch: Record<string, unknown> = {};
      const patch: Record<string, unknown> = { tenantSlug };

      if (recipe) {
        patch.templateId = "ai-composer";
        contentPatch.composerRecipe = recipe;
      }
      if (variant) {
        patch.theme = {
          primaryColor: variant.primaryColor,
          accentColor: variant.accentColor,
          fontHeading: variant.fontHeading,
          fontBody: variant.fontBody,
        };
        contentPatch.quote = variant.quote;
        contentPatch.quoteAuthor = variant.quoteAuthor;
        contentPatch.story = variant.story;
        if (Array.isArray(variant.timeline) && variant.timeline.length > 0) {
          // Filter out empty placeholder entries the LLM might leak through
          const cleanTimeline = variant.timeline.filter((t) => t.year?.trim() && t.title?.trim());
          if (cleanTimeline.length > 0) {
            contentPatch.timeline = cleanTimeline;
          }
        }
      }
      if (Object.keys(contentPatch).length > 0) {
        patch.content = contentPatch;
      }

      const res = await fetch(`/api/v1/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setApplyError(body.error ?? "Gagal menerapkan desain");
        return;
      }

      setApplied(true);
      setTimeout(() => router.push(`/${tenantSlug}/dashboard/invitations/${invitationId}`), 1400);
    } catch {
      setApplyError("Koneksi gagal, coba lagi.");
    } finally {
      setApplying(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (applied) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center justify-center py-16 gap-4 text-center"
      >
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-green-600"
            aria-hidden="true"
          >
            <polyline
              points="20 6 9 17 4 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-700">Desain berhasil diterapkan!</p>
          <p className="text-sm text-muted-foreground mt-1">Kembali ke editor...</p>
        </div>
      </motion.div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Form card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        {/* Names */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="groom-name"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Mempelai Pria
            </label>
            <input
              id="groom-name"
              value={groom}
              onChange={(e) => setGroom(e.target.value)}
              placeholder="Budi"
              disabled={genState === "loading"}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="bride-name"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              Mempelai Wanita
            </label>
            <input
              id="bride-name"
              value={bride}
              onChange={(e) => setBride(e.target.value)}
              placeholder="Sari"
              disabled={genState === "loading"}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>
        </div>

        {/* AI Provider */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">Model AI</span>
          <div className="grid grid-cols-4 gap-1.5">
            {PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={genState === "loading"}
                onClick={() => setAiProvider(opt.value)}
                className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-2 text-xs font-medium transition-all disabled:opacity-50 ${
                  aiProvider === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: aiProvider === opt.value ? opt.color : undefined }}
                >
                  {opt.label}
                </span>
                <span className="text-[10px] opacity-70 text-center leading-tight">
                  {opt.sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">
            Gaya Desain
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={genState === "loading"}
                onClick={() => setStyle(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  style === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">
            Nuansa / Mood
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={genState === "loading"}
                onClick={() => setMood(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  mood === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full error ─────────────────────────────────────────────────────── */}
      {genError && <ErrorBanner message={genError} />}

      {/* ── Generate / Loading / Result (animated transitions) ────────────── */}
      <AnimatePresence mode="wait">
        {/* Idle — single generate button */}
        {genState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="space-y-2"
          >
            <motion.button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              {...(!shouldReduceMotion && {
                whileHover: { scale: 1.015 },
                whileTap: { scale: 0.975 },
              })}
              className="w-full flex flex-col items-center justify-center gap-1 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                <span>Susun Desain Lengkap</span>
              </div>
              <span className="text-[10px] font-normal opacity-80">
                Layout · Tema · Teks — sekaligus
              </span>
            </motion.button>
            <p className="text-[10px] text-muted-foreground text-center">
              {aiProvider === "auto"
                ? "Coba semua provider terkonfigurasi bergiliran, otomatis pindah kalau salah satu gagal"
                : aiProvider === "gemini"
                  ? "Menggunakan Gemini 3 Flash Preview · Estimasi 5–15 detik"
                  : aiProvider === "nvidia-nim"
                    ? "Menggunakan NVIDIA NIM Llama 3.1 8B · Gratis · Estimasi 3–10 detik"
                    : "Menggunakan Claude Haiku · Estimasi 6–18 detik"}
            </p>
          </motion.div>
        )}

        {/* Loading */}
        {genState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="flex flex-col items-center justify-center py-12 gap-5"
          >
            <div className="relative">
              <div
                className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
                aria-hidden="true"
              />
              <Sparkles
                className="absolute inset-0 m-auto h-5 w-5 text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">AI sedang bekerja...</p>
              <p className="text-xs text-muted-foreground">
                Menyusun desain untuk {groom || "mempelai pria"} &amp; {bride || "mempelai wanita"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <span>Layout</span>
                <span aria-hidden="true">·</span>
                <span>Tema</span>
                <span aria-hidden="true">·</span>
                <span>Teks</span>
              </div>
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Result — staggered entrance with style-driven animation */}
        {genState === "done" && (
          <motion.div
            key="done"
            initial="hidden"
            animate="visible"
            variants={STAGGER_PARENT}
            className="space-y-3"
          >
            {/* Header */}
            <motion.div variants={motionVariant} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold">Desain AI</span>
                <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                  {recipe && variants.length
                    ? "Layout + Tema + Teks"
                    : recipe
                      ? "Layout"
                      : "Tema + Teks"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGenState("idle");
                  setRecipe(null);
                  setVariants([]);
                  setPartialErrors({});
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Buat Ulang
              </button>
            </motion.div>

            {/* Partial error — layout */}
            {partialErrors.layout && (
              <motion.div variants={motionVariant}>
                <ErrorBanner message={`Layout: ${partialErrors.layout}`} />
              </motion.div>
            )}

            {/* Layout recipe card */}
            {recipe && (
              <motion.div variants={motionVariant}>
                <RecipeCard recipe={recipe} accentColor={displayColor} />
              </motion.div>
            )}

            {/* Divider between layout and theme */}
            {recipe && variants.length > 0 && (
              <motion.div variants={motionVariant}>
                <MiniDivider label="TEMA & TEKS" />
              </motion.div>
            )}

            {/* Partial error — theme */}
            {partialErrors.theme && (
              <motion.div variants={motionVariant}>
                <ErrorBanner message={`Tema: ${partialErrors.theme}`} />
              </motion.div>
            )}

            {/* Theme variant selector */}
            {variants.length > 0 && (
              <motion.div variants={motionVariant}>
                <ThemeSelector
                  variants={variants}
                  selected={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              </motion.div>
            )}

            {/* Apply error */}
            {applyError && (
              <motion.div variants={motionVariant}>
                <ErrorBanner message={applyError} />
              </motion.div>
            )}

            {/* Apply button */}
            <motion.div variants={motionVariant}>
              <motion.button
                type="button"
                onClick={handleApply}
                disabled={applying || (!recipe && !variants.length)}
                {...(!shouldReduceMotion && {
                  whileHover: { scale: 1.015 },
                  whileTap: { scale: 0.975 },
                })}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: displayColor }}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {applying ? "Menerapkan Desain..." : "Terapkan Desain Ini"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
