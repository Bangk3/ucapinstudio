export interface HostInfo {
  groomName: string;
  groomFull?: string;
  groomParents?: string;
  brideName: string;
  brideFull?: string;
  brideParents?: string;
  photoUrl?: string;
  groomPhotoUrl?: string;
  bridePhotoUrl?: string;
}

export interface EventInfo {
  id: string;
  name: string;
  date?: string;
  time?: string;
  venueName?: string;
  venueAddress?: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  livestreamUrl?: string;
  dressCode?: string;
}

export interface InvitationContent {
  hosts: HostInfo;
  events: EventInfo[];
  story?: string;
  quote?: string;
  quoteAuthor?: string;
  thanksNote?: string;
  galleryUrls?: string[];
  musicUrl?: string;
  musicTitle?: string;
  timeline?: Array<{
    year: string;
    title: string;
    description?: string;
    emoji?: string;
  }>;
  amplop?: {
    /** URL to QRIS image (uploaded to storage) */
    qrisUrl?: string;
    qrisNote?: string;
    bankAccounts?: Array<{
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }>;
    ewallets?: Array<{
      /** Provider slug for icon selection */
      provider: "gopay" | "ovo" | "dana" | "shopeepay" | "other";
      providerLabel?: string;
      number: string;
      holder: string;
    }>;
  };
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  fontHeading?: string;
  fontBody?: string;
  coverPhotoUrl?: string;
}

export interface InvitationData {
  id: string;
  slug: string;
  tenantSlug: string;
  templateId: string;
  content: InvitationContent;
  theme: ThemeConfig;
  guestName?: string;
  guestId?: string;
  rsvpEnabled: boolean;
  wishesEnabled: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  defaultTheme: ThemeConfig;
  component: React.ComponentType<TemplateProps>;
}

export interface TemplateProps {
  data: InvitationData;
  preview?: boolean;
}
