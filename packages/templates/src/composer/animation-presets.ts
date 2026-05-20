"use client";
import type { Variants } from "framer-motion";
export type { AnimationPreset } from "../types";

export function getAnimationConfig(preset: string): {
  container: Variants;
  item: Variants;
} {
  switch (preset) {
    case "slide-up":
      return {
        container: { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } },
        item: {
          hidden: { opacity: 0, y: 24 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          },
        },
      };
    case "spring":
      return {
        container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
        item: {
          hidden: { opacity: 0, scale: 0.92 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 200, damping: 20 },
          },
        },
      };
    case "minimal":
      return {
        container: { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } },
        item: {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.25 } },
        },
      };
    case "dramatic":
      return {
        container: { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } },
        item: {
          hidden: { opacity: 0, scale: 0.8, y: 32 },
          visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
          },
        },
      };
    default: // "soft-fade"
      return {
        container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
        item: {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
        },
      };
  }
}
