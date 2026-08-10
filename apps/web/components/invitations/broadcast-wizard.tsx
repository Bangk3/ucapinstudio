"use client";

import { CheckCircle2, Loader2, MessageCircle, Send, Users, XCircle } from "lucide-react";
import { useState } from "react";

interface Guest {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  slug: string;
  category: string;
}

interface BroadcastResult {
  sent: number;
  failed: number;
  details: Array<{ guestId: string; name: string; success: boolean; error?: string }>;
}

interface Props {
  invitationId: string;
  invitationSlug: string;
  tenantSlug: string;
  guests: Guest[];
}

const DEFAULT_TEMPLATE =
  "Yth. Bapak/Ibu/Sdr/i *{nama}*\n\nKami mengundang Anda hadir dalam acara kami. Silakan buka undangan digital Anda di:\n{link}\n\nKehadiran Anda sangat berarti bagi kami. 🙏";

const CATEGORY_LABELS: Record<string, string> = {
  family: "Keluarga",
  friends: "Teman",
  colleagues: "Rekan Kerja",
  school: "Teman Sekolah",
  community: "Komunitas",
  vip: "VIP",
  other: "Lainnya",
};

function renderTemplate(template: string, name: string, link: string): string {
  return template.replace(/\{nama\}/g, name).replace(/\{link\}/g, link);
}

export function BroadcastWizard({ invitationId, invitationSlug, tenantSlug, guests }: Props) {
  const [step, setStep] = useState<"select" | "compose" | "preview" | "sending" | "done">("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channelFilter, setChannelFilter] = useState<"phone" | "email" | "all">("phone");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [provider, setProvider] = useState<"whatsapp_cloud" | "fonnte" | "custom_webhook" | "smtp">(
    "fonnte",
  );
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [previewGuest, setPreviewGuest] = useState<Guest | null>(null);

  // Filter guests by channel availability
  const eligibleGuests = guests.filter((g) => {
    if (channelFilter === "phone") return !!g.phone;
    if (channelFilter === "email") return !!g.email;
    return !!(g.phone ?? g.email);
  });

  function toggleGuest(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleAll() {
    if (selectedIds.size === eligibleGuests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(eligibleGuests.map((g) => g.id)));
  }

  const selectedGuests = guests.filter((g) => selectedIds.has(g.id));

  function getGuestLink(guest: Guest) {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/${tenantSlug}/u/${invitationSlug}/${guest.slug}`;
  }

  async function handleSend() {
    setStep("sending");
    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: Array.from(selectedIds),
          message: template,
          provider,
          tenantSlug,
        }),
      });
      const data = (await res.json()) as BroadcastResult | { queued: number } | { error: string };
      if (!res.ok || "error" in data) {
        setResult({
          sent: 0,
          failed: selectedGuests.length,
          details: selectedGuests.map((g) => ({
            guestId: g.id,
            name: g.name,
            success: false,
            error: "error" in data ? data.error : "Gagal mengirim",
          })),
        });
      } else if ("queued" in data) {
        // 202 fire-and-forget — show queued count
        setResult({
          sent: data.queued,
          failed: 0,
          details: selectedGuests.map((g) => ({
            guestId: g.id,
            name: g.name,
            success: true,
          })),
        });
      } else {
        setResult(data);
      }
    } catch {
      setResult({
        sent: 0,
        failed: selectedGuests.length,
        details: selectedGuests.map((g) => ({
          guestId: g.id,
          name: g.name,
          success: false,
          error: "Koneksi gagal",
        })),
      });
    } finally {
      setStep("done");
    }
  }

  // ── Step: Select guests ──────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="space-y-4">
        {/* Channel + provider filter */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">
              Channel kirim
            </span>
            <div className="flex rounded-lg border overflow-hidden">
              {(
                [
                  { value: "phone", label: "WhatsApp / SMS" },
                  { value: "email", label: "Email" },
                  { value: "all", label: "Semua" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setChannelFilter(opt.value);
                    setSelectedIds(new Set());
                  }}
                  className={`px-3 py-1.5 text-xs font-medium border-r last:border-r-0 transition-colors ${
                    channelFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1">Provider</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
              className="rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Provider pesan"
            >
              <option value="fonnte">Fonnte (WA)</option>
              <option value="whatsapp_cloud">WhatsApp Cloud API</option>
              <option value="custom_webhook">Gateway Kustom (WA)</option>
              <option value="smtp">Email (SMTP)</option>
            </select>
          </div>
        </div>

        {/* Guest list */}
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 border-b px-4 py-2.5 bg-muted/30">
            <input
              type="checkbox"
              checked={eligibleGuests.length > 0 && selectedIds.size === eligibleGuests.length}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 accent-primary"
              aria-label="Pilih semua tamu"
            />
            <span className="text-xs text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} dipilih`
                : `${eligibleGuests.length} tamu tersedia`}
            </span>
          </div>

          {eligibleGuests.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-30" aria-hidden="true" />
              Tidak ada tamu dengan {channelFilter === "phone" ? "nomor HP" : "email"}.
            </div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {eligibleGuests.map((guest) => (
                <label
                  key={guest.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(guest.id)}
                    onChange={() => toggleGuest(guest.id)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{guest.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {guest.phone ?? guest.email}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                    {CATEGORY_LABELS[guest.category] ?? "Lainnya"}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setStep("compose")}
          disabled={selectedIds.size === 0}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Lanjut: Tulis Pesan →
        </button>
      </div>
    );
  }

  // ── Step: Compose message ────────────────────────────────────────────────
  if (step === "compose") {
    const sampleGuest = selectedGuests[0];
    const previewText = sampleGuest
      ? renderTemplate(template, sampleGuest.name, getGuestLink(sampleGuest))
      : template;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Ubah pilihan
          </button>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{selectedIds.size} tamu dipilih</span>
        </div>

        {/* Variable hints */}
        <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Variabel tersedia:</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["{nama}", "Nama tamu"],
              ["{link}", "Link undangan personal"],
            ].map(([v, desc]) => (
              <button
                key={v}
                type="button"
                className="font-mono text-xs bg-background border rounded px-1.5 py-0.5 cursor-pointer hover:bg-primary/10 transition-colors"
                title={desc}
                onClick={() => setTemplate((t) => `${t}${v}`)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Template textarea */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">
            Template pesan
          </span>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={8}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            aria-label="Template pesan"
          />
        </div>

        {/* Preview */}
        {sampleGuest && (
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Preview untuk {sampleGuest.name}:
            </p>
            <pre className="text-xs whitespace-pre-wrap font-sans text-foreground leading-relaxed">
              {previewText}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            ← Kembali
          </button>
          <button
            type="button"
            onClick={() => setStep("preview")}
            disabled={!template.trim()}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            Preview & Kirim →
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Preview + confirm ──────────────────────────────────────────────
  if (step === "preview") {
    const previewing = previewGuest ?? selectedGuests[0];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("compose")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Edit pesan
          </button>
        </div>

        {/* Guest picker for preview */}
        <div>
          <span className="block text-xs font-medium text-muted-foreground mb-1.5">
            Preview untuk:
          </span>
          <select
            value={previewing?.id ?? ""}
            onChange={(e) => {
              const g = selectedGuests.find((x) => x.id === e.target.value);
              setPreviewGuest(g ?? null);
            }}
            className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Pilih tamu untuk preview"
          >
            {selectedGuests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.phone ?? g.email}
              </option>
            ))}
          </select>
        </div>

        {previewing && (
          <div className="rounded-2xl border bg-[#dcf8c6] p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
              <span className="text-xs font-medium text-[#25D366]">WhatsApp Preview</span>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
              {renderTemplate(template, previewing.name, getGuestLink(previewing))}
            </pre>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium">Siap kirim ke {selectedIds.size} tamu</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            via{" "}
            {provider === "fonnte"
              ? "Fonnte (WhatsApp)"
              : provider === "whatsapp_cloud"
                ? "WhatsApp Cloud API"
                : provider === "custom_webhook"
                  ? "Gateway Kustom (WhatsApp)"
                  : "Email SMTP"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep("compose")}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            ← Kembali
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Kirim Sekarang
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Sending ────────────────────────────────────────────────────────
  if (step === "sending") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm font-medium">Mengirim pesan...</p>
        <p className="text-xs text-muted-foreground">
          Mengirim ke {selectedIds.size} tamu, mohon tunggu.
        </p>
      </div>
    );
  }

  // ── Step: Done ───────────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-green-50 p-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-green-500 mb-1" aria-hidden="true" />
            <p className="text-2xl font-bold text-green-700">{result.sent}</p>
            <p className="text-xs text-green-600">Dikirim / Antre</p>
          </div>
          <div className="rounded-xl border bg-red-50 p-4 text-center">
            <XCircle className="mx-auto h-6 w-6 text-red-400 mb-1" aria-hidden="true" />
            <p className="text-2xl font-bold text-red-600">{result.failed}</p>
            <p className="text-xs text-red-500">Gagal</p>
          </div>
        </div>

        {/* Detail list */}
        {result.details.length > 0 && (
          <div className="rounded-xl border divide-y max-h-64 overflow-y-auto">
            {result.details.map((d) => (
              <div key={d.guestId} className="flex items-center gap-3 px-4 py-2.5">
                {d.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
                )}
                <span className="text-sm flex-1 truncate">{d.name}</span>
                {d.error && (
                  <span className="text-xs text-red-500 shrink-0 truncate max-w-[120px]">
                    {d.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setStep("select");
            setSelectedIds(new Set());
            setResult(null);
            setTemplate(DEFAULT_TEMPLATE);
          }}
          className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Kirim Pesan Lagi
        </button>
      </div>
    );
  }

  return null;
}
