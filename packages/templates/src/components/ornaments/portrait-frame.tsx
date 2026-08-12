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
