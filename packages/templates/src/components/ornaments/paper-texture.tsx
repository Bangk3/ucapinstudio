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
