"use client";

import { useState } from "react";

export interface RsvpFormProps {
  invitationId: string;
  guestId?: string;
  guestName?: string;
  primaryColor?: string;
  /** Card background — defaults to white. Pass dark surface color for dark templates. */
  cardBg?: string;
  /** Card border color — defaults to #f3f4f6. */
  cardBorder?: string;
  /** Text color on the card — defaults to dark gray. */
  onSurface?: string;
}

export function RsvpForm({
  invitationId,
  guestId,
  guestName: defaultName,
  primaryColor = "#6b8f6e",
  cardBg = "#ffffff",
  cardBorder = "#f3f4f6",
  onSurface = "#374151",
}: RsvpFormProps) {
  const [name, setName] = useState(defaultName ?? "");
  const [status, setStatus] = useState<"yes" | "no" | "maybe" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!status) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId,
          status,
          guestName: name || "Tamu",
          ...(guestId !== undefined ? { guestId } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Gagal mengirim RSVP");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Gagal terhubung. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: cardBg === "#ffffff" ? "#fff" : "rgba(255,255,255,0.07)",
    borderColor: cardBg === "#ffffff" ? "#e5e7eb" : "rgba(255,255,255,0.15)",
    color: onSurface,
  };

  if (submitted) {
    const messages: Record<string, string> = {
      yes: "Terima kasih! Kami menantikan kehadiran Anda.",
      no: "Terima kasih telah memberi tahu kami. Semoga kita bisa bertemu di lain waktu.",
      maybe: "Terima kasih! Kami harap Anda bisa hadir.",
    };
    return (
      <div
        className="rounded-xl p-6 text-center shadow-sm"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <p className="text-lg font-medium" style={{ color: primaryColor }}>
          {messages[status ?? "yes"] ?? "Terima kasih!"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-6 shadow-sm space-y-4"
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
    >
      {!defaultName && (
        <div>
          <label
            htmlFor="rsvp-guest-name"
            className="block text-sm font-medium mb-1"
            style={{ color: onSurface }}
          >
            Nama Anda
          </label>
          <input
            id="rsvp-guest-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{ ...inputStyle, "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
        </div>
      )}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: onSurface }}>
          Konfirmasi Kehadiran
        </p>
        <div className="flex gap-2 flex-wrap">
          {(["yes", "no", "maybe"] as const).map((s) => {
            const labels = { yes: "Hadir", no: "Tidak Hadir", maybe: "Mungkin Hadir" };
            const selected = status === s;
            const unselectedBorder = cardBg === "#ffffff" ? "#d1d5db" : "rgba(255,255,255,0.2)";
            const unselectedColor = cardBg === "#ffffff" ? "#555" : onSurface;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className="rounded-full px-4 py-2 text-sm font-medium border transition-all"
                style={
                  selected
                    ? { backgroundColor: primaryColor, color: "#fff", borderColor: primaryColor }
                    : {
                        backgroundColor: "transparent",
                        color: unselectedColor,
                        borderColor: unselectedBorder,
                      }
                }
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        disabled={!status || loading}
        onClick={handleSubmit}
        className="w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? "Mengirim..." : "Kirim Konfirmasi"}
      </button>
    </div>
  );
}
