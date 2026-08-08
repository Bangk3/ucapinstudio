"use client";

import { TEMPLATE_UNLOCK_COST_RUPIAH } from "@/lib/pricing";
import { zodResolver } from "@hookform/resolvers/zod";
import { TEMPLATES } from "@invyte/templates";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255),
  templateId: z.string().min(1, "Pilih template"),
  kind: z.enum([
    "wedding",
    "engagement",
    "birthday",
    "aqiqah",
    "khitanan",
    "baby_shower",
    "corporate",
  ]),
});

type FormData = z.infer<typeof schema>;

const KIND_LABELS: Record<string, string> = {
  wedding: "Pernikahan",
  engagement: "Pertunangan",
  birthday: "Ulang Tahun",
  aqiqah: "Aqiqah",
  khitanan: "Khitanan",
  baby_shower: "Baby Shower",
  corporate: "Korporat",
};

interface Props {
  tenantSlug: string;
  tenantId: string;
  creditBalance: number;
  unlockedTemplateIds: string[];
}

export function NewInvitationForm({ tenantSlug, creditBalance, unlockedTemplateIds }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(unlockedTemplateIds));
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { kind: "wedding", templateId: "minimalist-modern" },
  });

  const selectedTemplate = watch("templateId");

  async function handleUnlock(templateId: string) {
    setUnlockError(null);
    setUnlocking(templateId);
    try {
      const res = await fetch(`/api/v1/tenant/templates/${templateId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Gagal unlock template");
      }
      setUnlocked((prev) => new Set(prev).add(templateId));
      setValue("templateId", templateId, { shouldValidate: true });
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setUnlocking(null);
    }
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tenantSlug }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Gagal membuat undangan");
      }
      const { invitation } = await res.json();
      router.push(`/${tenantSlug}/dashboard/invitations/${invitation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="invitation-name" className="text-sm font-medium">
          Nama Undangan
        </label>
        <input
          id="invitation-name"
          {...register("name")}
          placeholder="cth. Pernikahan Budi & Ani"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Kind */}
      <div className="space-y-1.5">
        <label htmlFor="invitation-kind" className="text-sm font-medium">
          Jenis Acara
        </label>
        <select
          id="invitation-kind"
          {...register("kind")}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.entries(KIND_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Template picker */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Pilih Template</p>
        {errors.templateId && (
          <p className="text-xs text-destructive">{errors.templateId.message}</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const isLocked = t.isPremium && !unlocked.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (isLocked) {
                    void handleUnlock(t.id);
                  } else {
                    setValue("templateId", t.id, { shouldValidate: true });
                  }
                }}
                disabled={unlocking === t.id}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  selectedTemplate === t.id
                    ? "border-primary shadow-md ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                } ${unlocking === t.id ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full shrink-0"
                      style={{ backgroundColor: t.primaryColor }}
                    />
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  {isLocked && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      🔒 Rp {TEMPLATE_UNLOCK_COST_RUPIAH.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                {isLocked && unlocking === t.id && (
                  <p className="mt-2 text-xs text-muted-foreground">Membuka template...</p>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Saldo Anda: Rp {creditBalance.toLocaleString("id-ID")}
        </p>
        {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? "Membuat..." : "Buat Undangan →"}
        </button>
      </div>
    </form>
  );
}
