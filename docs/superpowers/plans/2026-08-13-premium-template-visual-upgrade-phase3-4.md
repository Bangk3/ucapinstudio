# Premium Template Visual Upgrade — Phase 3+4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the remaining 8 templates (3 new Sumatra-culture templates + 5
upgrades) to the same visual bar established by Phase 1+2's proof of concept
(`dark-luxury.tsx`, `floral-classic.tsx`), completing all 10 templates from
the original spec.

**Architecture:** Every task reuses the shared ornament library
(`packages/templates/src/components/ornaments/`) exactly as it was proven in
Phase 1+2 — no new dependencies, two additions: 5 new `CornerOrnament`
culture variants, and a new `CrownFlourish` component (both Task 1). The
crown addition is a direct response to a live competitor reference
(indoinvite.com) inspected mid-plan via Playwright screenshots: their hero
places a gold crown/mandala flourish above the couple's names, above a
circular photo ring, above a dense repeating textile-pattern band — we
already match the photo ring (`PortraitFrame`) and the repeating-band
concept (each culture's motif "Row" divider), so the one clearly
reproducible, high-value piece missing was the crown. Everything else on
their page (the textile band, a rendered 3D crown icon) is raster/photo
assets, which the spec's Key Decision already rejected for licensing
reasons — line-art `CrownFlourish` is the SVG-safe equivalent. Each
template task bolts on the same 6 elements in the same order: `PaperTexture`
background, `CornerOrnament` hero flourishes, `CrownFlourish` above the
couple names, `PortraitFrame`-based couple section, `id` attributes on
major sections, `QuickNav` at the end. The 3 new templates are built by
cloning the structure of `batak-traditional.tsx` / `minang-heritage.tsx`
(already-proven, near-identical skeletons) and reskinning
copy/palette/motifs per the spec's research table.

**Tech Stack:** Same as Phase 1+2 — React 19, Tailwind (via className
strings), Framer Motion, inline SVG. No new packages.

**Spec:** `docs/superpowers/specs/2026-08-12-premium-template-visual-upgrade-design.md`
(read alongside this plan — this plan implements Rollout Phases 3 and 4).

## Global Constraints

- `packages/templates` has zero test infrastructure (no `test` script, no
  vitest, no `*.test.*` files). Do NOT add unit tests. Verify each task with
  `pnpm --filter @invyte/templates typecheck` and
  `pnpm --filter @invyte/templates exec biome check --write <changed files>`.
- **QuickNav is never `!preview`-gated.** Per explicit user adjudication in
  Phase 1+2, it renders whenever `opened` is true, in both preview and live
  modes (unlike Music/RSVP/Wishes, which are gated). Filter out the
  `"galeri"` item when there's no gallery:
  `items={QUICK_NAV_ITEMS.filter((item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0)}`.
- All new/modified `<section>` elements that QuickNav links to must carry a
  matching `id` (`beranda`, `mempelai`, `acara`, `galeri`).
- Every new template must be wired into `packages/templates/src/index.ts` in
  **three** places: the barrel `export { X } from "./templates/x"` near the
  top, a `TemplateMeta` entry in the `TEMPLATES` array, and an import +
  entry in `TEMPLATE_COMPONENTS`. A template that compiles but isn't wired
  into all three is not done.
- Follow existing repo conventions exactly: `"use client"` at the top of
  every template file, `exactOptionalPropertyTypes` spread pattern
  (`{...(x !== undefined ? { x } : {})}`) for optional props, Indonesian
  section copy matching the existing templates verbatim
  (`"Undangan Pernikahan"`, `"Mempelai"`, `"Rangkaian Acara"`,
  `"Kisah Kami"`, `"Perjalanan Cinta"`, `"Galeri"`,
  `"Konfirmasi Kehadiran"`, `"Buku Tamu"`, `"Bagikan Undangan"`).
- Do not invent region-specific Bahasa/dialect phrases that weren't part of
  the spec's cited research — stick to standard Bahasa Indonesia copy plus
  the researched visual motifs. The one exception already used elsewhere in
  this codebase (`serene-garden.tsx`) is the universal Islamic greeting
  `"Bismillahirrahmanirrahim"`, safe to reuse for the Aceh template given
  its strongly Islamic culture.
- Cultural motifs are simplified original line-art interpretations, not
  photographically faithful reproductions — this is a known, spec-flagged
  limitation (native/local review recommended before treating Pinto Aceh and
  Siger renderings as final). Don't over-claim accuracy in comments/copy.
- Run `pnpm --filter @invyte/web typecheck` once at the very end (after all
  9 tasks) since `apps/web` imports `@invyte/templates`'s barrel export —
  a missed wiring step there would only show up at that level.

---

## Task 1: Extend the ornament library — 5 culture corner variants + CrownFlourish

**Files:**
- Modify: `packages/templates/src/components/ornaments/corner-ornament.tsx`
- Create: `packages/templates/src/components/ornaments/crown-flourish.tsx`
- Modify: `packages/templates/src/components/ornaments/index.ts`

**Interfaces:**
- Produces: `OrnamentVariant` extended to
  `"gold-line" | "dried-floral" | "pinto-aceh" | "songket-melayu" | "tapis-lampung" | "gorga-batak" | "rumah-gadang"`.
  Tasks 2-6 each consume exactly one of the 5 new variants; Tasks 7-9 keep
  using `"gold-line"` (already existed).
- Produces: `CrownFlourish({ color, className? })` — a symmetric line-art
  crown silhouette, ~200×60 viewBox, exported from the ornaments barrel.
  Every template task (2-9) renders one centered above the couple's names
  in the hero.

- [ ] **Step 1: Replace the file with the extended variant set**

Full replacement of `packages/templates/src/components/ornaments/corner-ornament.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

export type OrnamentVariant =
  | "gold-line"
  | "dried-floral"
  | "pinto-aceh"
  | "songket-melayu"
  | "tapis-lampung"
  | "gorga-batak"
  | "rumah-gadang";
export type OrnamentCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface CornerOrnamentProps {
  /** "gold-line": thin flowing line-art, for dark/editorial templates.
   *  "dried-floral": organic stem + leaf sprigs, for botanical templates.
   *  "pinto-aceh": stepped gate/lock geometry (Aceh gold filigree jewelry motif).
   *  "songket-melayu": pucuk rebung (bamboo-shoot) triangle border (Melayu/Palembang weave).
   *  "tapis-lampung": chevron weave + stepped Siger crown silhouette (Lampung).
   *  "gorga-batak": flowing hook/spiral carving line (Batak Gorga wood-carving motif).
   *  "rumah-gadang": upward buffalo-horn roof-peak silhouette (Minang gonjong roofline). */
  variant: OrnamentVariant;
  color: string;
  /** Which corner this instance decorates — the base artwork is drawn for
   *  top-left and mirrored via CSS transform for the other three. */
  corner: OrnamentCorner;
  size?: number;
  className?: string;
}

/** Decorative corner flourish, drawn as original line art (no source asset). */
export function CornerOrnament({
  variant,
  color,
  corner,
  size = 96,
  className,
}: CornerOrnamentProps) {
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
      {variant === "gold-line" && (
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
      )}

      {variant === "dried-floral" && (
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
          <ellipse
            cx="16"
            cy="14"
            rx="5"
            ry="2.5"
            fill={color}
            opacity={0.35}
            transform="rotate(35 16 14)"
          />
          <ellipse
            cx="26"
            cy="26"
            rx="6"
            ry="3"
            fill={color}
            opacity={0.3}
            transform="rotate(45 26 26)"
          />
          <ellipse
            cx="38"
            cy="38"
            rx="5"
            ry="2.5"
            fill={color}
            opacity={0.35}
            transform="rotate(50 38 38)"
          />
        </>
      )}

      {variant === "pinto-aceh" && (
        <>
          <motion.path
            d="M4 4 H30 M4 4 V30 M4 15 H19 M15 4 V19"
            stroke={color}
            strokeWidth="1"
            strokeLinecap="square"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.75 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <rect
            x="4"
            y="4"
            width="11"
            height="11"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={0.7}
          />
          <path d="M9.5 9.5 L15 4 L20.5 9.5 L15 15 Z" fill={color} opacity={0.35} />
        </>
      )}

      {variant === "songket-melayu" && (
        <>
          <path d="M4 4 L4 42 M4 4 L42 4" stroke={color} strokeWidth="1" opacity={0.7} />
          {[10, 20, 30].map((y) => (
            <path
              key={y}
              d={`M4 ${y} L13 ${y + 5} L4 ${y + 10} Z`}
              fill={color}
              opacity={0.4}
            />
          ))}
          {[10, 20, 30].map((x) => (
            <path
              key={x}
              d={`M${x} 4 L${x + 5} 13 L${x + 10} 4 Z`}
              fill={color}
              opacity={0.4}
            />
          ))}
        </>
      )}

      {variant === "tapis-lampung" && (
        <>
          <path
            d="M4 4 L10 4 L10 10 L16 10 L16 4 L22 4"
            stroke={color}
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M4 34 L14 24 L4 14 M14 40 L24 30 L14 20"
            stroke={color}
            strokeWidth="1"
            fill="none"
            opacity={0.7}
          />
        </>
      )}

      {variant === "gorga-batak" && (
        <>
          <motion.path
            d="M4 4 C 4 20, 16 20, 16 34 C 16 44, 6 44, 6 54"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.7 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <circle cx="16" cy="20" r="2" fill={color} opacity={0.6} />
          <path d="M4 4 L4 14 M4 4 L14 4" stroke={color} strokeWidth="1" opacity={0.7} />
        </>
      )}

      {variant === "rumah-gadang" && (
        <>
          <motion.path
            d="M4 30 C 4 14, 10 4, 16 4 C 12 4, 18 14, 18 30"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.7 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <path d="M4 4 L4 14 M4 4 L14 4" stroke={color} strokeWidth="1" opacity={0.6} />
          <path d="M8 30 L12 22 L16 30 Z" fill={color} opacity={0.3} />
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Create the CrownFlourish component**

Full content of `packages/templates/src/components/ornaments/crown-flourish.tsx`:

```tsx
"use client";

interface CrownFlourishProps {
  color: string;
  className?: string;
}

/**
 * Symmetric line-art crown silhouette — a direct, license-safe answer to
 * competitor platforms (e.g. indoinvite.com) that place a gold crown/mandala
 * flourish above the couple's names. Hand-drawn original path, no source
 * asset, themeable via the `color` prop like every other ornament here.
 */
export function CrownFlourish({ color, className }: CrownFlourishProps) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={`mx-auto h-12 w-auto ${className ?? ""}`}
      fill="none"
      aria-hidden="true"
    >
      <title>Crown flourish</title>
      <path
        d="M20 50 L20 28 L45 42 L60 18 L75 40 L100 8 L125 40 L140 18 L155 42 L180 28 L180 50 Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <path d="M20 50 L180 50" stroke={color} strokeWidth="1" opacity={0.5} />
      <circle cx="20" cy="28" r="2" fill={color} opacity={0.7} />
      <circle cx="60" cy="18" r="2" fill={color} opacity={0.7} />
      <circle cx="100" cy="8" r="2.5" fill={color} opacity={0.85} />
      <circle cx="140" cy="18" r="2" fill={color} opacity={0.7} />
      <circle cx="180" cy="28" r="2" fill={color} opacity={0.7} />
    </svg>
  );
}
```

- [ ] **Step 3: Add CrownFlourish to the ornaments barrel**

In `packages/templates/src/components/ornaments/index.ts`, add:
```ts
export { CrownFlourish } from "./crown-flourish";
```
(alongside the existing `CornerOrnament`, `PaperTexture`, `PortraitFrame`
exports — keep alphabetical order in that file).

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

Run: `pnpm --filter @invyte/templates exec biome check --write src/components/ornaments/`
Expected: clean or auto-fixed, no remaining errors.

- [ ] **Step 5: Commit**

```bash
git add packages/templates/src/components/ornaments/
git commit -m "feat(templates): add 5 culture CornerOrnament variants + CrownFlourish"
```

---

## Task 2: New template — Aceh Heritage

**Files:**
- Create: `packages/templates/src/templates/aceh-heritage.tsx`
- Modify: `packages/templates/src/index.ts`

**Interfaces:**
- Consumes: `CornerOrnament` variant `"pinto-aceh"`, `PortraitFrame`,
  `PaperTexture`, `QuickNav`/`QuickNavItem` (all from Task 1 / existing
  Phase 1+2 library — read `packages/templates/src/templates/dark-luxury.tsx`
  for the exact import paths and usage pattern).
- Produces: exported component `AcehHeritage`, registry id `"aceh-heritage"`.

**Design brief (from spec research table):** Pinto Aceh gate/lock motif,
rencong silhouette accent, Islamic calligraphic tone. Palette: black–gold–red.
`bg = "#171310"`, `surface = "#211a15"`, `text = "#ede6da"`,
`primary = theme.primaryColor ?? "#c9a24a"` (gold), accent red `"#8b2635"`
used sparingly (e.g. the ampersand / divider dot).

- [ ] **Step 1: Create the template file**

Base the skeleton on `packages/templates/src/templates/batak-traditional.tsx`
(read it first — same section order: opening screen → music →
hero → couple → events → story → timeline → gallery → quote → amplop →
rsvp → wishes → share → thanks → quicknav → powered-by). Apply the
Phase 1+2 foundation (`PaperTexture`, `CornerOrnament`, `PortraitFrame`,
section `id`s, `QuickNav`) from the start, matching `dark-luxury.tsx`'s
Couple-section grid pattern. Full file content:

```tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { CornerOrnament, CrownFlourish, PaperTexture, PortraitFrame } from "../components/ornaments";
import { PoweredByDevLab } from "../components/powered-by";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

const bg = "#171310";
const surface = "#211a15";
const text = "#ede6da";
const muted = "#a89684";
const accentRed = "#8b2635";

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];

/* Pinto Aceh motif row — stepped gate/lock diamonds, traditional gold filigree */
function PintoAcehRow({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 20" className="mx-auto h-5 w-full max-w-md" aria-hidden="true">
      {[0, 25, 50, 75, 100, 125, 150, 175].map((x) => (
        <g key={x}>
          <rect x={x + 4} y="4" width="12" height="12" fill="none" stroke={color} strokeWidth="1" />
          <path d={`M${x + 10} 7 L${x + 13} 10 L${x + 10} 13 L${x + 7} 10 Z`} fill={color} opacity="0.4" />
        </g>
      ))}
    </svg>
  );
}

export function AcehHeritage({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const {
    hosts,
    events,
    story,
    quote,
    quoteAuthor,
    thanksNote,
    galleryUrls,
    musicUrl,
    musicTitle,
  } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#c9a24a";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-serif"
      style={{ backgroundColor: bg, color: text }}
    >
      <PaperTexture opacity={0.05} />

      {/* Opening screen */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          {...(guestName !== undefined ? { guestName } : {})}
          primaryColor={primary}
          bgColor={bg}
          fgColor={text}
          {...(theme.coverPhotoUrl !== undefined ? { coverPhotoUrl: theme.coverPhotoUrl } : {})}
          onOpen={() => setOpened(true)}
        />
      )}

      {/* Background music */}
      {opened && musicUrl && !preview && (
        <MusicPlayer
          musicUrl={musicUrl}
          {...(musicTitle !== undefined ? { musicTitle } : {})}
          primaryColor={primary}
        />
      )}

      {/* Hero */}
      <section
        id="beranda"
        className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      >
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        <div className="pointer-events-none absolute inset-6 z-10" aria-hidden="true">
          <div className="absolute top-0 left-0">
            <CornerOrnament variant="pinto-aceh" color={primary} corner="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerOrnament variant="pinto-aceh" color={primary} corner="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerOrnament variant="pinto-aceh" color={primary} corner="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerOrnament variant="pinto-aceh" color={primary} corner="bottom-right" />
          </div>
        </div>
        <div className="relative z-10 w-full space-y-5">
          <PintoAcehRow color={primary} />
          <p className="text-sm" style={{ color: muted }}>
            Bismillahirrahmanirrahim
          </p>
          {guestName && (
            <p className="mt-2 text-sm uppercase tracking-[0.3em]" style={{ color: muted }}>
              Kepada Yth. {guestName}
            </p>
          )}
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: primary }}>
            Undangan Pernikahan
          </p>
          <CrownFlourish color={primary} />
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            {hosts.groomName}
            <span className="block my-2 text-3xl font-light italic" style={{ color: accentRed }}>
              &amp;
            </span>
            {hosts.brideName}
          </h1>
          <p className="text-sm italic" style={{ color: muted }}>
            {hosts.groomParents ?? ""} &amp; {hosts.brideParents ?? ""}
          </p>
          {events[0]?.date && (
            <AnimateIn delay={0.5} direction="up">
              <p className="mt-4" style={{ color: muted }}>
                {new Date(events[0].date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </AnimateIn>
          )}
          {events[0]?.date && !preview && (
            <AnimateIn delay={0.7} direction="up">
              <div className="mt-8">
                <Countdown
                  targetDate={events[0].date}
                  {...(events[0].time !== undefined ? { targetTime: events[0].time } : {})}
                  primaryColor={primary}
                  label="Menuju Hari Bahagia"
                />
              </div>
            </AnimateIn>
          )}
          <PintoAcehRow color={primary} />
        </div>
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ color: primary }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
        >
          ↓
        </motion.div>
      </section>

      {/* Couple */}
      <section id="mempelai" className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="mb-8 text-xs uppercase tracking-widest" style={{ color: primary }}>
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
                variant="pinto-aceh"
              />
              <div>
                <p className="font-bold" style={{ color: text }}>
                  {hosts.groomFull ?? hosts.groomName}
                </p>
                {hosts.groomParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    {hosts.groomParents}
                  </p>
                )}
              </div>
            </div>
            <span className="pt-16 text-2xl italic" style={{ color: accentRed }}>
              &amp;
            </span>
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.bridePhotoUrl !== undefined ? { src: hosts.bridePhotoUrl } : {})}
                alt={hosts.brideName}
                color={primary}
                variant="pinto-aceh"
              />
              <div>
                <p className="font-bold" style={{ color: text }}>
                  {hosts.brideFull ?? hosts.brideName}
                </p>
                {hosts.brideParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    {hosts.brideParents}
                  </p>
                )}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* Events */}
      <section id="acara" className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="mb-10 text-center text-sm uppercase tracking-widest" style={{ color: primary }}>
          Rangkaian Acara
        </h2>
        <div className="space-y-6">
          {events.map((event) => (
            <AnimateIn key={event.id} direction="up">
              <div
                className="rounded-sm border p-6 text-center"
                style={{
                  backgroundColor: surface,
                  borderColor: `${primary}44`,
                  borderLeft: `3px solid ${primary}`,
                }}
              >
                <h3 className="text-xl font-bold" style={{ color: primary }}>
                  {event.name}
                </h3>
                {event.date && (
                  <p className="mt-2" style={{ color: muted }}>
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {event.time && ` • ${event.time}`}
                  </p>
                )}
                {event.venueName && (
                  <p className="mt-1 font-medium" style={{ color: text }}>
                    {event.venueName}
                  </p>
                )}
                {event.venueAddress && (
                  <p className="mt-1 text-sm" style={{ color: muted }}>
                    {event.venueAddress}
                  </p>
                )}
                {event.dressCode && (
                  <p className="mt-2 text-xs" style={{ color: muted }}>
                    Dresscode: {event.dressCode}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: primary, color: bg }}
                    >
                      Google Maps
                    </a>
                  )}
                  {event.lat !== undefined && event.lng !== undefined && (
                    <a
                      href={`https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm border px-4 py-1.5 text-sm"
                      style={{ borderColor: primary, color: primary }}
                    >
                      Waze
                    </a>
                  )}
                </div>
                {event.lat !== undefined && event.lng !== undefined && (
                  <MapEmbed
                    lat={event.lat}
                    lng={event.lng}
                    {...(event.venueName !== undefined ? { venueName: event.venueName } : {})}
                    className="mt-3"
                  />
                )}
                {event.date && !preview && (
                  <AddToCalendar
                    eventName={event.name}
                    date={event.date}
                    {...(event.time !== undefined ? { time: event.time } : {})}
                    {...(event.venueName !== undefined ? { venueName: event.venueName } : {})}
                    {...(event.venueAddress !== undefined
                      ? { venueAddress: event.venueAddress }
                      : {})}
                    primaryColor={primary}
                  />
                )}
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Story */}
      {story && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-sm uppercase tracking-widest" style={{ color: primary }}>
            Kisah Kami
          </h2>
          <AnimateIn direction="left">
            <p className="leading-relaxed whitespace-pre-line" style={{ color: muted }}>
              {story}
            </p>
          </AnimateIn>
        </section>
      )}

      {/* Love story timeline */}
      {content.timeline && content.timeline.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="mb-8 text-center text-sm uppercase tracking-widest" style={{ color: primary }}>
            Perjalanan Cinta
          </h2>
          <LoveTimeline items={content.timeline} primaryColor={primary} />
        </section>
      )}

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section id="galeri" className="px-4 py-16">
          <h2 className="mb-8 text-center text-sm uppercase tracking-widest" style={{ color: primary }}>
            Galeri
          </h2>
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto grid max-w-4xl grid-cols-2 gap-2 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-sm object-cover opacity-90 cursor-pointer"
          />
        </section>
      )}

      {/* Quote */}
      {quote && (
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <p className="text-xl italic" style={{ color: text }}>
            "{quote}"
          </p>
          {quoteAuthor && (
            <p className="mt-3 text-sm" style={{ color: muted }}>
              — {quoteAuthor}
            </p>
          )}
        </section>
      )}

      {/* Digital Amplop */}
      {content.amplop && (
        <section className="mx-auto max-w-xl px-6 py-16">
          <DigitalAmplop amplop={content.amplop} primaryColor={primary} />
        </section>
      )}

      {/* RSVP */}
      {data.rsvpEnabled && !preview && (
        <AnimateIn direction="up">
          <section className="mx-auto max-w-2xl px-6 py-16">
            <h2 className="mb-6 text-center text-sm uppercase tracking-widest" style={{ color: primary }}>
              Konfirmasi Kehadiran
            </h2>
            <RsvpForm
              invitationId={data.id}
              primaryColor={primary}
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface={text}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </AnimateIn>
      )}

      {/* Wishes */}
      {data.wishesEnabled && !preview && (
        <AnimateIn direction="up">
          <section className="mx-auto max-w-2xl px-6 py-16">
            <h2 className="mb-6 text-center text-sm uppercase tracking-widest" style={{ color: primary }}>
              Buku Tamu
            </h2>
            <WishesSection
              invitationId={data.id}
              primaryColor={primary}
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface={text}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </AnimateIn>
      )}

      {/* Share */}
      {!preview && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-sm uppercase tracking-widest" style={{ color: primary }}>
            Bagikan Undangan
          </h2>
          <ShareBar groomName={hosts.groomName} brideName={hosts.brideName} primaryColor={primary} />
        </section>
      )}

      {/* Thanks */}
      <section className="px-6 py-16 text-center" style={{ backgroundColor: surface }}>
        <AnimateIn direction="none">
          <p className="mx-auto max-w-lg text-lg leading-relaxed" style={{ color: text }}>
            {thanksNote ?? "Merupakan kehormatan bagi kami jika Bapak/Ibu/Saudara/i berkenan hadir."}
          </p>
          <p className="mt-6 text-xl font-bold" style={{ color: primary }}>
            {hosts.groomName} &amp; {hosts.brideName}
          </p>
        </AnimateIn>
      </section>

      {opened && (
        <QuickNav
          items={QUICK_NAV_ITEMS.filter(
            (item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0,
          )}
          color={primary}
          bg="rgba(23,19,16,0.85)"
        />
      )}

      <PoweredByDevLab />
    </div>
  );
}
```

- [ ] **Step 2: Wire into the registry**

In `packages/templates/src/index.ts`:

1. Add to the barrel exports (after the `ArabicCalligraphyLuxe` line):
```ts
export { AcehHeritage } from "./templates/aceh-heritage";
```

2. Add to the `TEMPLATES` array (before the closing `];` of the array, i.e.
   after the `arabic-calligraphy-luxe` entry and before `ai-composer`):
```ts
  {
    id: "aceh-heritage",
    name: "Aceh Heritage",
    description: "Motif Pinto Aceh emas di atas hitam, kesan islami dan megah.",
    primaryColor: "#c9a24a",
    accentColor: "#8b2635",
    tags: ["aceh", "adat", "islami"],
    isPremium: true,
  },
```

3. Add the import (alphabetical, near the top of the import block):
```ts
import { AcehHeritage } from "./templates/aceh-heritage";
```

4. Add to `TEMPLATE_COMPONENTS` (before the `"ai-composer"` entry):
```ts
  "aceh-heritage": AcehHeritage,
```

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Expected: no errors.

Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/aceh-heritage.tsx src/index.ts`
Expected: clean or auto-fixed, no remaining errors.

- [ ] **Step 4: Structural smoke check**

Since there's no live dev server in this sandbox, verify the component
renders without throwing using `react-dom/server`:

```bash
node -e "
require('ts-node/register') || true;
" 2>/dev/null; echo "If ts-node isn't available, skip this and rely on tsc --noEmit + biome — this project has no test harness for templates (see Global Constraints)."
```

(This step is best-effort per Global Constraints — `tsc --noEmit` passing
plus a manual read-through of the JSX for unbalanced tags/props is the
actual bar here, matching Phase 1+2's precedent.)

- [ ] **Step 5: Commit**

```bash
git add packages/templates/src/templates/aceh-heritage.tsx packages/templates/src/index.ts
git commit -m "feat(templates): add Aceh Heritage template"
```

---

## Task 3: New template — Melayu Palembang

**Files:**
- Create: `packages/templates/src/templates/melayu-palembang.tsx`
- Modify: `packages/templates/src/index.ts`

**Interfaces:**
- Consumes: same ornament library as Task 2, variant `"songket-melayu"`.
- Produces: exported component `MelayuPalembang`, registry id `"melayu-palembang"`.

**Design brief:** Songket Palembang weave pattern, Rumah Limas roofline
silhouette. Palette: gold–red–deep green. `bg = "#fdf8ee"`,
`surface = "#ffffff"`, `text = "#3f2618"`, `muted = "#8a6f52"`,
`primary = theme.primaryColor ?? "#9c1f2e"` (deep red), gold accent
`"#c9a23f"` for dividers/rings, green accent `"#1f6b4a"` used sparingly
(e.g. dress-code chip border or a thin rule under section headers).

- [ ] **Step 1: Create the template file**

Same structure as Task 2's `aceh-heritage.tsx`, with these substitutions
(the file is otherwise identical in shape — section order, ornament wiring,
QuickNav, registry-consuming exports):

- Component name: `MelayuPalembang`
- Consts: `bg = "#fdf8ee"`, `surface = "#ffffff"`, `text = "#3f2618"`,
  `muted = "#8a6f52"`, `accentGreen = "#1f6b4a"` (replaces `accentRed`,
  used the same way for the ampersand color)
- `primary = theme.primaryColor ?? "#9c1f2e"`
- Motif row component (replaces `PintoAcehRow`):

```tsx
/* Songket Melayu motif row — pucuk rebung (bamboo-shoot) triangle weave */
function SongketMelayuRow({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 20" className="mx-auto h-5 w-full max-w-md" aria-hidden="true">
      {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) => (
        <path key={x} d={`M${x + 4} 16 L${x + 10} 4 L${x + 16} 16 Z`} fill="none" stroke={color} strokeWidth="1" />
      ))}
    </svg>
  );
}
```

- No `Bismillahirrahmanirrahim` line (that was Aceh-specific — omit it here).
- Keep the `CrownFlourish` import and its placement directly above the
  `<h1>` names unchanged from Task 2 (it's culture-agnostic — same
  component, same position, just `color={primary}` picks up this file's
  red instead of Aceh's gold).
- `CornerOrnament` / `PortraitFrame` `variant="songket-melayu"` everywhere
  `variant="pinto-aceh"` appeared in Task 2.
- `QuickNav` `bg="rgba(253,248,238,0.9)"` (light background, matching
  `floral-classic.tsx`'s precedent for light-bg templates), and note text
  colors must stay dark-on-light throughout (`text`/`muted`, not the
  near-white values Task 2 used).
- Keep all Indonesian section copy identical to Task 2 (same strings,
  per Global Constraints).

- [ ] **Step 2: Wire into the registry**

Same 4 sub-steps as Task 2 Step 2, using:
```ts
export { MelayuPalembang } from "./templates/melayu-palembang";
```
```ts
  {
    id: "melayu-palembang",
    name: "Melayu Palembang",
    description: "Motif songket emas-merah dengan siluet Rumah Limas, kesan mewah Melayu.",
    primaryColor: "#9c1f2e",
    accentColor: "#c9a23f",
    tags: ["melayu", "palembang", "adat", "songket"],
    isPremium: true,
  },
```
```ts
import { MelayuPalembang } from "./templates/melayu-palembang";
```
```ts
  "melayu-palembang": MelayuPalembang,
```

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/melayu-palembang.tsx src/index.ts`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add packages/templates/src/templates/melayu-palembang.tsx packages/templates/src/index.ts
git commit -m "feat(templates): add Melayu Palembang template"
```

---

## Task 4: New template — Lampung Tapis

**Files:**
- Create: `packages/templates/src/templates/lampung-tapis.tsx`
- Modify: `packages/templates/src/index.ts`

**Interfaces:**
- Consumes: same ornament library, variant `"tapis-lampung"`.
- Produces: exported component `LampungTapis`, registry id `"lampung-tapis"`.

**Design brief:** Kain Tapis geometric weave, Siger (bridal crown)
silhouette. Palette: maroon–gold. `bg = "#fbf5ec"`, `surface = "#ffffff"`,
`text = "#3a2418"`, `muted = "#8a7358"`,
`primary = theme.primaryColor ?? "#7a1f2b"` (maroon), gold accent
`"#c9a84c"`.

- [ ] **Step 1: Create the template file**

Same shape as Tasks 2/3, with:

- Component name: `LampungTapis`
- Consts: `bg = "#fbf5ec"`, `surface = "#ffffff"`, `text = "#3a2418"`,
  `muted = "#8a7358"`. No separate accent-color const needed — use
  `primary` for the ampersand (matches `batak-traditional.tsx`'s original
  pattern, since maroon-on-cream already reads as a strong accent without
  needing a second hue).
- `primary = theme.primaryColor ?? "#7a1f2b"`
- Motif row component:

```tsx
/* Tapis Lampung motif row — chevron geometric weave */
function TapisLampungRow({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 16" className="mx-auto h-4 w-full max-w-md" aria-hidden="true">
      <path
        d="M0 12 L10 4 L20 12 L30 4 L40 12 L50 4 L60 12 L70 4 L80 12 L90 4 L100 12 L110 4 L120 12 L130 4 L140 12 L150 4 L160 12 L170 4 L180 12 L190 4 L200 12"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
    </svg>
  );
}
```

- `CornerOrnament` / `PortraitFrame` `variant="tapis-lampung"`.
- Keep `CrownFlourish` above the `<h1>` names unchanged (same as Task 2/3,
  `color={primary}` picks up this file's maroon).
- `QuickNav` `bg="rgba(251,245,236,0.9)"`.
- Same Indonesian section copy as Tasks 2/3.

- [ ] **Step 2: Wire into the registry**

Same pattern:
```ts
export { LampungTapis } from "./templates/lampung-tapis";
```
```ts
  {
    id: "lampung-tapis",
    name: "Lampung Tapis",
    description: "Motif Tapis geometris dengan siluet Siger, palet marun dan emas.",
    primaryColor: "#7a1f2b",
    accentColor: "#c9a84c",
    tags: ["lampung", "adat", "tapis"],
    isPremium: true,
  },
```
```ts
import { LampungTapis } from "./templates/lampung-tapis";
```
```ts
  "lampung-tapis": LampungTapis,
```

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/lampung-tapis.tsx src/index.ts`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add packages/templates/src/templates/lampung-tapis.tsx packages/templates/src/index.ts
git commit -m "feat(templates): add Lampung Tapis template"
```

---

## Task 5: Upgrade Batak Traditional

**Files:**
- Modify: `packages/templates/src/templates/batak-traditional.tsx`

**Interfaces:**
- Consumes: `CornerOrnament` variant `"gorga-batak"`, `PortraitFrame`,
  `PaperTexture`, `QuickNav`.

**Current state (already read in full):** 402 lines, uses `CoupleCarousel`
for the couple section, a local `UlosRow` motif divider (keep as-is — it's
already a decent ragidup-diamond interpretation), no ids, no ornament
library usage, no QuickNav.

- [ ] **Step 1: Add imports**

Replace:
```tsx
import { CoupleCarousel } from "../components/couple-carousel";
import { DigitalAmplop } from "../components/digital-amplop";
```
with:
```tsx
import { DigitalAmplop } from "../components/digital-amplop";
```
and add (in the same alphabetically-sorted import block, after the
`OpeningScreen` import):
```tsx
import { CornerOrnament, CrownFlourish, PaperTexture, PortraitFrame } from "../components/ornaments";
import { PoweredByDevLab } from "../components/powered-by";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
```
(remove the old standalone `import { PoweredByDevLab } from "../components/powered-by";`
line since it's now part of this block — keep only one).

- [ ] **Step 2: Add QUICK_NAV_ITEMS constant**

After the existing `const muted = "#8a6f6f";` line, add:
```tsx

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];
```

- [ ] **Step 3: Wrap root div, add PaperTexture, hero id + corners**

Change:
```tsx
    <div
      className="min-h-screen overflow-x-hidden font-serif"
      style={{ backgroundColor: bg, color: text }}
    >
      {/* Opening screen */}
```
to:
```tsx
    <div
      className="relative min-h-screen overflow-x-hidden font-serif"
      style={{ backgroundColor: bg, color: text }}
    >
      <PaperTexture opacity={0.04} />

      {/* Opening screen */}
```

Change:
```tsx
      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        <div className="relative z-10 w-full space-y-5">
```
to:
```tsx
      {/* Hero */}
      <section
        id="beranda"
        className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      >
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        <div className="pointer-events-none absolute inset-6 z-10" aria-hidden="true">
          <div className="absolute top-0 left-0">
            <CornerOrnament variant="gorga-batak" color={primary} corner="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerOrnament variant="gorga-batak" color={primary} corner="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerOrnament variant="gorga-batak" color={primary} corner="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerOrnament variant="gorga-batak" color={primary} corner="bottom-right" />
          </div>
        </div>
        <div className="relative z-10 w-full space-y-5">
```

- [ ] **Step 3b: Insert CrownFlourish above the couple's names**

Change:
```tsx
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: primary }}>
            Undangan Pernikahan
          </p>
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            {hosts.groomName}
```
to:
```tsx
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: primary }}>
            Undangan Pernikahan
          </p>
          <CrownFlourish color={primary} />
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            {hosts.groomName}
```

- [ ] **Step 4: Replace CoupleCarousel with PortraitFrame grid, add mempelai id**

Change:
```tsx
      {/* Couple */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <UlosRow color={primary} />
        <p className="mt-4 mb-8 text-xs uppercase tracking-widest" style={{ color: primary }}>
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
            textColor={text}
            mutedColor={muted}
            slideBg={surface}
          />
        </AnimateIn>
      </section>
```
to:
```tsx
      {/* Couple */}
      <section id="mempelai" className="mx-auto max-w-2xl px-6 py-20 text-center">
        <UlosRow color={primary} />
        <p className="mt-4 mb-8 text-xs uppercase tracking-widest" style={{ color: primary }}>
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
                variant="gorga-batak"
              />
              <div>
                <p className="font-bold" style={{ color: text }}>
                  {hosts.groomFull ?? hosts.groomName}
                </p>
                {hosts.groomParents && (
                  <p className="text-sm" style={{ color: muted }}>
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
                variant="gorga-batak"
              />
              <div>
                <p className="font-bold" style={{ color: text }}>
                  {hosts.brideFull ?? hosts.brideName}
                </p>
                {hosts.brideParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    {hosts.brideParents}
                  </p>
                )}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>
```

- [ ] **Step 5: Add ids to Events and Gallery sections**

Change `<section className="mx-auto max-w-2xl px-6 py-16">` that immediately
follows the `{/* Events */}` comment to
`<section id="acara" className="mx-auto max-w-2xl px-6 py-16">`.

Change `<section className="px-4 py-16">` that immediately follows the
`{/* Gallery */}` comment to `<section id="galeri" className="px-4 py-16">`.

- [ ] **Step 6: Add QuickNav before PoweredByDevLab**

Change:
```tsx
      <PoweredByDevLab />
    </div>
  );
}
```
to:
```tsx
      {opened && (
        <QuickNav
          items={QUICK_NAV_ITEMS.filter(
            (item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0,
          )}
          color={primary}
          bg="rgba(250,246,240,0.9)"
        />
      )}

      <PoweredByDevLab />
    </div>
  );
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/batak-traditional.tsx`
Expected: both clean. Pay attention to import ordering — biome's
`organizeImports` may reorder the block from Step 1; accept its output.

- [ ] **Step 8: Commit**

```bash
git add packages/templates/src/templates/batak-traditional.tsx
git commit -m "feat(templates): upgrade Batak Traditional with ornament foundation"
```

---

## Task 6: Upgrade Minang Heritage

**Files:**
- Modify: `packages/templates/src/templates/minang-heritage.tsx`

**Interfaces:**
- Consumes: `CornerOrnament` variant `"rumah-gadang"`, `PortraitFrame`,
  `PaperTexture`, `QuickNav`.

Identical recipe to Task 5, applied to `minang-heritage.tsx` (398 lines,
already read in full — same shape: `CoupleCarousel`, local `SongketRow`
divider kept as-is, no ids, no ornaments, no QuickNav). Apply the exact
same 8 steps as Task 5 with these substitutions:

- Keep `SongketRow` untouched (it's the divider motif, analogous to
  `UlosRow` in Task 5).
- All `CornerOrnament`/`PortraitFrame` `variant="gorga-batak"` become
  `variant="rumah-gadang"`.
- `CrownFlourish` import and placement (Step 3b) carries over unchanged —
  same component, `color={primary}` picks up this file's maroon.
- `bg = "#fbf7f0"` (unchanged from the file's existing const) — use it for
  `QuickNav`'s `bg="rgba(251,247,240,0.9)"`.
- Everything else — import block changes, `QUICK_NAV_ITEMS` constant, root
  div wrapper + `PaperTexture`, hero `id="beranda"` + corner ornaments,
  couple section → `PortraitFrame` grid with `id="mempelai"`, `id="acara"`
  on Events, `id="galeri"` on Gallery, `QuickNav` before `PoweredByDevLab`
  — follows Task 5's steps exactly, applied to this file's actual line
  content (read the file first; the surrounding text matches Task 5's
  "Current state" description almost verbatim since these two files were
  built from the same original template).

- [ ] **Step 1-6:** Apply per the substitutions above (see Task 5 Steps 1-6
      for the exact before/after code shape).

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/minang-heritage.tsx`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add packages/templates/src/templates/minang-heritage.tsx
git commit -m "feat(templates): upgrade Minang Heritage with ornament foundation"
```

---

## Task 7: Upgrade Royal Java

**Files:**
- Modify: `packages/templates/src/templates/royal-java.tsx`

**Interfaces:**
- Consumes: `CornerOrnament` variant `"gold-line"` (generic foundation, per
  spec Phase 4 — no new cultural variant for this one), `PortraitFrame`,
  `PaperTexture`, `QuickNav`.

**Current state (already inspected):** 609 lines. Has its own bespoke
`RoyalSection` scroll-reveal wrapper and shimmer keyframes (`SHIMMER_STYLE`)
— **do not touch these**, they're this template's existing signature look.
Hero `<section>` at line 154, `<img>` cover photo at line 156. Couple
section (`<CoupleCarousel>`) at line ~309-331, wrapped in
`<section className="mx-auto max-w-2xl px-6 py-20">`. No section `id`s
anywhere. `primaryColor` default is `"#8b1a2e"` (maroon), `accentColor`
`"#c9a84c"` (gold) — this template already reads as ornate/royal, so
`"gold-line"` fits without a palette change.

This is a **bolt-on task**, not a rewrite — read the full file first, then
apply exactly these 5 additions without altering the existing
animation/shimmer machinery:

- [ ] **Step 1: Add imports**

Add to the import block (alphabetical, after `OpeningScreen`):
```tsx
import { CornerOrnament, CrownFlourish, PaperTexture, PortraitFrame } from "../components/ornaments";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
```
Remove `import { CoupleCarousel } from "../components/couple-carousel";`
(no longer used after Step 4).

- [ ] **Step 2: Add QUICK_NAV_ITEMS + PaperTexture on root**

Add the same `QUICK_NAV_ITEMS` constant used in Tasks 2-6 near the top of
the file (after `SHIMMER_STYLE`). Find the component's root returned
`<div ...>` wrapping the whole template — add `className="relative ..."`
(prepend `relative` to its existing className string, don't replace it)
and render `<PaperTexture opacity={0.04} />` as the first child, before
whatever currently renders first (mirrors Task 5 Step 3's first change).

- [ ] **Step 3: Hero id + corner ornaments**

Give the hero `<section>` (the one containing the cover `<img>` at what is
currently line 154-156) `id="beranda"`. Inside it, add the same 4-corner
`CornerOrnament` block used in Tasks 2/5/6 (`variant="gold-line"`,
`color={primary}`), positioned with `absolute inset-6` the same way. Also
render `<CrownFlourish color={primary} />` immediately above wherever the
groom/bride names heading renders in this hero (read the file to find the
exact heading markup — this template's hero text block differs in
structure from `batak-traditional.tsx`, but the insertion point is the
same conceptually: directly above the big couple-name heading).

- [ ] **Step 4: Couple section → PortraitFrame**

Replace the `<CoupleCarousel .../>` usage (~line 309-331) with the same
`PortraitFrame`-based 3-column grid pattern used in Task 5 Step 4
(`variant="gold-line"`), and add `id="mempelai"` to that section's
`<section>` tag.

- [ ] **Step 5: Events + Gallery ids, QuickNav**

Add `id="acara"` to the Events `<section>` (~line 332) and `id="galeri"`
to the Gallery `<section>` (~line 451). Before the closing
`<PoweredByDevLab />` at the end of the file, add:
```tsx
      {opened && (
        <QuickNav
          items={QUICK_NAV_ITEMS.filter(
            (item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0,
          )}
          color={primary}
          bg="rgba(255,255,255,0.9)"
        />
      )}
```
(confirm the exact `bg` shade against the file's existing `surface`/`bg`
consts — use a translucent version of whichever is lighter, matching the
`floral-classic.tsx` precedent for light-background templates).

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/royal-java.tsx`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add packages/templates/src/templates/royal-java.tsx
git commit -m "feat(templates): upgrade Royal Java with ornament foundation"
```

---

## Task 8: Upgrade Islamic Elegant

**Files:**
- Modify: `packages/templates/src/templates/islamic-elegant.tsx`

**Interfaces:**
- Consumes: `CornerOrnament` variant `"gold-line"`, `PortraitFrame`,
  `PaperTexture`, `QuickNav`.

**Current state (already inspected):** 601 lines. Already has a Bismillah
banner (~line 119) and a Bismillah reveal above the couple names (~line
180) — **keep both untouched**, they're load-bearing content for this
template's identity, not something this task replaces. Hero `<section>` at
line 145, cover `<img>` at 147. Couple section (`<CoupleCarousel>`) at
~line 319-346. No ids anywhere. `primaryColor` `"#c9a84c"` (gold),
`accentColor` `"#0f1b2d"` (dark navy) — `"gold-line"` fits directly.

Same bolt-on recipe as Task 7, applied to this file:

- [ ] **Step 1: Add imports** — same as Task 7 Step 1, applied to this
      file's import block; remove the `CoupleCarousel` import.

- [ ] **Step 2: Add QUICK_NAV_ITEMS + PaperTexture on root** — same as
      Task 7 Step 2.

- [ ] **Step 3: Hero id + corner ornaments** — `id="beranda"` on the hero
      `<section>` (~line 145), 4-corner `CornerOrnament` block with
      `variant="gold-line"`. Since this template already renders a
      Bismillah banner inside the hero, place the corner ornaments as a
      sibling `absolute inset-6` layer the same way as Task 7 — don't
      nest inside or reorder the existing Bismillah markup. Also render
      `<CrownFlourish color={primary} />` directly above the couple-name
      heading (below the existing Bismillah reveal, same relative position
      Task 5 used in `batak-traditional.tsx`).

- [ ] **Step 4: Couple section → PortraitFrame** — replace `<CoupleCarousel
      .../>` (~line 319-346) with the `PortraitFrame` grid pattern
      (`variant="gold-line"`), add `id="mempelai"`. The existing Bismillah
      reveal above the names (~line 180 — check whether it's actually
      inside this section or the hero; read the file to confirm) stays
      exactly where it is; only the carousel itself is replaced.

- [ ] **Step 5: Events + Gallery ids, QuickNav** — same pattern as Task 7
      Step 5, using this file's actual Events/Gallery section locations
      (search for `{/* Events */}` and `{/* Gallery */}` comments to find
      them precisely — line numbers shift once Steps 1-4 are applied).
      `bg` for `QuickNav`: use a translucent version of this template's
      dark navy accent, e.g. `bg="rgba(15,27,45,0.85)"`, since this
      template reads dark/ornate similar to `dark-luxury.tsx` (confirm
      against the file's actual background color const before finalizing).

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/islamic-elegant.tsx`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add packages/templates/src/templates/islamic-elegant.tsx
git commit -m "feat(templates): upgrade Islamic Elegant with ornament foundation"
```

---

## Task 9: Upgrade Photo Editorial

**Files:**
- Modify: `packages/templates/src/templates/photo-editorial.tsx`

**Interfaces:**
- Consumes: `PortraitFrame`, `PaperTexture`, `QuickNav`. **Does NOT use
  `CornerOrnament` in the hero** — see rationale below.

**Current state (already inspected):** 396 lines. Hero is a full-bleed
`grid grid-cols-1 md:grid-cols-2` photo/text split (line 84), not a framed
card layout — corner flourishes would visually collide with the edge-to-edge
photo, so skip them there. Couple section (`<CoupleCarousel>`) at ~line
166-188. No ids anywhere. `primaryColor` `"#b02a30"` (red),
`accentColor` `"#111111"` (near-black) — magazine/editorial aesthetic.

- [ ] **Step 1: Add imports**

Add to the import block (alphabetical):
```tsx
import { CornerOrnament, CrownFlourish, PaperTexture, PortraitFrame } from "../components/ornaments";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
```
Remove the `CoupleCarousel` import.

- [ ] **Step 2: Add QUICK_NAV_ITEMS + PaperTexture on root**

Same as Task 7 Step 2. `PaperTexture opacity={0.04}` — this template is
mostly light/white, matching `floral-classic.tsx`'s opacity choice rather
than `dark-luxury.tsx`'s.

- [ ] **Step 3: Hero id (no corner ornaments)**

Add `id="beranda"` to the hero `<section className="grid min-h-dvh
grid-cols-1 md:grid-cols-2">` (line 84). Do not add `CornerOrnament` here —
the photo half of the grid has no margin for them and the text half is
already typographically busy in this template's existing design. DO add
`<CrownFlourish color={primary} />` in the text column, directly above the
groom/bride name heading — it's a single small centered element and reads
fine even in this template's denser typographic layout.

- [ ] **Step 4: Couple section → PortraitFrame + corner ornaments here instead**

Replace `<CoupleCarousel .../>` (~line 166-188) with the `PortraitFrame`
grid pattern (`variant="gold-line"`), add `id="mempelai"`. Since the hero
skipped corner ornaments, add the 4-corner `CornerOrnament` block
(`variant="gold-line"`, `color={primary}`) to this Couple `<section>`
instead — wrap the section in `relative` and add the same
`absolute inset-6` corner block used elsewhere, so the template still gets
its share of the ornament treatment, just relocated to the section where
it fits the layout.

- [ ] **Step 5: Events + Gallery ids, QuickNav**

`id="acara"` on the Events `<section>` (~line 189), `id="galeri"` on the
Gallery `<section>` (~line 292). `QuickNav` before `PoweredByDevLab`:
```tsx
      {opened && (
        <QuickNav
          items={QUICK_NAV_ITEMS.filter(
            (item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0,
          )}
          color={primary}
          bg="rgba(255,255,255,0.92)"
        />
      )}
```

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm --filter @invyte/templates typecheck`
Run: `pnpm --filter @invyte/templates exec biome check --write src/templates/photo-editorial.tsx`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add packages/templates/src/templates/photo-editorial.tsx
git commit -m "feat(templates): upgrade Photo Editorial with ornament foundation"
```

---

## Final verification (after all 9 tasks)

- [ ] Run `pnpm --filter @invyte/templates typecheck` — clean.
- [ ] Run `pnpm --filter @invyte/web typecheck` — clean (confirms the
      barrel export wiring didn't break the consuming app).
- [ ] Run `pnpm --filter @invyte/templates exec biome check src` — clean
      across the whole package, not just changed files (catches any
      cross-task drift).
- [ ] Confirm `packages/templates/src/index.ts`'s `TEMPLATES` array has 24
      entries (21 existing + 3 new) and `TEMPLATE_COMPONENTS` has matching
      keys for all of them.
- [ ] Whole-branch review per `superpowers:finishing-a-development-branch`'s
      predecessor step (a final review pass across all 9 tasks' diffs
      together, same as Phase 1+2's process) before merging.
