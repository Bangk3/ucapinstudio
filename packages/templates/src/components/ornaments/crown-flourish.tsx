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
