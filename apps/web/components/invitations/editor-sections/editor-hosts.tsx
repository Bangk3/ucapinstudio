"use client";

import type { InvitationContent } from "@invyte/templates";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  content: InvitationContent;
  onChange: (patch: Partial<InvitationContent>) => void;
  tenantId: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
}) {
  const fieldId = `host-field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={fieldId}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

interface PhotoFieldProps {
  label: string;
  value: string | undefined;
  onUrlChange: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  error: string | null;
  previewAlt: string;
}

function PhotoField({
  label,
  value,
  onUrlChange,
  onUpload,
  loading,
  error,
  previewAlt,
}: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void onUpload(file);
    }
    // reset so same file can be re-selected
    e.target.value = "";
  }

  const photoFieldId = `host-photo-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-1">
      <label htmlFor={photoFieldId} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={photoFieldId}
          value={value ?? ""}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://cdn.../photo.jpg"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors disabled:opacity-60"
          title="Upload foto"
        >
          <Upload className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "..." : "Upload"}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {value && (
        <img
          src={value}
          alt={previewAlt}
          className="mt-2 h-24 w-24 rounded-full object-cover border-2 border-primary/30"
        />
      )}
    </div>
  );
}

export function EditorHosts({ content, onChange, tenantId }: Props) {
  const hosts = content.hosts ?? {};
  const update = (patch: Partial<typeof hosts>) => onChange({ hosts: { ...hosts, ...patch } });

  const [groomLoading, setGroomLoading] = useState(false);
  const [groomError, setGroomError] = useState<string | null>(null);
  const [brideLoading, setBrideLoading] = useState(false);
  const [brideError, setBrideError] = useState<string | null>(null);

  async function uploadPhoto(
    file: File,
    setLoading: (v: boolean) => void,
    setError: (v: string | null) => void,
    onSuccess: (url: string) => void,
  ) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("type", "image");

      const res = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Upload gagal");
        return;
      }
      const data = (await res.json()) as { url: string };
      onSuccess(data.url);
    } catch {
      setError("Upload gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Mempelai Pria</h3>
        <Field
          label="Nama panggilan"
          value={hosts.groomName}
          onChange={(v) => update({ groomName: v })}
          placeholder="Budi"
        />
        <Field
          label="Nama lengkap"
          value={hosts.groomFull}
          onChange={(v) => update({ groomFull: v })}
          placeholder="Ahmad Budi Santoso, S.Kom"
        />
        <Field
          label="Nama orang tua"
          value={hosts.groomParents}
          onChange={(v) => update({ groomParents: v })}
          placeholder="Putra dari Bpk. X & Ibu Y"
        />
        <PhotoField
          label="Foto Mempelai Pria"
          value={hosts.groomPhotoUrl}
          onUrlChange={(v) => update({ groomPhotoUrl: v })}
          onUpload={(file) =>
            uploadPhoto(file, setGroomLoading, setGroomError, (url) =>
              update({ groomPhotoUrl: url }),
            )
          }
          loading={groomLoading}
          error={groomError}
          previewAlt="Foto mempelai pria"
        />
      </div>
      <div className="h-px bg-border" />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Mempelai Wanita</h3>
        <Field
          label="Nama panggilan"
          value={hosts.brideName}
          onChange={(v) => update({ brideName: v })}
          placeholder="Ani"
        />
        <Field
          label="Nama lengkap"
          value={hosts.brideFull}
          onChange={(v) => update({ brideFull: v })}
          placeholder="Siti Ani Rahayu, S.E."
        />
        <Field
          label="Nama orang tua"
          value={hosts.brideParents}
          onChange={(v) => update({ brideParents: v })}
          placeholder="Putri dari Bpk. A & Ibu B"
        />
        <PhotoField
          label="Foto Mempelai Wanita"
          value={hosts.bridePhotoUrl}
          onUrlChange={(v) => update({ bridePhotoUrl: v })}
          onUpload={(file) =>
            uploadPhoto(file, setBrideLoading, setBrideError, (url) =>
              update({ bridePhotoUrl: url }),
            )
          }
          loading={brideLoading}
          error={brideError}
          previewAlt="Foto mempelai wanita"
        />
      </div>
    </div>
  );
}
