"use client";

import type { InvitationContent } from "@invyte/templates";
import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  content: InvitationContent;
  onChange: (patch: Partial<InvitationContent>) => void;
  tenantId: string;
}

export function EditorStory({ content, onChange, tenantId }: Props) {
  // Local raw text for gallery — avoids filter(Boolean) collapsing newlines mid-type
  const [galleryRaw, setGalleryRaw] = useState(() => (content.galleryUrls ?? []).join("\n"));
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Sync if parent resets content from outside (e.g. navigation)
  useEffect(() => {
    setGalleryRaw((content.galleryUrls ?? []).join("\n"));
  }, [content.galleryUrls?.join(",")]);

  function commitGallery(raw: string) {
    const urls = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ galleryUrls: urls });
  }

  async function uploadSingleImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenantId", tenantId);
    formData.append("type", "image");

    const res = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Upload gagal");
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  async function handleMusicFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setMusicLoading(true);
    setMusicError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("type", "audio");

      const res = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMusicError(body.error ?? "Upload gagal");
        return;
      }
      const data = (await res.json()) as { url: string };
      onChange({ musicUrl: data.url });
    } catch {
      setMusicError("Upload gagal, coba lagi");
    } finally {
      setMusicLoading(false);
    }
  }

  async function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploadError(null);
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      setUploadProgress(`Mengupload ${i + 1}/${files.length}...`);
      try {
        const url = await uploadSingleImage(file);
        uploadedUrls.push(url);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Upload gagal");
      }
    }

    setUploadProgress(null);

    if (uploadedUrls.length > 0) {
      // Append to existing gallery
      const existing = content.galleryUrls ?? [];
      const next = [...existing, ...uploadedUrls];
      onChange({ galleryUrls: next });
      setGalleryRaw(next.join("\n"));
    }

    if (errors.length > 0) {
      setUploadError(`${errors.length} file gagal diupload: ${errors[0]}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="story-text" className="text-xs font-medium text-muted-foreground">
          Kisah Cinta
        </label>
        <textarea
          id="story-text"
          value={content.story ?? ""}
          onChange={(e) => onChange({ story: e.target.value })}
          placeholder="Ceritakan kisah pertemuan Anda berdua..."
          rows={5}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="story-music-url" className="text-xs font-medium text-muted-foreground">
            Musik Latar (opsional)
          </label>
          <button
            type="button"
            onClick={() => musicInputRef.current?.click()}
            disabled={musicLoading}
            className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors disabled:opacity-60"
            title="Upload file musik MP3/OGG (maks 8MB)"
          >
            <Upload className={`h-3 w-3 ${musicLoading ? "animate-spin" : ""}`} />
            {musicLoading ? "Mengupload..." : "Upload MP3"}
          </button>
        </div>
        <input
          id="story-music-url"
          value={content.musicUrl ?? ""}
          onChange={(e) => onChange({ musicUrl: e.target.value })}
          placeholder="https://... atau upload file MP3/OGG di atas"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {musicError && <p className="text-xs text-destructive">{musicError}</p>}
        {content.musicUrl && (
          <audio
            src={content.musicUrl}
            controls
            className="w-full mt-1 h-8"
            aria-label="Preview musik latar"
          />
        )}
        <p className="text-xs text-muted-foreground">MP3/OGG maks 8MB, atau tempel URL langsung</p>
        <input
          ref={musicInputRef}
          type="file"
          accept="audio/mpeg,audio/ogg,audio/mp3,.mp3,.ogg"
          className="hidden"
          onChange={handleMusicFile}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="story-gallery-urls" className="text-xs font-medium text-muted-foreground">
            Galeri Foto (URL, satu per baris)
          </label>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploadProgress !== null}
            className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors disabled:opacity-60"
            title="Upload foto galeri"
          >
            <Upload className={`h-3 w-3 ${uploadProgress !== null ? "animate-spin" : ""}`} />
            {uploadProgress !== null ? uploadProgress : "Upload Foto"}
          </button>
        </div>
        <textarea
          id="story-gallery-urls"
          value={galleryRaw}
          onChange={(e) => setGalleryRaw(e.target.value)}
          onBlur={() => commitGallery(galleryRaw)}
          placeholder={"https://cdn.../foto1.jpg\nhttps://cdn.../foto2.jpg"}
          rows={4}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryFiles}
        />
      </div>
    </div>
  );
}
