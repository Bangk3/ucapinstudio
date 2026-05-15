export { GalleryLightbox } from "./components/gallery-lightbox";
export { MapEmbed } from "./components/map-embed";
export { MinimalistModern } from "./templates/minimalist-modern";
export { FloralClassic } from "./templates/floral-classic";
export { IslamicElegant } from "./templates/islamic-elegant";
export { TropicalBali } from "./templates/tropical-bali";
export { RoyalJava } from "./templates/royal-java";
export { SereneGarden } from "./templates/serene-garden";

export type {
  TemplateProps,
  InvitationData,
  InvitationContent,
  ThemeConfig,
  HostInfo,
  EventInfo,
} from "./types";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  tags: string[];
  previewImageUrl?: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "minimalist-modern",
    name: "Minimalist Modern",
    description: "Bersih, kontemporer, elegan. Cocok untuk pasangan modern.",
    primaryColor: "#6b8f6e",
    accentColor: "#6b8f6e",
    tags: ["modern", "minimalis", "hijau"],
  },
  {
    id: "floral-classic",
    name: "Floral Classic",
    description: "Romantis dengan sentuhan bunga dan warna krem hangat.",
    primaryColor: "#c4826a",
    accentColor: "#f5ede8",
    tags: ["romantis", "floral", "klasik"],
  },
  {
    id: "islamic-elegant",
    name: "Islamic Elegant",
    description: "Islami dengan ornamen kaligrafi dan ayat Al-Quran.",
    primaryColor: "#c9a84c",
    accentColor: "#0f1b2d",
    tags: ["islami", "elegan", "gelap"],
  },
  {
    id: "tropical-bali",
    name: "Tropical Bali",
    description: "Nuansa tropis Bali dengan warna hijau dan terrakota.",
    primaryColor: "#2d6a4f",
    accentColor: "#c87941",
    tags: ["tropis", "bali", "alam"],
  },
  {
    id: "royal-java",
    name: "Royal Java",
    description: "Mewah bergaya Jawa dengan motif batik dan warna kerajaan.",
    primaryColor: "#8b1a2e",
    accentColor: "#c9a84c",
    tags: ["jawa", "batik", "mewah"],
  },
  {
    id: "serene-garden",
    name: "Serene Garden",
    description: "Elegan romantis dengan nuansa krem hangat, bunga, dan sentuhan Islami.",
    primaryColor: "#9c7050",
    accentColor: "#c9a87a",
    tags: ["islami", "romantis", "floral", "elegan"],
  },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as [string, ...string[]];

import type { ComponentType } from "react";
import { FloralClassic } from "./templates/floral-classic";
import { IslamicElegant } from "./templates/islamic-elegant";
import { MinimalistModern } from "./templates/minimalist-modern";
import { RoyalJava } from "./templates/royal-java";
import { SereneGarden } from "./templates/serene-garden";
import { TropicalBali } from "./templates/tropical-bali";
import type { TemplateProps } from "./types";

export const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  "minimalist-modern": MinimalistModern,
  "floral-classic": FloralClassic,
  "islamic-elegant": IslamicElegant,
  "tropical-bali": TropicalBali,
  "royal-java": RoyalJava,
  "serene-garden": SereneGarden,
};

export function getTemplate(id: string): ComponentType<TemplateProps> | undefined {
  return TEMPLATE_COMPONENTS[id];
}

export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
