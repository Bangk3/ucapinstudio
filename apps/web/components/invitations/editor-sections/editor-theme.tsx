"use client";

import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
import type { ThemeConfig } from "@invyte/templates";
import { TEMPLATES } from "@invyte/templates";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  theme: ThemeConfig;
  templateId: string;
  onThemeChange: (patch: Partial<ThemeConfig>) => void;
  onTemplateChange: (id: string) => void;
  tenantId: string;
  tenantSlug: string;
  unlockedTemplateIds: string[];
}

export function EditorTheme({
  theme,
  templateId,
  onThemeChange,
  onTemplateChange,
  tenantId,
  tenantSlug,
  unlockedTemplateIds,
}: Props) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(unlockedTemplateIds));
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  async function handleUnlock(id: string) {
    setUnlockError(null);
    setUnlocking(id);
    try {
      const res = await fetch(`/api/v1/tenant/templates/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Gagal unlock template");
      }
      setUnlocked((prev) => new Set(prev).add(id));
      onTemplateChange(id);
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUnlocking(null);
    }
  }

  async function uploadCover(file: File) {
    setCoverLoading(true);
    setCoverError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("type", "image");

      const res = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setCoverError(body.error ?? "Upload gagal");
        return;
      }
      const data = (await res.json()) as { url: string };
      onThemeChange({ coverPhotoUrl: data.url });
    } catch {
      setCoverError("Upload gagal, coba lagi");
    } finally {
      setCoverLoading(false);
    }
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void uploadCover(file);
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Template</p>
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => {
            const isLocked = t.isPremium && !unlocked.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => (isLocked ? void handleUnlock(t.id) : onTemplateChange(t.id))}
                disabled={unlocking === t.id}
                className={`rounded-lg border px-3 py-2 text-left text-sm flex items-center justify-between gap-3 transition-all ${
                  templateId === t.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "hover:border-primary/40"
                } ${unlocking === t.id ? "opacity-60" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: t.primaryColor }}
                  />
                  {t.name}
                </span>
                {isLocked && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 shrink-0">
                    🔒 Rp {TEMPLATE_UNLOCK_COST_RUPIAH.toLocaleString("id-ID")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
      </div>

      <div className="h-px bg-border" />

      {/* Color customization */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Kustomisasi Warna</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="theme-primary-color-text" className="text-xs text-muted-foreground">
              Warna Utama
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor ?? "#6b8f6e"}
                onChange={(e) => onThemeChange({ primaryColor: e.target.value })}
                className="h-8 w-8 rounded cursor-pointer border"
              />
              <input
                id="theme-primary-color-text"
                type="text"
                value={theme.primaryColor ?? ""}
                onChange={(e) => onThemeChange({ primaryColor: e.target.value })}
                placeholder="#6b8f6e"
                className="flex-1 rounded border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="theme-accent-color-text" className="text-xs text-muted-foreground">
              Warna Aksen
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor ?? "#c9a84c"}
                onChange={(e) => onThemeChange({ accentColor: e.target.value })}
                className="h-8 w-8 rounded cursor-pointer border"
              />
              <input
                id="theme-accent-color-text"
                type="text"
                value={theme.accentColor ?? ""}
                onChange={(e) => onThemeChange({ accentColor: e.target.value })}
                placeholder="#c9a84c"
                className="flex-1 rounded border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cover photo */}
      <div className="space-y-1.5">
        <label
          htmlFor="theme-cover-photo-url"
          className="text-xs font-medium text-muted-foreground"
        >
          Foto Cover
        </label>
        <div className="flex gap-2">
          <input
            id="theme-cover-photo-url"
            value={theme.coverPhotoUrl ?? ""}
            onChange={(e) => onThemeChange({ coverPhotoUrl: e.target.value })}
            placeholder="https://cdn.../cover.jpg"
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverLoading}
            className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors disabled:opacity-60"
            title="Upload foto cover"
          >
            <Upload className={`h-3.5 w-3.5 ${coverLoading ? "animate-spin" : ""}`} />
            {coverLoading ? "..." : "Upload"}
          </button>
        </div>
        {coverError && <p className="text-xs text-destructive">{coverError}</p>}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverFileChange}
        />
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover preview"
            className="mt-2 h-28 w-full rounded-lg object-cover"
          />
        )}
      </div>
    </div>
  );
}
