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
            <path key={y} d={`M4 ${y} L13 ${y + 5} L4 ${y + 10} Z`} fill={color} opacity={0.4} />
          ))}
          {[10, 20, 30].map((x) => (
            <path key={x} d={`M${x} 4 L${x + 5} 13 L${x + 10} 4 Z`} fill={color} opacity={0.4} />
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
