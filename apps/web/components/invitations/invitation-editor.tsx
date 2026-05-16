"use client";

import type { Invitation } from "@invyte/db";
import type { InvitationContent, ThemeConfig } from "@invyte/templates";
import { Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { EditorAmplop } from "./editor-sections/editor-amplop";
import { EditorEvents } from "./editor-sections/editor-events";
import { EditorHosts } from "./editor-sections/editor-hosts";
import { EditorSettings } from "./editor-sections/editor-settings";
import { EditorStory } from "./editor-sections/editor-story";
import { EditorTheme } from "./editor-sections/editor-theme";
import { InvitationPreview } from "./invitation-preview";

const TABS = [
  { id: "hosts", label: "Mempelai" },
  { id: "events", label: "Acara" },
  { id: "story", label: "Kisah" },
  { id: "amplop", label: "Amplop" },
  { id: "theme", label: "Tema" },
  { id: "settings", label: "Pengaturan" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  invitation: Invitation;
  tenantSlug: string;
}

export function InvitationEditor({ invitation, tenantSlug }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("hosts");
  const [content, setContent] = useState<InvitationContent>(
    (invitation.content as InvitationContent) ?? {
      hosts: { groomName: "", brideName: "" },
      events: [],
    },
  );
  const [theme, setTheme] = useState<ThemeConfig>((invitation.theme as ThemeConfig) ?? {});
  const [templateId, setTemplateId] = useState(invitation.templateId ?? "minimalist-modern");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    (newContent: InvitationContent, newTheme: ThemeConfig, newTemplateId: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("idle");
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          const res = await fetch(`/api/v1/invitations/${invitation.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: newContent,
              theme: newTheme,
              templateId: newTemplateId,
              tenantSlug,
            }),
          });
          setSaveStatus(res.ok ? "saved" : "error");
        } catch {
          setSaveStatus("error");
        } finally {
          setSaving(false);
        }
      }, 1200);
    },
    [invitation.id, tenantSlug],
  );

  function updateContent(patch: Partial<InvitationContent>) {
    const next = { ...content, ...patch };
    setContent(next);
    scheduleSave(next, theme, templateId);
  }

  function updateTheme(patch: Partial<ThemeConfig>) {
    const next = { ...theme, ...patch };
    setTheme(next);
    scheduleSave(content, next, templateId);
  }

  function updateTemplate(id: string) {
    setTemplateId(id);
    scheduleSave(content, theme, id);
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/invitations/${invitation.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPublishing(false);
    }
  }

  const isPublished = invitation.status === "published";

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-6">
      {/* Editor panel */}
      <div className="flex w-full max-w-md flex-col border-r bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">{invitation.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-xs font-medium ${isPublished ? "text-green-600" : "text-yellow-600"}`}
              >
                {isPublished ? "Terbit" : "Draft"}
              </span>
              {saving && <span className="text-xs text-muted-foreground">Menyimpan...</span>}
              {saveStatus === "saved" && !saving && (
                <span className="text-xs text-green-500">Tersimpan ✓</span>
              )}
              {saveStatus === "error" && !saving && (
                <span className="text-xs text-destructive">Gagal simpan</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isPublished
                ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } disabled:opacity-60`}
          >
            {publishing ? "..." : isPublished ? "Cabut" : "Terbitkan"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "hosts" && (
            <EditorHosts
              content={content}
              onChange={updateContent}
              tenantId={invitation.tenantId}
            />
          )}
          {activeTab === "events" && <EditorEvents content={content} onChange={updateContent} />}
          {activeTab === "story" && (
            <EditorStory
              content={content}
              onChange={updateContent}
              tenantId={invitation.tenantId}
            />
          )}
          {activeTab === "amplop" && (
            <EditorAmplop
              content={content}
              onChange={updateContent}
              tenantId={invitation.tenantId}
            />
          )}
          {activeTab === "theme" && (
            <EditorTheme
              theme={theme}
              templateId={templateId}
              onThemeChange={updateTheme}
              onTemplateChange={updateTemplate}
              tenantId={invitation.tenantId}
            />
          )}
          {activeTab === "settings" && (
            <EditorSettings invitation={invitation} tenantSlug={tenantSlug} />
          )}
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <div className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">Preview</span>
          {/* Mobile/Desktop toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={`flex items-center justify-center rounded-md p-1 transition-colors ${previewMode === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Preview desktop"
              title="Desktop"
            >
              <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`flex items-center justify-center rounded-md p-1 transition-colors ${previewMode === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Preview mobile"
              title="Mobile (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/guests`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tamu
            </Link>
            <Link
              href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/rsvp`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              RSVP
            </Link>
            <Link
              href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/wishes`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Buku Tamu
            </Link>
            <Link
              href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/analytics`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Analitik
            </Link>
            <Link
              href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/broadcast`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Kirim Pesan
            </Link>
            <a
              href={`/${tenantSlug}/u/${invitation.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Buka ↗
            </a>
          </div>
        </div>
        {/* Preview viewport — switches between desktop (scaled full-width) and mobile (375px frame) */}
        <div className="h-[calc(100%-2.5rem)] overflow-hidden flex items-start justify-center">
          {previewMode === "desktop" ? (
            /* Desktop: scale full panel width to 0.6 */
            <div className="w-full h-full overflow-hidden">
              <div
                className="origin-top-left scale-[0.6] overflow-y-auto"
                style={{ width: "166.67%", height: "166.67%" }}
              >
                <InvitationPreview
                  templateId={templateId}
                  content={content}
                  theme={theme}
                  slug={invitation.slug}
                  tenantSlug={tenantSlug}
                />
              </div>
            </div>
          ) : (
            /* Mobile: 375px wide phone frame, centered, scrollable */
            <div className="flex-shrink-0 overflow-y-auto h-full" style={{ width: "375px" }}>
              <div
                className="origin-top scale-[0.85]"
                style={{ width: "441px", transformOrigin: "top center" }}
              >
                <InvitationPreview
                  templateId={templateId}
                  content={content}
                  theme={theme}
                  slug={invitation.slug}
                  tenantSlug={tenantSlug}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
