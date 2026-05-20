"use client";

import { motion } from "framer-motion";
import type { DividerStyle } from "../types";

interface ComposerDividerProps {
  type: DividerStyle;
  primaryColor: string;
}

export function ComposerDivider({ type, primaryColor }: ComposerDividerProps) {
  if (type === "none") {
    return <div className="py-6" />;
  }

  if (type === "petal") {
    return (
      <div className="flex items-center justify-center py-8 px-6" aria-hidden="true">
        <svg
          width="260"
          height="28"
          viewBox="0 0 260 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left line */}
          <motion.line
            x1="0"
            y1="14"
            x2="104"
            y2="14"
            stroke={primaryColor}
            strokeWidth="1"
            strokeOpacity="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Petal ornament center */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Top petal */}
            <ellipse
              cx="130"
              cy="7"
              rx="5"
              ry="7"
              fill={primaryColor}
              fillOpacity="0.35"
              transform="rotate(0 130 14)"
            />
            {/* Bottom petal */}
            <ellipse
              cx="130"
              cy="21"
              rx="5"
              ry="7"
              fill={primaryColor}
              fillOpacity="0.35"
              transform="rotate(180 130 14)"
            />
            {/* Left petal */}
            <ellipse cx="123" cy="14" rx="7" ry="5" fill={primaryColor} fillOpacity="0.25" />
            {/* Right petal */}
            <ellipse cx="137" cy="14" rx="7" ry="5" fill={primaryColor} fillOpacity="0.25" />
            {/* Center dot */}
            <circle cx="130" cy="14" r="2.5" fill={primaryColor} fillOpacity="0.7" />
          </motion.g>
          {/* Right line */}
          <motion.line
            x1="156"
            y1="14"
            x2="260"
            y2="14"
            stroke={primaryColor}
            strokeWidth="1"
            strokeOpacity="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          />
        </svg>
      </div>
    );
  }

  if (type === "geometric") {
    return (
      <div className="flex items-center justify-center py-8 px-6" aria-hidden="true">
        <svg
          width="240"
          height="20"
          viewBox="0 0 240 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer left line */}
          <motion.line
            x1="0"
            y1="9"
            x2="100"
            y2="9"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity="0.35"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
          {/* Outer left line 2 */}
          <motion.line
            x1="0"
            y1="11"
            x2="100"
            y2="11"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity="0.2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
          {/* Diamond */}
          <motion.path
            d="M120 4 L130 10 L120 16 L110 10 Z"
            stroke={primaryColor}
            strokeWidth="1"
            strokeOpacity="0.6"
            fill={primaryColor}
            fillOpacity="0.15"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
          />
          {/* Outer right line */}
          <motion.line
            x1="140"
            y1="9"
            x2="240"
            y2="9"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity="0.35"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          />
          {/* Outer right line 2 */}
          <motion.line
            x1="140"
            y1="11"
            x2="240"
            y2="11"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity="0.2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          />
        </svg>
      </div>
    );
  }

  // wave
  return (
    <div className="flex items-center justify-center py-8 px-6 overflow-hidden" aria-hidden="true">
      <svg
        width="280"
        height="24"
        viewBox="0 0 280 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0 12 C20 4, 40 20, 60 12 S100 4, 120 12 S160 20, 180 12 S220 4, 240 12 S260 20, 280 12"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
