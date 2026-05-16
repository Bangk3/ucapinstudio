"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiGenerationWizard } from "./ai-generation-wizard";

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
}

export function AiGenerationWizardPage({ invitationId, tenantSlug, groomName, brideName }: Props) {
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  async function handleApply(variant: GenerationVariant) {
    setApplying(true);
    setApplyError(null);
    try {
      // Apply theme (colors + fonts) + content (headline → quote, story)
      const res = await fetch(`/api/v1/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          theme: {
            primaryColor: variant.primaryColor,
            accentColor: variant.accentColor,
            fontHeading: variant.fontHeading,
            fontBody: variant.fontBody,
          },
          // Merge into content.quote, content.story — use partial patch
          content: {
            quote: variant.quote,
            quoteAuthor: variant.quoteAuthor,
            story: variant.story,
          },
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setApplyError(body.error ?? "Gagal menerapkan desain");
        return;
      }

      setApplied(true);
      // Redirect back to editor after short delay
      setTimeout(() => {
        router.push(`/${tenantSlug}/dashboard/invitations/${invitationId}`);
      }, 1500);
    } catch {
      setApplyError("Koneksi gagal, coba lagi");
    } finally {
      setApplying(false);
    }
  }

  if (applied) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
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
      </div>
    );
  }

  return (
    <div>
      {applyError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {applyError}
        </div>
      )}
      {applying && (
        <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Menerapkan desain...
        </div>
      )}
      <AiGenerationWizard
        invitationId={invitationId}
        tenantSlug={tenantSlug}
        groomName={groomName}
        brideName={brideName}
        onApply={handleApply}
      />
    </div>
  );
}
