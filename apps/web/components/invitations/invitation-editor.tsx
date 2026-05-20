"use client";

import type { Invitation } from "@invyte/db";
import type { InvitationContent, ThemeConfig } from "@invyte/templates";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ExternalLink,
  Heart,
  type LucideIcon,
  Mail,
  MessageSquare,
  Monitor,
  Palette,
  QrCode,
  Send,
  Settings,
  Smartphone,
  Sparkles,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
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
  { id: "hosts", label: "Mempelai", icon: Heart },
  { id: "events", label: "Acara", icon: Calendar },
  { id: "story", label: "Kisah", icon: BookOpen },
  { id: "amplop", label: "Amplop", icon: Mail },
  { id: "theme", label: "Tema", icon: Palette },
  { id: "settings", label: "Pengaturan", icon: Settings },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: LucideIcon }>;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  invitation: Invitation;
  tenantSlug: string;
}

export function InvitationEditor({ invitation, tenantSlug }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("hosts");
  const [content, setContent] = useState<InvitationContent>(() => {
    const raw = (invitation.content as InvitationContent) ?? {};
    return {
      ...raw,
      hosts: raw.hosts ?? { groomName: "", brideName: "" },
      events: raw.events ?? [],
      galleryUrls: raw.galleryUrls ?? [],
    };
  });
  const [theme, setTheme] = useState<ThemeConfig>((invitation.theme as ThemeConfig) ?? {});
  const [templateId, setTemplateId] = useState(invitation.templateId ?? "minimalist-modern");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [zoom, setZoom] = useState<number>(0.6); // 0.6 default; range 0.3-2.0
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ZOOM_STEP = 0.1;
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 2.0;
  function zoomIn() {
    setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  }
  function zoomOut() {
    setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  }
  function zoomReset() {
    setZoom(previewMode === "desktop" ? 0.6 : 0.85);
  }

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
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  return (
    <div
      className="flex flex-col -m-4 md:-m-6 overflow-hidden"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Mobile-only: Editor / Preview tab strip */}
      <div className="flex shrink-0 border-b bg-background md:hidden">
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            mobileView === "editor"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            mobileView === "preview"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Pratinjau
        </button>
      </div>

      {/* Main content row */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Editor panel ── */}
        <div
          className={`flex flex-col border-r bg-background w-full md:w-auto md:max-w-md ${
            mobileView === "editor" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
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

          {/* Section tabs */}
          <div className="flex border-b overflow-x-auto shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
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

        {/* ── Preview panel ── */}
        <div
          className={`flex flex-col flex-1 overflow-hidden bg-gray-100 ${
            mobileView === "preview" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Preview toolbar */}
          <div className="flex items-center gap-2 border-b bg-background px-4 py-2.5 shrink-0 overflow-x-auto">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Preview</span>
            {/* Desktop / Mobile toggle */}
            <div className="flex items-center rounded-lg border bg-muted p-0.5 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPreviewMode("desktop");
                  setZoom(0.6);
                }}
                className={`flex items-center justify-center rounded-md p-1 transition-colors ${previewMode === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Preview desktop"
                title="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewMode("mobile");
                  setZoom(0.85);
                }}
                className={`flex items-center justify-center rounded-md p-1 transition-colors ${previewMode === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Preview mobile"
                title="Mobile (375px)"
              >
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            {/* Zoom controls */}
            <div className="flex items-center rounded-lg border bg-muted p-0.5 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Perkecil preview"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground hover:text-foreground transition-colors min-w-[36px]"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Perbesar preview"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/guests`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Tamu
              </Link>
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/rsvp`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                RSVP
              </Link>
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/wishes`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                Buku Tamu
              </Link>
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/analytics`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Analitik
              </Link>
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/broadcast`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Kirim Pesan
              </Link>
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/checkin`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                Check-in
              </Link>
              <Link
                href={`/${tenantSlug}/dashboard/invitations/${invitation.id}/ai`}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI Design
              </Link>
              <a
                href={`/${tenantSlug}/u/${invitation.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Buka
              </a>
            </div>
          </div>

          {/* Preview viewport */}
          <div className="flex-1 overflow-auto flex items-start justify-center">
            {previewMode === "desktop" ? (
              <div className="w-full h-full overflow-auto">
                <div
                  className="origin-top-left"
                  style={{
                    transform: `scale(${zoom})`,
                    width: `${100 / zoom}%`,
                    height: `${100 / zoom}%`,
                  }}
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
              <div
                className="flex-shrink-0 overflow-auto h-full"
                style={{ width: `${375 * zoom}px` }}
              >
                <div
                  className="origin-top"
                  style={{
                    transform: `scale(${zoom})`,
                    width: "375px",
                    transformOrigin: "top center",
                  }}
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
    </div>
  );
}
