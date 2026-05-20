"use client";

import { type InvitationContent, type ThemeConfig, getTemplate } from "@invyte/templates";

interface Props {
  templateId: string;
  content: InvitationContent;
  theme: ThemeConfig;
  slug: string;
  tenantSlug: string;
  guestName?: string;
}

export function InvitationPreview({
  templateId,
  content,
  theme,
  slug,
  tenantSlug,
  guestName,
}: Props) {
  const Template = getTemplate(templateId);

  if (!Template) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground text-sm">
        Template tidak ditemukan
      </div>
    );
  }

  const safeContent: InvitationContent = {
    ...content,
    hosts: content.hosts ?? {},
    events: content.events ?? [],
    galleryUrls: content.galleryUrls ?? [],
  };

  return (
    <Template
      data={{
        id: "preview",
        slug,
        tenantSlug,
        templateId,
        content: safeContent,
        theme,
        ...(guestName !== undefined ? { guestName } : {}),
        rsvpEnabled: true,
        wishesEnabled: true,
      }}
      preview
    />
  );
}
