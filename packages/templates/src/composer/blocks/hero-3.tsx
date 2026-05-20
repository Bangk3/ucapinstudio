"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EventInfo, HostInfo, ThemeConfig } from "../../types";

interface HeroBotanicalProps {
  hosts: HostInfo;
  events: EventInfo[];
  theme: ThemeConfig;
  guestName?: string;
  preview?: boolean;
}

function BotanicalCorner({ rotate = 0, primaryColor }: { rotate?: number; primaryColor: string }) {
  return (
    <svg
      width="90"
      height="90"
      viewBox="0 0 90 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {/* Main vine */}
      <path
        d="M5 85 Q10 60 30 50 Q50 40 55 15"
        stroke={primaryColor}
        strokeWidth="1"
        strokeOpacity="0.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaf 1 */}
      <ellipse
        cx="25"
        cy="55"
        rx="10"
        ry="5"
        fill={primaryColor}
        fillOpacity="0.18"
        transform="rotate(-35 25 55)"
      />
      {/* Leaf 2 */}
      <ellipse
        cx="40"
        cy="38"
        rx="9"
        ry="4"
        fill={primaryColor}
        fillOpacity="0.14"
        transform="rotate(-55 40 38)"
      />
      {/* Leaf 3 (small) */}
      <ellipse
        cx="50"
        cy="25"
        rx="6"
        ry="3"
        fill={primaryColor}
        fillOpacity="0.2"
        transform="rotate(-70 50 25)"
      />
      {/* Small dot buds */}
      <circle cx="18" cy="70" r="2" fill={primaryColor} fillOpacity="0.25" />
      <circle cx="35" cy="46" r="1.5" fill={primaryColor} fillOpacity="0.3" />
      <circle cx="52" cy="20" r="1.5" fill={primaryColor} fillOpacity="0.3" />
      {/* Side branch */}
      <path
        d="M30 50 Q38 43 42 35"
        stroke={primaryColor}
        strokeWidth="0.75"
        strokeOpacity="0.3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeroBotanical({ hosts, events, theme, guestName }: HeroBotanicalProps) {
  const shouldReduceMotion = useReducedMotion();
  const primary = theme.primaryColor ?? "#9c7050";
  const fontHeading = theme.fontHeading ?? "Georgia, serif";
  const fontBody = theme.fontBody ?? "sans-serif";

  const firstEvent = events[0];

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#fdf8f3", fontFamily: fontBody }}
    >
      {/* Botanical corner frames */}
      <div className="absolute top-0 left-0 pointer-events-none">
        <BotanicalCorner rotate={0} primaryColor={primary} />
      </div>
      <div className="absolute top-0 right-0 pointer-events-none">
        <BotanicalCorner rotate={90} primaryColor={primary} />
      </div>
      <div className="absolute bottom-0 right-0 pointer-events-none">
        <BotanicalCorner rotate={180} primaryColor={primary} />
      </div>
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <BotanicalCorner rotate={270} primaryColor={primary} />
      </div>

      {/* Thin border frame */}
      <div
        className="absolute inset-4 pointer-events-none border"
        style={{ borderColor: primary, opacity: 0.2 }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-10 text-center">
        {guestName && (
          <motion.p
            className="text-xs uppercase tracking-[0.22em]"
            style={{ color: primary, opacity: 0.6 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.6 }}
          >
            Kepada Yth. {guestName}
          </motion.p>
        )}

        <motion.p
          className="text-[10px] uppercase tracking-[0.35em]"
          style={{ color: primary, opacity: 0.5 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          We joyfully invite you to celebrate the wedding of
        </motion.p>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mt-2"
          style={{ fontFamily: fontHeading, color: primary }}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {hosts.groomName}
        </motion.h1>

        <motion.span
          className="text-xl"
          style={{ color: primary, opacity: 0.4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          ✦ &amp; ✦
        </motion.span>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
          style={{ fontFamily: fontHeading, color: primary }}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {hosts.brideName}
        </motion.h1>

        {/* Thin horizontal ornament line */}
        <motion.div
          className="flex items-center gap-3 mt-2"
          initial={{ opacity: 0, scaleX: shouldReduceMotion ? 1 : 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          aria-hidden="true"
        >
          <div className="w-16 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: primary, opacity: 0.5 }} />
          <div className="w-16 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
        </motion.div>

        {firstEvent?.date && (
          <motion.p
            className="text-xs uppercase tracking-[0.22em] mt-1"
            style={{ color: primary, opacity: 0.55 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {firstEvent.date}
            {firstEvent.venueName ? ` — ${firstEvent.venueName}` : ""}
          </motion.p>
        )}
      </div>
    </div>
  );
}
