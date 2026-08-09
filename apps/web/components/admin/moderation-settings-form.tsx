"use client";

import { useState } from "react";

interface Props {
  initialSpamThreshold: number;
  initialBannedWords: string[];
  canEdit: boolean;
}

export function ModerationSettingsForm({
  initialSpamThreshold,
  initialBannedWords,
  canEdit,
}: Props) {
  const [threshold, setThreshold] = useState(String(initialSpamThreshold));
  const [bannedWords, setBannedWords] = useState(initialBannedWords.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const n = Number(threshold);
      if (!Number.isInteger(n) || n < 0 || n > 100) {
        throw new Error("Ambang batas spam harus angka 0-100");
      }
      const words = bannedWords
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);

      const res = await fetch("/api/v1/admin/moderation-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spamThreshold: n, bannedWords: words }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <label htmlFor="spam-threshold" className="text-sm font-medium">
          Ambang Batas Spam (0-100)
        </label>
        <input
          id="spam-threshold"
          type="number"
          min={0}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          disabled={!canEdit}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          Ucapan dengan skor spam ≥ nilai ini otomatis ditandai "spam".
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="banned-words" className="text-sm font-medium">
          Kata Terlarang (pisahkan dengan koma)
        </label>
        <textarea
          id="banned-words"
          rows={4}
          value={bannedWords}
          onChange={(e) => setBannedWords(e.target.value)}
          disabled={!canEdit}
          placeholder="judi, casino, viagra"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          Ucapan yang mengandung salah satu kata ini otomatis ditandai "spam".
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {saved && <p className="text-sm text-emerald-600">Tersimpan.</p>}

      {canEdit && (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      )}
    </div>
  );
}
