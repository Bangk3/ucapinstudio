export { DigitalAmplop } from "./components/digital-amplop";
export { GalleryLightbox } from "./components/gallery-lightbox";
export { LoveTimeline } from "./components/love-timeline";
export { MapEmbed } from "./components/map-embed";
export { MinimalistModern } from "./templates/minimalist-modern";
export { FloralClassic } from "./templates/floral-classic";
export { IslamicElegant } from "./templates/islamic-elegant";
export { TropicalBali } from "./templates/tropical-bali";
export { RoyalJava } from "./templates/royal-java";
export { SereneGarden } from "./templates/serene-garden";
export { ModernBoho } from "./templates/modern-boho";
export { VintageClassic } from "./templates/vintage-classic";
export { WatercolorBotanical } from "./templates/watercolor-botanical";
export { DarkLuxury } from "./templates/dark-luxury";
export { PastelDreamy } from "./templates/pastel-dreamy";
export { RusticKraft } from "./templates/rustic-kraft";
export { GeometricModern } from "./templates/geometric-modern";
export { PhotoEditorial } from "./templates/photo-editorial";
export { MinimalLineArt } from "./templates/minimal-line-art";
export { SundaneseElegant } from "./templates/sundanese-elegant";
export { MinangHeritage } from "./templates/minang-heritage";
export { BatakTraditional } from "./templates/batak-traditional";
export { BetawiModern } from "./templates/betawi-modern";
export { BugisMakassarElegant } from "./templates/bugis-makassar-elegant";
export { ArabicCalligraphyLuxe } from "./templates/arabic-calligraphy-luxe";
export { AcehHeritage } from "./templates/aceh-heritage";
export { MelayuPalembang } from "./templates/melayu-palembang";
export { LampungTapis } from "./templates/lampung-tapis";
export { ComposerDynamic } from "./templates/composer-dynamic";

export type {
  TemplateProps,
  InvitationData,
  InvitationContent,
  ThemeConfig,
  HostInfo,
  EventInfo,
  ComposerRecipe,
  ComposerSection,
  HeroVariant,
  GalleryVariant,
  StoryVariant,
  AnimationPreset,
  DividerStyle,
} from "./types";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  tags: string[];
  previewImageUrl?: string;
  isPremium: boolean;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "minimalist-modern",
    name: "Minimalist Modern",
    description: "Bersih, kontemporer, elegan. Cocok untuk pasangan modern.",
    primaryColor: "#6b8f6e",
    accentColor: "#6b8f6e",
    tags: ["modern", "minimalis", "hijau"],
    isPremium: false,
  },
  {
    id: "floral-classic",
    name: "Floral Classic",
    description: "Romantis dengan sentuhan bunga dan warna krem hangat.",
    primaryColor: "#c4826a",
    accentColor: "#f5ede8",
    tags: ["romantis", "floral", "klasik"],
    isPremium: true,
  },
  {
    id: "islamic-elegant",
    name: "Islamic Elegant",
    description: "Islami dengan ornamen kaligrafi dan ayat Al-Quran.",
    primaryColor: "#c9a84c",
    accentColor: "#0f1b2d",
    tags: ["islami", "elegan", "gelap"],
    isPremium: false,
  },
  {
    id: "tropical-bali",
    name: "Tropical Bali",
    description: "Nuansa tropis Bali dengan warna hijau dan terrakota.",
    primaryColor: "#2d6a4f",
    accentColor: "#c87941",
    tags: ["tropis", "bali", "alam"],
    isPremium: true,
  },
  {
    id: "royal-java",
    name: "Royal Java",
    description: "Mewah bergaya Jawa dengan motif batik dan warna kerajaan.",
    primaryColor: "#8b1a2e",
    accentColor: "#c9a84c",
    tags: ["jawa", "batik", "mewah"],
    isPremium: true,
  },
  {
    id: "serene-garden",
    name: "Serene Garden",
    description: "Elegan romantis dengan nuansa krem hangat, bunga, dan sentuhan Islami.",
    primaryColor: "#9c7050",
    accentColor: "#c9a87a",
    tags: ["islami", "romantis", "floral", "elegan"],
    isPremium: true,
  },
  {
    id: "modern-boho",
    name: "Modern Boho",
    description: "Nuansa earthy hangat dengan aksen pampas dan huruf kursif hand-lettered.",
    primaryColor: "#b08968",
    accentColor: "#8a5a3b",
    tags: ["boho", "earthy", "romantis"],
    isPremium: true,
  },
  {
    id: "vintage-classic",
    name: "Vintage Classic",
    description: "Nuansa krem sepia dengan bingkai ornamen dan tipografi serif klasik.",
    primaryColor: "#8a6d3b",
    accentColor: "#c9a86a",
    tags: ["vintage", "klasik", "sepia"],
    isPremium: true,
  },
  {
    id: "watercolor-botanical",
    name: "Watercolor Botanical",
    description: "Ilustrasi bunga cat air lembut dengan tekstur kuas yang longgar.",
    primaryColor: "#7c9a7e",
    accentColor: "#a8c3a0",
    tags: ["watercolor", "botanical", "lembut"],
    isPremium: true,
  },
  {
    id: "dark-luxury",
    name: "Dark Luxury",
    description: "Hitam emas dengan kesan foil stamp, serif editorial, estetika old money.",
    primaryColor: "#c9a84c",
    accentColor: "#f5e3a0",
    tags: ["luxury", "gelap", "emas"],
    isPremium: true,
  },
  {
    id: "pastel-dreamy",
    name: "Pastel Dreamy",
    description: "Gradasi pastel lembut dengan elemen ilustrasi whimsical yang menggemaskan.",
    primaryColor: "#c98fb5",
    accentColor: "#a3c4bc",
    tags: ["pastel", "dreamy", "whimsical"],
    isPremium: true,
  },
  {
    id: "rustic-kraft",
    name: "Rustic Kraft",
    description: "Tekstur kertas kraft dengan huruf hand-lettered dan aksen kayu/tali.",
    primaryColor: "#8d6e4a",
    accentColor: "#b98a5e",
    tags: ["rustic", "kraft", "handmade"],
    isPremium: true,
  },
  {
    id: "geometric-modern",
    name: "Geometric Modern",
    description: "Bentuk geometris tegas, motif line-art bersih, layout editorial grid.",
    primaryColor: "#2f4f4f",
    accentColor: "#c87941",
    tags: ["geometric", "editorial", "modern"],
    isPremium: true,
  },
  {
    id: "photo-editorial",
    name: "Photo Editorial",
    description: "Foto hero besar dengan layout tipografi ala majalah mode.",
    primaryColor: "#b02a30",
    accentColor: "#111111",
    tags: ["foto", "editorial", "majalah"],
    isPremium: true,
  },
  {
    id: "minimal-line-art",
    name: "Minimal Line Art",
    description: "Ilustrasi garis tunggal ultra-minimal dengan banyak ruang putih.",
    primaryColor: "#3a3a3a",
    accentColor: "#9a9a9a",
    tags: ["minimalis", "line-art", "modern"],
    isPremium: false,
  },
  {
    id: "sundanese-elegant",
    name: "Sundanese Elegant",
    description: "Motif mega mendung khas Sunda dengan nuansa earth tone lembut.",
    primaryColor: "#6b5b3e",
    accentColor: "#a8916a",
    tags: ["sunda", "adat", "mega-mendung"],
    isPremium: true,
  },
  {
    id: "minang-heritage",
    name: "Minang Heritage",
    description: "Aksen songket emas khas Minang dengan palet merah marun dan emas.",
    primaryColor: "#8c2f39",
    accentColor: "#c9a84c",
    tags: ["minang", "adat", "songket"],
    isPremium: true,
  },
  {
    id: "batak-traditional",
    name: "Batak Traditional",
    description: "Aksen ulos ragidup khas Batak dengan palet merah, hitam, dan putih.",
    primaryColor: "#a3232f",
    accentColor: "#2b2b2b",
    tags: ["batak", "adat", "ulos"],
    isPremium: true,
  },
  {
    id: "betawi-modern",
    name: "Betawi Modern",
    description: "Aksen gigi balang khas Betawi dengan palet merah hangat dan emas.",
    primaryColor: "#b23a2a",
    accentColor: "#c9a84c",
    tags: ["betawi", "adat", "modern"],
    isPremium: true,
  },
  {
    id: "bugis-makassar-elegant",
    name: "Bugis-Makassar Elegant",
    description: "Aksen tenun sarung khas Bugis-Makassar dengan palet jewel tone.",
    primaryColor: "#2e5d4f",
    accentColor: "#c9a84c",
    tags: ["bugis", "makassar", "tenun"],
    isPremium: true,
  },
  {
    id: "arabic-calligraphy-luxe",
    name: "Arabic Calligraphy Luxe",
    description: "Kaligrafi Arab emas di atas hijau zamrud — kemewahan bernuansa islami.",
    primaryColor: "#0f4c3a",
    accentColor: "#c9a84c",
    tags: ["islami", "kaligrafi", "luxe"],
    isPremium: true,
  },
  {
    id: "aceh-heritage",
    name: "Aceh Heritage",
    description: "Motif Pinto Aceh emas di atas hitam, kesan islami dan megah.",
    primaryColor: "#c9a24a",
    accentColor: "#8b2635",
    tags: ["aceh", "adat", "islami"],
    isPremium: true,
  },
  {
    id: "melayu-palembang",
    name: "Melayu Palembang",
    description: "Motif songket emas-merah dengan siluet Rumah Limas, kesan mewah Melayu.",
    primaryColor: "#9c1f2e",
    accentColor: "#1f6b4a",
    tags: ["melayu", "palembang", "adat", "songket"],
    isPremium: true,
  },
  {
    id: "lampung-tapis",
    name: "Lampung Tapis",
    description: "Motif Tapis geometris dengan siluet Siger, palet marun dan emas.",
    primaryColor: "#7a1f2b",
    accentColor: "#c9a84c",
    tags: ["lampung", "adat", "tapis"],
    isPremium: true,
  },
  {
    id: "ai-composer",
    name: "AI Composer",
    description: "Layout dibuat oleh AI — pilih blok, gaya, dan animasi.",
    primaryColor: "#DB2777",
    accentColor: "#A16207",
    tags: ["ai", "dinamis", "kustom"],
    isPremium: true,
  },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as [string, ...string[]];

import type { ComponentType } from "react";
import { AcehHeritage } from "./templates/aceh-heritage";
import { ArabicCalligraphyLuxe } from "./templates/arabic-calligraphy-luxe";
import { BatakTraditional } from "./templates/batak-traditional";
import { BetawiModern } from "./templates/betawi-modern";
import { BugisMakassarElegant } from "./templates/bugis-makassar-elegant";
import { ComposerDynamic as _ComposerDynamic } from "./templates/composer-dynamic";
import { DarkLuxury } from "./templates/dark-luxury";
import { FloralClassic } from "./templates/floral-classic";
import { GeometricModern } from "./templates/geometric-modern";
import { IslamicElegant } from "./templates/islamic-elegant";
import { LampungTapis } from "./templates/lampung-tapis";
import { MelayuPalembang } from "./templates/melayu-palembang";
import { MinangHeritage } from "./templates/minang-heritage";
import { MinimalLineArt } from "./templates/minimal-line-art";
import { MinimalistModern } from "./templates/minimalist-modern";
import { ModernBoho } from "./templates/modern-boho";
import { PastelDreamy } from "./templates/pastel-dreamy";
import { PhotoEditorial } from "./templates/photo-editorial";
import { RoyalJava } from "./templates/royal-java";
import { RusticKraft } from "./templates/rustic-kraft";
import { SereneGarden } from "./templates/serene-garden";
import { SundaneseElegant } from "./templates/sundanese-elegant";
import { TropicalBali } from "./templates/tropical-bali";
import { VintageClassic } from "./templates/vintage-classic";
import { WatercolorBotanical } from "./templates/watercolor-botanical";
import type { TemplateProps } from "./types";

export const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  "minimalist-modern": MinimalistModern,
  "floral-classic": FloralClassic,
  "islamic-elegant": IslamicElegant,
  "tropical-bali": TropicalBali,
  "royal-java": RoyalJava,
  "serene-garden": SereneGarden,
  "modern-boho": ModernBoho,
  "vintage-classic": VintageClassic,
  "watercolor-botanical": WatercolorBotanical,
  "dark-luxury": DarkLuxury,
  "pastel-dreamy": PastelDreamy,
  "rustic-kraft": RusticKraft,
  "geometric-modern": GeometricModern,
  "photo-editorial": PhotoEditorial,
  "minimal-line-art": MinimalLineArt,
  "sundanese-elegant": SundaneseElegant,
  "minang-heritage": MinangHeritage,
  "batak-traditional": BatakTraditional,
  "betawi-modern": BetawiModern,
  "bugis-makassar-elegant": BugisMakassarElegant,
  "arabic-calligraphy-luxe": ArabicCalligraphyLuxe,
  "aceh-heritage": AcehHeritage,
  "melayu-palembang": MelayuPalembang,
  "lampung-tapis": LampungTapis,
  "ai-composer": _ComposerDynamic,
};

export function getTemplate(id: string): ComponentType<TemplateProps> | undefined {
  return TEMPLATE_COMPONENTS[id];
}

export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
