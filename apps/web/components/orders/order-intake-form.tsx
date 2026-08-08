"use client";

import { useState } from "react";

const MAX_GALLERY_IMAGES = 10;

interface EventRow {
  id: string;
  name: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
}

function newEvent(): EventRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    date: "",
    time: "",
    venueName: "",
    venueAddress: "",
  };
}

interface Props {
  token: string;
  alreadySubmitted: boolean;
  paymentStatus: "pending" | "paid" | "rejected";
}

export function OrderIntakeForm({ token, alreadySubmitted, paymentStatus }: Props) {
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [story, setStory] = useState("");
  const [events, setEvents] = useState<EventRow[]>([newEvent()]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadySubmitted);

  function updateEvent(id: string, patch: Partial<EventRow>) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function handleGalleryChange(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length > MAX_GALLERY_IMAGES) {
      setError(`Maksimal ${MAX_GALLERY_IMAGES} foto galeri`);
      setGalleryFiles(files.slice(0, MAX_GALLERY_IMAGES));
      return;
    }
    setGalleryFiles(files);
  }

  async function handleSubmit() {
    setError(null);
    if (!groomName.trim() || !brideName.trim()) {
      setError("Nama mempelai wajib diisi");
      return;
    }
    if (!proofFile) {
      setError("Bukti transfer wajib diupload");
      return;
    }
    if (galleryFiles.length > MAX_GALLERY_IMAGES) {
      setError(`Maksimal ${MAX_GALLERY_IMAGES} foto galeri`);
      return;
    }

    setSubmitting(true);
    try {
      const submittedData = {
        hosts: { groomName: groomName.trim(), brideName: brideName.trim() },
        events: events
          .filter((e) => e.name.trim())
          .map((e) => ({
            id: e.id,
            name: e.name.trim(),
            ...(e.date ? { date: e.date } : {}),
            ...(e.time ? { time: e.time } : {}),
            ...(e.venueName ? { venueName: e.venueName } : {}),
            ...(e.venueAddress ? { venueAddress: e.venueAddress } : {}),
          })),
        ...(story.trim() ? { story: story.trim() } : {}),
      };

      const formData = new FormData();
      formData.append("submittedData", JSON.stringify(submittedData));
      formData.append("proofImage", proofFile);
      for (const file of galleryFiles) formData.append("galleryImages", file);

      const res = await fetch(`/api/v1/orders/${token}/submit`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof body.error === "string" ? body.error : "Gagal mengirim");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-2 py-8">
        <p className="text-lg font-medium">Terkirim!</p>
        <p className="text-sm text-muted-foreground">
          {paymentStatus === "paid"
            ? "Pembayaran sudah dikonfirmasi. Tim kami sedang menyiapkan undangan Anda."
            : "Kami akan segera memproses pembayaran dan data Anda."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="groom-name" className="text-sm font-medium">
            Nama Mempelai Pria
          </label>
          <input
            id="groom-name"
            value={groomName}
            onChange={(e) => setGroomName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bride-name" className="text-sm font-medium">
            Nama Mempelai Wanita
          </label>
          <input
            id="bride-name"
            value={brideName}
            onChange={(e) => setBrideName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Acara</p>
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border p-3 space-y-2">
            <input
              placeholder="Nama acara (mis. Akad, Resepsi)"
              value={event.name}
              onChange={(e) => updateEvent(event.id, { name: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={event.date}
                onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <input
                type="time"
                value={event.time}
                onChange={(e) => updateEvent(event.id, { time: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              placeholder="Nama lokasi"
              value={event.venueName}
              onChange={(e) => updateEvent(event.id, { venueName: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Alamat lengkap"
              value={event.venueAddress}
              onChange={(e) => updateEvent(event.id, { venueAddress: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEvents((prev) => [...prev, newEvent()])}
          className="text-xs font-medium text-primary hover:underline"
        >
          + Tambah acara
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="story" className="text-sm font-medium">
          Cerita Singkat (opsional)
        </label>
        <textarea
          id="story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="gallery" className="text-sm font-medium">
          Foto Pasangan (maks. {MAX_GALLERY_IMAGES} foto)
        </label>
        <input
          id="gallery"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleGalleryChange(e.target.files)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
        <p className="font-medium">Transfer ke:</p>
        <p className="text-muted-foreground">[ISI NOMOR REKENING DI SINI]</p>
        <p className="text-muted-foreground">[ISI QRIS/INFO PEMBAYARAN LAIN DI SINI]</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="proof" className="text-sm font-medium">
          Bukti Transfer
        </label>
        <input
          id="proof"
          type="file"
          accept="image/*"
          onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {submitting ? "Mengirim..." : "Kirim"}
      </button>
    </div>
  );
}
