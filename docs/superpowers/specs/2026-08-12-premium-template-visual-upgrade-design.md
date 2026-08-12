# Premium Template Visual Upgrade — Design

**Date:** 2026-08-12
**Status:** Approved for planning
**Author:** Kelvin Prasetya (via Claude Code brainstorming session)

## Context

User feedback: our templates look plain/generic compared to competing
Indonesian digital-invitation platforms (indoinvite.com, satumomen.com,
undanganlink.id). A live comparison (Playwright screenshots of a real
indoinvite invitation, satumomen's landing-page mockup, undanganlink's hero)
against our own template source confirmed two concrete gaps, not just a
vague impression:

1. **Font-loading bug.** Several templates (`dark-luxury.tsx` confirmed,
   likely others) set `fontFamily: "'Playfair Display', Georgia, serif"` or
   reference `'Bodoni Moda'`/`'Space Grotesk'` inline, but `apps/web/app/
   layout.tsx` only loads Inter, Cormorant Infant, and Great Vibes via
   `next/font/google`. Every reference to an unloaded font silently falls
   back to the browser's default serif — the intended editorial typography
   never actually renders.
2. **Ornament asset gap.** Competitors use photographic/illustrated
   decorative assets with real texture and depth: indoinvite layers
   photo-realistic dried-floral corner frames and a circular photo frame
   with a carved-wood cultural silhouette over a subtly textured parchment
   background on every section boundary; satumomen frames the couple photo
   in a gold ornamental line-art border on a dark background. Our
   templates' decoration is flat-color CSS/SVG shapes (`floral-classic.tsx`'s
   "petals" are plain colored circles) on flat solid-color backgrounds —
   structurally similar concept, visibly cheaper execution.

Separately, the user's primary promotion target is Sumatra, so this upgrade
also adds regional-culture templates for that market rather than only
polishing existing generic ones.

## Goals

1. Fix the font-loading bug globally (benefits every template that
   references these fonts, not just the 10 touched here).
2. Build a reusable, original (self-authored, MIT-safe) SVG ornament
   component library — textured backgrounds, decorative corner frames,
   an ornamental photo-frame component, and a bottom quick-nav — used
   consistently across templates instead of ad hoc flat shapes per file.
3. Bring **10 templates** to this new visual bar:
   - 3 new Sumatra-culture templates: **Aceh**, **Melayu/Palembang**,
     **Lampung**
   - 2 existing Sumatra templates upgraded to match: **Batak**, **Minang**
   - 5 existing flagship templates upgraded: **dark-luxury**,
     **floral-classic**, **royal-java**, **islamic-elegant**,
     **photo-editorial**
4. For the 3 new + 2 upgraded cultural templates, motifs are researched
   from real reference sources before being redrawn as original line art —
   not guessed, not lifted from a photo, not AI-hallucinated.

## Non-Goals

- The other ~10 templates not listed above are untouched in this pass (the
  font fix still benefits any of them that happen to reference the same
  font names).
- No new binary/photographic assets are added to the templates package —
  everything is SVG/CSS, per the licensing decision below.
- Not building the AI-ornament-generation feature (Flux Schnell, M7/Phase 2)
  — that's a separate, already-planned milestone for user-facing AI
  generation, unrelated to this static template library upgrade.

## Key Decision: original SVG over stock/AI photo assets

Considered three sourcing approaches:

1. **Original SVG line art (chosen).** Research real motif references,
   redraw as vector line art we author ourselves. Zero licensing risk (we
   hold full copyright, compatible with the templates package's MIT
   license), infinitely scalable, and themeable via `currentColor`/a
   `color` prop the same way `theme.primaryColor` already customizes every
   template today.
2. **Free-licensed stock photos/textures**, verified individually the same
   way last session's couple-photo/music sourcing was. Rejected as the
   *primary* approach: photographic PNGs can't be tinted to match a
   tenant's chosen theme color, and free stock for specific cultural motifs
   (Pinto Aceh, kain Tapis) essentially doesn't exist — would need SVG
   fallback anyway for those, so better to have one consistent approach.
3. **Purchased stock asset packs.** Rejected: most premium stock licenses
   prohibit redistributing the raw asset file itself, which is exactly what
   committing it into a public MIT-licensed repo would do. Real legal risk
   for an open-source project, not worth it.

## Architecture: shared foundation

**Font fix** — `apps/web/app/layout.tsx`: add `Playfair_Display` and
`Bodoni_Moda` via `next/font/google`, exposed as `--font-playfair` /
`--font-bodoni` CSS vars alongside the existing three. Templates already
reference these font names by string, so no per-template code change is
needed for the fix itself to take effect.

**`packages/templates/src/components/ornaments/`** (new directory):

- `PaperTexture` — full-bleed subtle paper-grain background via an inline
  SVG `feTurbulence`/`feColorMatrix` filter (not a raster image — zero
  asset weight, resizes losslessly, tintable).
- `CornerOrnament` — decorative corner piece, `variant: "dried-floral" |
  "gold-line" | <culture-specific>`, `color` prop for theme tinting.
- `PortraitFrame` — replaces the plain `<img>` couple/portrait photo with a
  circular or arch frame plus an ornamental border, composed from
  `CornerOrnament`-style paths.
- Culture-specific motif components used by `CornerOrnament`/background
  accents: `PintoAcehMotif`, `SongketMelayuPattern`, `TapisLampungPattern`,
  plus revised `GorgaBatakMotif` and `RumahGadangMotif` for the two
  existing templates.

**`QuickNav`** (new, optional per-template) — sticky bottom icon nav
(home / mempelai / galeri / lokasi / musik) for templates with long
scrolling content, matching the pattern observed on indoinvite.

All of the above are plain React/SVG components with no new dependencies —
consistent with the existing pattern in this package (templates already do
inline SVG sparkles/petals by hand).

## Cultural motif research

For each of the 5 Sumatra templates, real reference sources are checked
before any SVG is drawn, targeting these specific elements:

| Template | Key motifs to redraw | Palette |
|---|---|---|
| Aceh (new) | Pinto Aceh (gate/lock motif from traditional jewelry), rencong silhouette, Islamic calligraphic accents | Black–gold–red |
| Melayu/Palembang (new) | Songket Palembang weave pattern, Rumah Limas roofline silhouette | Gold–red–deep green |
| Lampung (new) | Kain Tapis geometric weave, Siger (bridal crown) silhouette | Maroon–gold |
| Batak (upgrade) | Gorga carving motifs, Ulos weave pattern | Red–black–white |
| Minang (upgrade) | Rumah Gadang gonjong roofline, Minang songket pattern | Gold–maroon |

**Caveat carried into the spec explicitly:** this research is web-source
based, not validated by someone from each culture. Motifs with higher
sensitivity (Pinto Aceh, Siger) get flagged in their implementation PR for
a native/local review before being treated as final — this is the primary
market this product is targeting, so getting it visibly wrong costs more
than not having the template yet.

## Rollout phases

Each phase is its own commit/PR, independently reviewable:

1. **Foundation** — font fix + generic ornament library (`PaperTexture`,
   `CornerOrnament` gold-line & dried-floral variants, `PortraitFrame`,
   `QuickNav`). No cultural motifs yet.
2. **Proof of concept** — apply the foundation fully to `dark-luxury` and
   `floral-classic` (fastest, no cultural research blocking them). **Stop
   and show the user this result before continuing** — course-correcting
   here only costs 2 templates instead of 10.
3. **3 new Sumatra templates** — Aceh, Melayu/Palembang, Lampung.
4. **5 remaining templates** — Batak & Minang motif upgrades, plus
   royal-java, islamic-elegant, photo-editorial on the generic foundation.

## Testing

- Each template already has the `preview` prop gate (RSVP/Wishes/Music
  disabled in preview mode) — new ornament components must not interfere
  with that, since it's load-bearing for the homepage preview's safety.
- Visual check per template via the existing homepage preview modal
  (`next/dynamic`-loaded `InvitationPreview`) rather than a new test
  harness — matches how templates are currently reviewed.
- `pnpm --filter @invyte/web typecheck` and a production build after each
  phase, per this session's established verification discipline.
