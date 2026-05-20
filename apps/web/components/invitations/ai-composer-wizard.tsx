"use client";

import type { ComposerRecipe } from "@invyte/templates";
import { Check, Layout, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";

interface Props {
  invitationId: string;
  tenantSlug: string;
  groomName: string;
  brideName: string;
  onApply: (recipe: ComposerRecipe) => void;
}

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

type AiProvider = "claude" | "gemini";

const PROVIDER_OPTIONS: { value: AiProvider; label: string; sublabel: string; color: string }[] = [
  { value: "claude", label: "Claude", sublabel: "Anthropic · Haiku 4.5", color: "#d97706" },
  { value: "gemini", label: "Gemini", sublabel: "Google · 3 Flash Preview", color: "#2563eb" },
];

const HERO_LABELS: Record<number, string> = {
  1: "Hero Sentral (Full-screen)",
  2: "Hero Split (Foto + Teks)",
  3: "Hero Botanis (Minimalis)",
};

const GALLERY_LABELS: Record<number, string> = {
  1: "Galeri Masonry",
  2: "Galeri Carousel",
  3: "Galeri Polaroid",
};

const STORY_LABELS: Record<number, string> = {
  1: "Kisah Prosa",
  2: "Timeline Perjalanan",
};

const ANIMATION_LABELS: Record<string, string> = {
  "soft-fade": "Soft Fade",
  "slide-up": "Slide Up",
  spring: "Spring",
  minimal: "Minimal",
  dramatic: "Dramatis",
};

const DIVIDER_LABELS: Record<string, string> = {
  petal: "Kelopak Bunga",
  geometric: "Geometris",
  wave: "Gelombang",
  none: "Tanpa Divider",
};

function RecipeCard({ recipe }: { recipe: ComposerRecipe }) {
  const primary = "#DB2777";

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Layout className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-semibold">Layout Terpilih</span>
      </div>

      {/* Hero, Gallery, Story */}
      <div className="grid grid-cols-1 gap-2">
        <RecipeRow
          icon="🖼️"
          label="Hero"
          value={HERO_LABELS[recipe.heroVariant] ?? `Varian ${recipe.heroVariant}`}
          primaryColor={primary}
        />
        <RecipeRow
          icon="📸"
          label="Galeri"
          value={GALLERY_LABELS[recipe.galleryVariant] ?? `Varian ${recipe.galleryVariant}`}
          primaryColor={primary}
        />
        <RecipeRow
          icon="📖"
          label="Kisah"
          value={STORY_LABELS[recipe.storyVariant] ?? `Varian ${recipe.storyVariant}`}
          primaryColor={primary}
        />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge
          label={`✨ ${ANIMATION_LABELS[recipe.animationPreset] ?? recipe.animationPreset}`}
          primaryColor={primary}
        />
        <DividerPreview type={recipe.dividerStyle} primaryColor={primary} />
      </div>

      {/* Sections list */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
          Bagian Aktif
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recipe.sections
            .filter((s) => s.enabled)
            .map((s) => (
              <span
                key={s.type}
                className="text-[10px] rounded-full px-2 py-0.5 capitalize"
                style={{ backgroundColor: `${primary}18`, color: primary }}
              >
                {s.type}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

function RecipeRow({
  icon,
  label,
  value,
  primaryColor,
}: {
  icon: string;
  label: string;
  value: string;
  primaryColor: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span aria-hidden="true">{icon}</span>
      <span className="text-muted-foreground w-14 shrink-0 text-xs">{label}</span>
      <span className="font-medium text-xs" style={{ color: primaryColor }}>
        {value}
      </span>
    </div>
  );
}

function Badge({ label, primaryColor }: { label: string; primaryColor: string }) {
  return (
    <span
      className="text-[10px] rounded-full px-2.5 py-1 font-medium"
      style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
    >
      {label}
    </span>
  );
}

function DividerPreview({ type, primaryColor }: { type: string; primaryColor: string }) {
  const label = DIVIDER_LABELS[type] ?? type;
  return (
    <span
      className="text-[10px] rounded-full px-2.5 py-1 font-medium flex items-center gap-1"
      style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
    >
      <span aria-hidden="true">
        {type === "petal" ? "🌸" : type === "geometric" ? "◇" : type === "wave" ? "〜" : "—"}
      </span>
      {label}
    </span>
  );
}

export function AiComposerWizard({
  invitationId,
  tenantSlug,
  groomName: initialGroom,
  brideName: initialBride,
  onApply,
}: Props) {
  const [step, setStep] = useState<"form" | "generating" | "result">("form");
  const [style, setStyle] = useState<string>("modern");
  const [mood, setMood] = useState<string>("elegant");
  const [groom, setGroom] = useState(initialGroom);
  const [bride, setBride] = useState(initialBride);
  const [aiProvider, setAiProvider] = useState<AiProvider>("claude");
  const [recipe, setRecipe] = useState<ComposerRecipe | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setStep("generating");

    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/ai/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          groomName: groom,
          brideName: bride,
          style,
          mood,
          aiProvider,
        }),
      });

      const data = (await res.json()) as
        | { generationId: string; recipe: ComposerRecipe }
        | { error: string };

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Gagal membuat layout");
        setStep("form");
        return;
      }

      setGenerationId(data.generationId);
      setRecipe(data.recipe);
      setStep("result");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setStep("form");
    }
  }

  function handleApply() {
    if (!recipe) return;
    onApply(recipe);
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Komposer Layout AI</p>
        </div>

        <p className="text-xs text-muted-foreground">
          AI akan memilih kombinasi blok terbaik (hero, galeri, kisah, animasi) berdasarkan gaya dan
          nuansa undanganmu.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Names */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Nama Mempelai Pria
            </span>
            <input
              value={groom}
              onChange={(e) => setGroom(e.target.value)}
              placeholder="Budi"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Nama mempelai pria"
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Nama Mempelai Wanita
            </span>
            <input
              value={bride}
              onChange={(e) => setBride(e.target.value)}
              placeholder="Sari"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Nama mempelai wanita"
            />
          </div>
        </div>

        {/* AI Provider */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">Model AI</span>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAiProvider(opt.value)}
                className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-all ${
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
                <span className="text-[10px] opacity-70">{opt.sublabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">
            Gaya Desain
          </span>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
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
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMood(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
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

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!groom.trim() || !bride.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity hover:bg-primary/90"
        >
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          Susun Layout dengan AI
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          {aiProvider === "gemini"
            ? "Menggunakan Gemini 3 Flash Preview · Estimasi 2–8 detik"
            : "Menggunakan Claude Haiku · Estimasi 3–10 detik"}
        </p>
      </div>
    );
  }

  // ── Generating ────────────────────────────────────────────────────────────
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="relative">
          <div
            className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
            aria-hidden="true"
          />
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">AI sedang menyusun layout...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Memilih blok terbaik untuk {groom} &amp; {bride}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (step === "result" && recipe) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium">Layout Komposer AI</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Buat Ulang
          </button>
        </div>

        <RecipeCard recipe={recipe} />

        <button
          type="button"
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors bg-[#DB2777] hover:opacity-90"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Terapkan Layout Ini
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          ID Generasi: {generationId?.slice(0, 8)}...
        </p>
      </div>
    );
  }

  return null;
}
