"use client";

import { Check, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";

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
}

interface Props {
  invitationId: string;
  tenantSlug: string;
  groomName: string;
  brideName: string;
  onApply: (variant: GenerationVariant) => void;
}

const STYLE_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Tradisional" },
  { value: "islamic", label: "Islami" },
  { value: "romantic", label: "Romantis" },
  { value: "minimalist", label: "Minimalis" },
] as const;

const MOOD_OPTIONS = [
  { value: "elegant", label: "Elegan" },
  { value: "romantic", label: "Romantis" },
  { value: "cheerful", label: "Ceria" },
  { value: "luxurious", label: "Mewah" },
  { value: "natural", label: "Natural" },
] as const;

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-black/10 shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function VariantCard({
  variant,
  selected,
  onSelect,
}: {
  variant: GenerationVariant;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/40 hover:shadow-sm"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: variant.primaryColor }}
          >
            {variant.moodLabel}
          </span>
          <p className="font-semibold text-sm mt-0.5 leading-snug">{variant.headline}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <ColorSwatch color={variant.primaryColor} />
          <ColorSwatch color={variant.accentColor} />
          {selected && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
              <Check className="h-2.5 w-2.5 text-primary-foreground" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {variant.tagline}
      </p>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t pt-2.5">
        <span>
          Heading: <span className="font-medium text-foreground">{variant.fontHeading}</span>
        </span>
        <span>·</span>
        <span>
          Body: <span className="font-medium text-foreground">{variant.fontBody}</span>
        </span>
      </div>

      {selected && (
        <div className="mt-3 space-y-2">
          <p
            className="text-[11px] leading-relaxed text-muted-foreground italic border-l-2 pl-2.5"
            style={{ borderColor: variant.primaryColor }}
          >
            &ldquo;{variant.story}&rdquo;
          </p>
          <p className="text-[10px] text-muted-foreground">
            &ldquo;{variant.quote}&rdquo; — {variant.quoteAuthor}
          </p>
        </div>
      )}
    </button>
  );
}

export function AiGenerationWizard({
  invitationId,
  tenantSlug,
  groomName: initialGroom,
  brideName: initialBride,
  onApply,
}: Props) {
  const [step, setStep] = useState<"form" | "generating" | "results">("form");
  const [style, setStyle] = useState<string>("modern");
  const [mood, setMood] = useState<string>("elegant");
  const [groom, setGroom] = useState(initialGroom);
  const [bride, setBride] = useState(initialBride);
  const [variants, setVariants] = useState<GenerationVariant[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setStep("generating");

    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          groomName: groom,
          brideName: bride,
          style,
          mood,
        }),
      });

      const data = (await res.json()) as
        | { generationId: string; variants: GenerationVariant[] }
        | { error: string };

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Gagal membuat variasi");
        setStep("form");
        return;
      }

      setGenerationId(data.generationId);
      setVariants(data.variants);
      setSelectedIdx(0);
      setStep("results");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setStep("form");
    }
  }

  function handleApply() {
    const variant = variants[selectedIdx];
    if (!variant) return;
    onApply(variant);
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Buat desain dengan AI</p>
        </div>

        <p className="text-xs text-muted-foreground">
          AI akan membuat 3 variasi desain undangan (warna, font, teks) yang bisa kamu pilih dan
          terapkan.
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
          Buat 3 Variasi Desain
        </button>

        <p className="text-[10px] text-muted-foreground text-center">
          Menggunakan Claude AI · Estimasi 5–15 detik
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
          <p className="text-sm font-medium">AI sedang merancang...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Membuat 3 variasi desain untuk {groom} & {bride}
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

  // ── Results ───────────────────────────────────────────────────────────────
  if (step === "results") {
    const selected = variants[selectedIdx];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium">3 Variasi Desain</p>
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

        <div className="space-y-3">
          {variants.map((variant, idx) => (
            <VariantCard
              // biome-ignore lint/suspicious/noArrayIndexKey: variants ordered by AI generation index
              key={idx}
              variant={variant}
              selected={selectedIdx === idx}
              onSelect={() => setSelectedIdx(idx)}
            />
          ))}
        </div>

        {selected && (
          <button
            type="button"
            onClick={handleApply}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: selected.primaryColor }}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Terapkan Variasi {selectedIdx + 1}
          </button>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          ID Generasi: {generationId?.slice(0, 8)}...
        </p>
      </div>
    );
  }

  return null;
}
