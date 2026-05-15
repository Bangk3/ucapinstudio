"use client";

import { useEffect, useState } from "react";

interface WishItem {
  id: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface WishesSectionProps {
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

export function WishesSection({
  invitationId,
  guestId,
  guestName: defaultName,
  primaryColor = "#6b8f6e",
  cardBg = "#ffffff",
  cardBorder = "#f3f4f6",
  onSurface = "#374151",
}: WishesSectionProps) {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(true);
  const [senderName, setSenderName] = useState(defaultName ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/v1/wishes?invitationId=${invitationId}&limit=20`)
      .then((r) => r.json())
      .then((d) => setWishes((d as { wishes?: WishItem[] }).wishes ?? []))
      .catch(() => {})
      .finally(() => setLoadingWishes(false));
  }, [invitationId]);

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId,
          senderName: senderName || "Tamu",
          message: message.trim(),
          ...(guestId !== undefined ? { guestId } : {}),
        }),
      });
      const data = (await res.json()) as { wish?: WishItem; pending?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim ucapan");
        return;
      }
      if (data.pending) {
        setPending(true);
      } else if (data.wish) {
        setWishes((prev) => [data.wish!, ...prev]);
      }
      setMessage("");
      setSubmitted(true);
    } catch {
      setError("Gagal terhubung. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const isDark = cardBg !== "#ffffff";
  const inputStyle: React.CSSProperties = {
    backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "#fff",
    borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb",
    color: onSurface,
  };
  const mutedColor = isDark ? "rgba(255,255,255,0.4)" : "#9ca3af";

  return (
    <div className="space-y-4">
      {/* Submit form card */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
          Kirim Ucapan
        </h3>
        {submitted ? (
          <p className="text-sm" style={{ color: onSurface }}>
            {pending
              ? "Ucapan Anda sedang menunggu moderasi. Terima kasih!"
              : "Ucapan Anda telah terkirim. Terima kasih!"}
          </p>
        ) : (
          <form onSubmit={handleSubmitWish} className="space-y-3">
            {!defaultName && (
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis ucapan dan doa untuk pengantin..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
              style={inputStyle}
              required
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? "Mengirim..." : "Kirim Ucapan"}
            </button>
          </form>
        )}
      </div>

      {/* Wish list */}
      {loadingWishes ? (
        <div className="text-center text-sm py-4" style={{ color: mutedColor }}>
          Memuat ucapan...
        </div>
      ) : wishes.length === 0 ? (
        <div className="text-center text-sm py-4" style={{ color: mutedColor }}>
          Belum ada ucapan.
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((w) => (
            <div
              key={w.id}
              className="rounded-xl p-4 shadow-sm"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="font-semibold text-sm" style={{ color: primaryColor }}>
                {w.senderName}
              </p>
              <p
                className="text-sm mt-1 whitespace-pre-line leading-relaxed"
                style={{ color: onSurface }}
              >
                {w.message}
              </p>
              <p className="text-xs mt-2" style={{ color: mutedColor }}>
                {new Date(w.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
