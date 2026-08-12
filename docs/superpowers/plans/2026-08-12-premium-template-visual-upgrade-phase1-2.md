# Premium Template Visual Upgrade — Phase 1 (Foundation) + Phase 2 (Proof of Concept) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the font-loading bug, build a reusable original-SVG ornament
component library, and apply it fully to 2 templates (`dark-luxury`,
`floral-classic`) as a proof of concept before rolling out to the other 8
templates in the spec.

**Architecture:** New `packages/templates/src/components/ornaments/`
directory holds 3 presentational SVG components (`PaperTexture`,
`CornerOrnament`, `PortraitFrame`) plus a `quick-nav.tsx` sibling — all
pure React/SVG, no new dependencies, colors driven by props so every
template's existing `theme.primaryColor` customization keeps working.
`apps/web/app/layout.tsx` gains two more `next/font/google` loads. The two
proof-of-concept templates are edited to use the new components in place of
flat CSS shapes and the plain `CoupleCarousel` photo ring.

**Tech Stack:** React 19, `framer-motion` (already a dependency of
`@invyte/templates`), inline SVG, Tailwind CSS (in the `apps/web`
consumer only — the templates package itself uses Tailwind utility
classes too, matching its existing files).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-12-premium-template-visual-upgrade-design.md`
- No new npm dependencies. No new binary/photographic assets — SVG/CSS
  only, per the spec's licensing decision (original work, MIT-compatible).
- `packages/templates` has **no test infrastructure** (`package.json` has
  no `test` script, no vitest, zero `*.test.*` files across its 20+
  existing template files) — this is the established convention for this
  specific package (visual React components verified by rendering, not
  unit tests). Do **not** add a new test harness here; each task's
  verification step is `pnpm --filter @invyte/templates typecheck` plus,
  for the two template-integration tasks, a real render check through the
  homepage preview.
- Every new component gets `"use client"` at the top, matching every
  existing file in this package.
- Component props are colored via a `color`/`primaryColor` prop, never a
  hardcoded hex — matches the existing `theme.primaryColor` customization
  pattern used throughout the templates package.
- Commit messages: if a message would contain a backtick or other
  shell-special character, write it to a temp file and use
  `git commit -F <file>` instead of `-m` (lesson from this session,
  documented in `lessons.md`).

---

### Task 1: Font-loading fix

**Files:**
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**
- Produces: CSS custom properties `--font-playfair` and `--font-bodoni`,
  available globally on `<body>` alongside the existing `--font-sans`,
  `--font-serif`, `--font-script`. No template code needs to change to
  benefit from this — `dark-luxury.tsx` and others already reference
  `'Playfair Display'` by name in inline `fontFamily` strings, and once
  the font is loaded by `next/font/google` anywhere in the app, the
  browser resolves that name correctly.

- [ ] **Step 1: Add the two font imports and loaders**

In `apps/web/app/layout.tsx`, change:

```tsx
import { Cormorant_Infant, Great_Vibes, Inter } from "next/font/google";
```

to:

```tsx
import { Bodoni_Moda, Cormorant_Infant, Great_Vibes, Inter, Playfair_Display } from "next/font/google";
```

Then, after the existing `greatVibes` loader block, add:

```tsx
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});
```

- [ ] **Step 2: Add the new font variables to `<body>`**

Change:

```tsx
        className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable} font-sans antialiased`}
```

to:

```tsx
        className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable} ${playfair.variable} ${bodoni.variable} font-sans antialiased`}
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @invyte/web typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "fix(web): load Playfair Display + Bodoni Moda fonts

Several templates (dark-luxury.tsx confirmed, likely others)
reference these fonts by name in inline fontFamily strings, but
neither was ever loaded via next/font — they were silently falling
back to the browser default serif. This was found during the
premium-template-visual-upgrade design work."
```

---

### Task 2: `PaperTexture` component

**Files:**
- Create: `packages/templates/src/components/ornaments/paper-texture.tsx`

**Interfaces:**
- Produces: `PaperTexture({ opacity?: number; className?: string })` — a
  full-bleed (`absolute inset-0 h-full w-full`), pointer-events-none SVG
  grain overlay. Uses `mix-blend-mode: overlay` so it self-adjusts to
  whatever background color/image sits behind it — no `color` prop needed.
  Caller is responsible for giving its parent `position: relative` (or
  a non-static position) and rendering `PaperTexture` as an early child so
  normal document order paints the section content above it.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useId } from "react";

interface PaperTextureProps {
  /** Overall opacity of the grain layer. Defaults to 0.04 (very subtle). */
  opacity?: number;
  className?: string;
}

/**
 * Full-bleed subtle paper-grain texture, generated purely with an SVG
 * feTurbulence filter (no image asset). `mix-blend-mode: overlay` makes it
 * self-adjust to the color behind it, so it works unchanged on both light
 * and dark template backgrounds.
 */
export function PaperTexture({ opacity = 0.04, className }: PaperTextureProps) {
  // useId() can contain colons, which are unreliable inside an SVG
  // url(#id) reference across browsers — strip them.
  const filterId = `paper-texture-${useId().replace(/:/g, "")}`;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
      style={{ opacity, mixBlendMode: "overlay" }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <title>Paper texture</title>
      <filter id={filterId}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/src/components/ornaments/paper-texture.tsx
git commit -m "feat(templates): add PaperTexture ornament component"
```

---

### Task 3: `CornerOrnament` component

**Files:**
- Create: `packages/templates/src/components/ornaments/corner-ornament.tsx`

**Interfaces:**
- Produces: `CornerOrnament({ variant: OrnamentVariant; color: string;
  corner: OrnamentCorner; size?: number; className?: string })` and the
  exported types `OrnamentVariant = "gold-line" | "dried-floral"`,
  `OrnamentCorner = "top-left" | "top-right" | "bottom-left" |
  "bottom-right"`. Task 4 (`PortraitFrame`) imports both the component and
  these two types from this file.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { motion } from "framer-motion";

export type OrnamentVariant = "gold-line" | "dried-floral";
export type OrnamentCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface CornerOrnamentProps {
  /** "gold-line": thin flowing line-art, for dark/editorial templates.
   *  "dried-floral": organic stem + leaf sprigs, for botanical templates. */
  variant: OrnamentVariant;
  color: string;
  /** Which corner this instance decorates — the base artwork is drawn for
   *  top-left and mirrored via CSS transform for the other three. */
  corner: OrnamentCorner;
  size?: number;
  className?: string;
}

/** Decorative corner flourish, drawn as original line art (no source asset). */
export function CornerOrnament({ variant, color, corner, size = 96, className }: CornerOrnamentProps) {
  const flipX = corner === "top-right" || corner === "bottom-right";
  const flipY = corner === "bottom-left" || corner === "bottom-right";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
    >
      {variant === "gold-line" ? (
        <>
          <motion.path
            d="M4 4 C 4 34, 20 50, 50 50 C 20 50, 4 66, 4 92"
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.7 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <path d="M4 4 L 20 4 M 4 4 L 4 20" stroke={color} strokeWidth="1" opacity={0.7} />
          <circle cx="50" cy="50" r="2.5" fill={color} opacity={0.7} />
        </>
      ) : (
        <>
          <motion.path
            d="M6 6 C 20 20, 24 40, 44 44"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
          <ellipse cx="16" cy="14" rx="5" ry="2.5" fill={color} opacity={0.35} transform="rotate(35 16 14)" />
          <ellipse cx="26" cy="26" rx="6" ry="3" fill={color} opacity={0.3} transform="rotate(45 26 26)" />
          <ellipse cx="38" cy="38" rx="5" ry="2.5" fill={color} opacity={0.35} transform="rotate(50 38 38)" />
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/src/components/ornaments/corner-ornament.tsx
git commit -m "feat(templates): add CornerOrnament component (gold-line + dried-floral)"
```

---

### Task 4: `PortraitFrame` component

**Files:**
- Create: `packages/templates/src/components/ornaments/portrait-frame.tsx`

**Interfaces:**
- Consumes: `CornerOrnament`, `OrnamentVariant` from
  `./corner-ornament` (Task 3).
- Produces: `PortraitFrame({ src?: string; alt: string; color: string;
  size?: number; variant?: OrnamentVariant })`. Renders a circular
  ornamental frame around a photo (or a placeholder-person icon when
  `src` is absent) — this is what Task 7/8 use in place of
  `CoupleCarousel`'s plain photo ring for the two proof-of-concept
  templates.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { CornerOrnament, type OrnamentVariant } from "./corner-ornament";

interface PortraitFrameProps {
  src?: string;
  alt: string;
  color: string;
  size?: number;
  variant?: OrnamentVariant;
}

/** Circular ornamental photo frame — replaces a plain <img> with a ring
 *  plus corner flourishes, matching the CornerOrnament variant in use. */
export function PortraitFrame({ src, alt, color, size = 160, variant = "gold-line" }: PortraitFrameProps) {
  const ringSize = size + 24;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={ringSize}
        height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        className="absolute -top-3 -left-3"
        aria-hidden="true"
      >
        <title>Decorative ring</title>
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={ringSize / 2 - 2}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={0.6}
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={ringSize / 2 - 6}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity={0.35}
        />
      </svg>

      <div className="absolute -top-3 -left-3">
        <CornerOrnament variant={variant} color={color} corner="top-left" size={40} />
      </div>
      <div className="absolute -bottom-3 -right-3">
        <CornerOrnament variant={variant} color={color} corner="bottom-right" size={40} />
      </div>

      {src ? (
        <img
          src={src}
          alt={alt}
          className="rounded-full object-cover"
          style={{ width: size, height: size, border: `2px solid ${color}` }}
          loading="lazy"
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: size, height: size, border: `2px solid ${color}`, opacity: 0.25 }}
        >
          <svg
            width={size * 0.3}
            height={size * 0.3}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <title>No photo</title>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/src/components/ornaments/portrait-frame.tsx
git commit -m "feat(templates): add PortraitFrame ornamental photo component"
```

---

### Task 5: Ornaments barrel export

**Files:**
- Create: `packages/templates/src/components/ornaments/index.ts`

**Interfaces:**
- Consumes: everything from Tasks 2-4.
- Produces: the single import path (`../components/ornaments`) that Task
  7/8 use.

- [ ] **Step 1: Create the barrel file**

```ts
export { CornerOrnament } from "./corner-ornament";
export type { OrnamentCorner, OrnamentVariant } from "./corner-ornament";
export { PaperTexture } from "./paper-texture";
export { PortraitFrame } from "./portrait-frame";
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/src/components/ornaments/index.ts
git commit -m "feat(templates): barrel export for ornaments components"
```

---

### Task 6: `QuickNav` component

**Files:**
- Create: `packages/templates/src/components/quick-nav.tsx`

**Interfaces:**
- Produces: `QuickNav({ items: QuickNavItem[]; color: string; bg?: string
  })` and the exported type `QuickNavItem = { id: string; icon: "home" |
  "couple" | "gallery" | "location"; label: string }`. Task 7/8 render one
  `QuickNav` each with `items` pointing at `id` attributes added to their
  own sections (`#beranda`, `#mempelai`, `#acara`, `#galeri`).

- [ ] **Step 1: Create the component**

```tsx
"use client";

import type { ReactNode } from "react";

export type QuickNavIcon = "home" | "couple" | "gallery" | "location";

export interface QuickNavItem {
  /** Must match the `id` attribute of the section this link jumps to. */
  id: string;
  icon: QuickNavIcon;
  label: string;
}

interface QuickNavProps {
  items: QuickNavItem[];
  color: string;
  bg?: string;
}

const ICONS: Record<QuickNavIcon, ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10" />,
  couple: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2 21v-2a5 5 0 0 1 5-5h2M15 14h2a5 5 0 0 1 5 5v2" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  location: (
    <>
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
};

/** Sticky bottom quick-jump nav for long-scrolling templates. */
export function QuickNav({ items, color, bg = "rgba(255,255,255,0.9)" }: QuickNavProps) {
  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full px-2 py-2 shadow-lg backdrop-blur-sm"
      style={{ backgroundColor: bg }}
      aria-label="Navigasi cepat"
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110"
          aria-label={item.label}
          title={item.label}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[item.icon]}
          </svg>
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/src/components/quick-nav.tsx
git commit -m "feat(templates): add QuickNav sticky bottom navigation component"
```

---

### Task 7: Apply foundation to `dark-luxury.tsx`

**Files:**
- Modify: `packages/templates/src/templates/dark-luxury.tsx`

**Interfaces:**
- Consumes: `PaperTexture`, `CornerOrnament`, `PortraitFrame` from
  `../components/ornaments` (Task 5); `QuickNav`, `type QuickNavItem`
  from `../components/quick-nav` (Task 6).
- `CoupleCarousel` import is removed from this file (replaced by a manual
  `PortraitFrame`-based layout) — this does **not** touch
  `couple-carousel.tsx` itself, so every other template using it is
  unaffected.

- [ ] **Step 1: Update imports**

Change:

```tsx
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { PoweredByDevLab } from "../components/powered-by";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";
```

to:

```tsx
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { CornerOrnament, PaperTexture, PortraitFrame } from "../components/ornaments";
import { OpeningScreen } from "../components/opening-screen";
import { PoweredByDevLab } from "../components/powered-by";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";
```

- [ ] **Step 2: Add the quick-nav item list**

After the `const onSurface = "#e8e6e1";` line, add:

```tsx
const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];
```

- [ ] **Step 3: Make the root div a positioning context and add the texture**

Change:

```tsx
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: bg,
        color: onSurface,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <style>{`
```

to:

```tsx
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: bg,
        color: onSurface,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <PaperTexture opacity={0.05} />
      <style>{`
```

- [ ] **Step 4: Add section id + corner ornaments to the hero**

Change:

```tsx
      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        {/* Thin gold frame — luxury border */}
        <div
          className="pointer-events-none absolute inset-4 z-10 rounded-sm"
          style={{ border: `1px solid ${primary}55` }}
          aria-hidden="true"
        />
```

to:

```tsx
      {/* Hero */}
      <section
        id="beranda"
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
      >
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        {/* Thin gold frame — luxury border */}
        <div
          className="pointer-events-none absolute inset-4 z-10 rounded-sm"
          style={{ border: `1px solid ${primary}55` }}
          aria-hidden="true"
        />
        {/* Corner flourishes */}
        <div className="pointer-events-none absolute inset-6 z-10" aria-hidden="true">
          <div className="absolute top-0 left-0">
            <CornerOrnament variant="gold-line" color={primary} corner="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerOrnament variant="gold-line" color={primary} corner="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerOrnament variant="gold-line" color={primary} corner="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerOrnament variant="gold-line" color={primary} corner="bottom-right" />
          </div>
        </div>
```

- [ ] **Step 5: Replace the Couple section**

Change:

```tsx
      {/* Couple */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest mb-8" style={{ color: primary }}>
          Mempelai
        </p>
        <AnimateIn direction="up">
          <CoupleCarousel
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            {...(hosts.groomFull !== undefined ? { groomFull: hosts.groomFull } : {})}
            {...(hosts.brideFull !== undefined ? { brideFull: hosts.brideFull } : {})}
            {...(hosts.groomParents !== undefined ? { groomParents: hosts.groomParents } : {})}
            {...(hosts.brideParents !== undefined ? { brideParents: hosts.brideParents } : {})}
            {...(hosts.groomPhotoUrl !== undefined ? { groomPhotoUrl: hosts.groomPhotoUrl } : {})}
            {...(hosts.bridePhotoUrl !== undefined ? { bridePhotoUrl: hosts.bridePhotoUrl } : {})}
            primaryColor={primary}
            textColor={onSurface}
            mutedColor="rgba(255,255,255,0.4)"
            slideBg={surface}
          />
        </AnimateIn>
      </section>
```

to:

```tsx
      {/* Couple */}
      <section id="mempelai" className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest mb-8" style={{ color: primary }}>
          Mempelai
        </p>
        <AnimateIn direction="up">
          <div
            className="grid items-start gap-4 text-center"
            style={{ gridTemplateColumns: "1fr auto 1fr" }}
          >
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.groomPhotoUrl !== undefined ? { src: hosts.groomPhotoUrl } : {})}
                alt={hosts.groomName}
                color={primary}
                variant="gold-line"
              />
              <div>
                <p className="font-bold" style={{ color: onSurface }}>
                  {hosts.groomFull ?? hosts.groomName}
                </p>
                {hosts.groomParents && (
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {hosts.groomParents}
                  </p>
                )}
              </div>
            </div>
            <span className="pt-16 text-2xl italic" style={{ color: primary }}>
              &amp;
            </span>
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.bridePhotoUrl !== undefined ? { src: hosts.bridePhotoUrl } : {})}
                alt={hosts.brideName}
                color={primary}
                variant="gold-line"
              />
              <div>
                <p className="font-bold" style={{ color: onSurface }}>
                  {hosts.brideFull ?? hosts.brideName}
                </p>
                {hosts.brideParents && (
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {hosts.brideParents}
                  </p>
                )}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>
```

- [ ] **Step 6: Add `id="acara"` to the Events section**

Change:

```tsx
      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-xs uppercase tracking-widest"
          style={{ color: primary }}
        >
          Rangkaian Acara
        </h2>
```

to:

```tsx
      {/* Events */}
      <section id="acara" className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-xs uppercase tracking-widest"
          style={{ color: primary }}
        >
          Rangkaian Acara
        </h2>
```

- [ ] **Step 7: Add `id="galeri"` to the Gallery section**

Change:

```tsx
      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-16">
```

to:

```tsx
      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section id="galeri" className="px-4 py-16">
```

- [ ] **Step 8: Render `QuickNav`**

Change (near the end of the component, right before `<PoweredByDevLab />`):

```tsx
      <PoweredByDevLab />
    </div>
  );
}
```

to:

```tsx
      {opened && !preview && <QuickNav items={QUICK_NAV_ITEMS} color={primary} bg="rgba(22,22,26,0.85)" />}

      <PoweredByDevLab />
    </div>
  );
}
```

- [ ] **Step 9: Verify — typecheck**

Run: `pnpm --filter @invyte/templates typecheck && pnpm --filter @invyte/web typecheck`
Expected: no errors.

- [ ] **Step 10: Verify — visual check**

Run: `pnpm --filter @invyte/web dev` (needs `DATABASE_URL`/`REDIS_URL` set
per `apps/web/.env.example` — if unavailable, skip the live homepage
render and instead visually confirm by temporarily rendering
`<DarkLuxury data={...} preview />` in isolation; remove the scratch file
afterward). Open the homepage, click "Preview" on the Dark Luxury
template card, confirm: Playfair Display renders (not a fallback serif),
gold corner flourishes visible in the hero, couple photos show the new
ring + corner ornament instead of the old plain double-ring, quick-nav
pill visible at the bottom and its 4 links scroll to the right sections.

- [ ] **Step 11: Commit**

```bash
git add packages/templates/src/templates/dark-luxury.tsx
git commit -m "feat(templates): apply ornament library to dark-luxury template

Proof-of-concept for the premium-template-visual-upgrade spec: paper
texture, gold-line corner flourishes on the hero, ornamental portrait
frames replacing the plain couple-carousel ring, and a quick-nav bar."
```

---

### Task 8: Apply foundation to `floral-classic.tsx`

**Files:**
- Modify: `packages/templates/src/templates/floral-classic.tsx`

**Interfaces:**
- Consumes: same as Task 7, but with `variant="dried-floral"` everywhere
  a variant is passed (this template's aesthetic, not dark/gold).

- [ ] **Step 1: Update imports**

Change:

```tsx
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { PoweredByDevLab } from "../components/powered-by";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";
```

to:

```tsx
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { CornerOrnament, PaperTexture, PortraitFrame } from "../components/ornaments";
import { OpeningScreen } from "../components/opening-screen";
import { PoweredByDevLab } from "../components/powered-by";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";
```

- [ ] **Step 2: Add the quick-nav item list**

After the `] as const;` line that closes the `SPARKLES` array, add:

```tsx
const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];
```

- [ ] **Step 3: Make the root div a positioning context and add the texture**

Change:

```tsx
    <div
      className="min-h-screen text-[#3d2c2c] overflow-x-hidden"
      style={{ backgroundColor: accent, fontFamily: "'Georgia', serif" }}
    >
      {/* CSS animations */}
```

to:

```tsx
    <div
      className="relative min-h-screen text-[#3d2c2c] overflow-x-hidden"
      style={{ backgroundColor: accent, fontFamily: "'Georgia', serif" }}
    >
      <PaperTexture opacity={0.05} />
      {/* CSS animations */}
```

- [ ] **Step 4: Add section id + corner ornaments to the hero**

Change:

```tsx
      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-15"
          />
        )}
```

to:

```tsx
      {/* Hero */}
      <section
        id="beranda"
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden"
      >
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-15"
          />
        )}
        {/* Corner flourishes */}
        <div className="pointer-events-none absolute inset-6 z-10" aria-hidden="true">
          <div className="absolute top-0 left-0">
            <CornerOrnament variant="dried-floral" color={primary} corner="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerOrnament variant="dried-floral" color={primary} corner="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerOrnament variant="dried-floral" color={primary} corner="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerOrnament variant="dried-floral" color={primary} corner="bottom-right" />
          </div>
        </div>
```

- [ ] **Step 5: Replace the Couple section**

Change:

```tsx
      {/* Couple carousel */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center mb-10">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: primary }}>
              Mempelai
            </p>
          </motion.div>
        </div>
        <AnimateIn direction="up">
          <CoupleCarousel
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            {...(hosts.groomFull !== undefined ? { groomFull: hosts.groomFull } : {})}
            {...(hosts.brideFull !== undefined ? { brideFull: hosts.brideFull } : {})}
            {...(hosts.groomParents !== undefined ? { groomParents: hosts.groomParents } : {})}
            {...(hosts.brideParents !== undefined ? { brideParents: hosts.brideParents } : {})}
            {...(hosts.groomPhotoUrl !== undefined ? { groomPhotoUrl: hosts.groomPhotoUrl } : {})}
            {...(hosts.bridePhotoUrl !== undefined ? { bridePhotoUrl: hosts.bridePhotoUrl } : {})}
            primaryColor={primary}
            textColor="#3d2c2c"
            mutedColor="#a0856e"
          />
        </AnimateIn>
      </section>
```

to:

```tsx
      {/* Couple */}
      <section id="mempelai" className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center mb-10">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: primary }}>
              Mempelai
            </p>
          </motion.div>
        </div>
        <AnimateIn direction="up">
          <div
            className="grid items-start gap-4 text-center"
            style={{ gridTemplateColumns: "1fr auto 1fr" }}
          >
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.groomPhotoUrl !== undefined ? { src: hosts.groomPhotoUrl } : {})}
                alt={hosts.groomName}
                color={primary}
                variant="dried-floral"
              />
              <div>
                <p className="font-bold text-[#3d2c2c]">{hosts.groomFull ?? hosts.groomName}</p>
                {hosts.groomParents && <p className="text-sm text-[#a0856e]">{hosts.groomParents}</p>}
              </div>
            </div>
            <span className="pt-16 text-2xl italic" style={{ color: primary }}>
              &amp;
            </span>
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.bridePhotoUrl !== undefined ? { src: hosts.bridePhotoUrl } : {})}
                alt={hosts.brideName}
                color={primary}
                variant="dried-floral"
              />
              <div>
                <p className="font-bold text-[#3d2c2c]">{hosts.brideFull ?? hosts.brideName}</p>
                {hosts.brideParents && <p className="text-sm text-[#a0856e]">{hosts.brideParents}</p>}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>
```

- [ ] **Step 6: Add `id="acara"` to the Events section**

Change:

```tsx
      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <motion.div
          whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            className="mb-10 text-center text-xs uppercase tracking-widest"
            style={{ color: primary }}
          >
            Rangkaian Acara
          </h2>
        </motion.div>
```

to:

```tsx
      {/* Events */}
      <section id="acara" className="mx-auto max-w-2xl px-6 py-16">
        <motion.div
          whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            className="mb-10 text-center text-xs uppercase tracking-widest"
            style={{ color: primary }}
          >
            Rangkaian Acara
          </h2>
        </motion.div>
```

- [ ] **Step 7: Add `id="galeri"` to the Gallery section**

Change:

```tsx
      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-12">
```

to:

```tsx
      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section id="galeri" className="px-4 py-12">
```

- [ ] **Step 8: Render `QuickNav`**

Change (right before `<PoweredByDevLab />`):

```tsx
      <div className="h-2 w-full" style={{ backgroundColor: primary }} />

      <PoweredByDevLab />
    </div>
  );
}
```

to:

```tsx
      <div className="h-2 w-full" style={{ backgroundColor: primary }} />

      {opened && !preview && (
        <QuickNav items={QUICK_NAV_ITEMS} color={primary} bg="rgba(245,237,232,0.9)" />
      )}

      <PoweredByDevLab />
    </div>
  );
}
```

- [ ] **Step 9: Verify — typecheck**

Run: `pnpm --filter @invyte/templates typecheck && pnpm --filter @invyte/web typecheck`
Expected: no errors.

- [ ] **Step 10: Verify — visual check**

Same procedure as Task 7 Step 10, but for the Floral Classic template
card. Confirm: dried-floral corner sprigs on the hero (not gold-line),
paper texture visible, couple photos in the new ornamental frame,
quick-nav visible with a light/cream background matching this template's
palette.

- [ ] **Step 11: Commit**

```bash
git add packages/templates/src/templates/floral-classic.tsx
git commit -m "feat(templates): apply ornament library to floral-classic template

Second half of the proof-of-concept for the premium-template-visual-
upgrade spec, using the dried-floral ornament variant to match this
template's botanical aesthetic."
```

---

### Task 9: Final full-repo verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `pnpm typecheck`
Expected: all 8 packages pass.

- [ ] **Step 2: Production build**

Run: `pnpm --filter @invyte/web build`
Expected: succeeds. (Per this session's established lesson: if it fails
with an unrelated `<Html> should not be imported outside of pages/
_document` error during static `/404`/`/500` generation, this has been
proven to be environment swap/resource flakiness, not a code defect —
re-run once before treating it as a real failure.)

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: Report back to the user**

Show the two visual-check screenshots/results from Task 7 Step 10 and
Task 8 Step 10, and ask whether the direction is approved before starting
Phase 3 (the 3 new Sumatra templates) and Phase 4 (the remaining 5
templates) from the spec — this is the explicit checkpoint the spec
calls for.
