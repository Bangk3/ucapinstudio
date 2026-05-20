"use client";

import type { Invitation } from "@invyte/db";
import { type InvitationContent, type ThemeConfig, getTemplate } from "@invyte/templates";

interface Props {
  invitation: Invitation;
  tenantSlug: string;
  guestName?: string;
  guestId?: string;
}

export function PublicInvitation({ invitation, tenantSlug, guestName, guestId }: Props) {
  const Template = getTemplate(invitation.templateId ?? "minimalist-modern");

  if (!Template) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Template tidak tersedia
      </div>
    );
  }

  const rawContent = invitation.content as InvitationContent;
  const safeContent: InvitationContent = {
    ...rawContent,
    hosts: rawContent?.hosts ?? {},
    events: rawContent?.events ?? [],
    galleryUrls: rawContent?.galleryUrls ?? [],
  };

  return (
    <Template
      data={{
        id: invitation.id,
        slug: invitation.slug,
        tenantSlug,
        templateId: invitation.templateId ?? "minimalist-modern",
        content: safeContent,
        theme: invitation.theme as ThemeConfig,
        ...(guestName !== undefined ? { guestName } : {}),
        ...(guestId !== undefined ? { guestId } : {}),
        rsvpEnabled: invitation.rsvpEnabled,
        wishesEnabled: invitation.wishesEnabled,
      }}
    />
  );
}
