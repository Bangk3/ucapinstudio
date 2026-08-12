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
