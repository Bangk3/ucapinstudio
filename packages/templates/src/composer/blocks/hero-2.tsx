"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EventInfo, HostInfo, ThemeConfig } from "../../types";

interface HeroSplitProps {
  hosts: HostInfo;
  events: EventInfo[];
  theme: ThemeConfig;
  story?: string;
  guestName?: string;
  preview?: boolean;
}

export function HeroSplit({ hosts, events, theme, story, guestName }: HeroSplitProps) {
  const shouldReduceMotion = useReducedMotion();
  const primary = theme.primaryColor ?? "#c4826a";
  const fontHeading = theme.fontHeading ?? "Georgia, serif";
  const fontBody = theme.fontBody ?? "sans-serif";
  const coverPhoto = theme.coverPhotoUrl;

  const firstEvent = events[0];
  const storyExcerpt = story ? story.slice(0, 100) + (story.length > 100 ? "…" : "") : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Photo */}
      <div className="w-full h-[40vh] md:h-auto md:w-1/2 relative overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={`${hosts.groomName} & ${hosts.brideName}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: primary, opacity: 0.18 }} />
        )}
        {/* Bottom gradient for mobile readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:hidden" />
      </div>

      {/* Right: Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-12 md:py-16 bg-white"
        style={{ fontFamily: fontBody }}
      >
        <div className="max-w-sm w-full space-y-5">
          {guestName && (
            <motion.p
              className="text-xs uppercase tracking-[0.2em] text-gray-400"
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Yth. {guestName}
            </motion.p>
          )}

          <motion.p
            className="text-xs uppercase tracking-[0.25em] text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            The Wedding Of
          </motion.p>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: fontHeading, color: primary }}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {hosts.groomName}
            <span className="block text-2xl sm:text-3xl font-normal text-gray-400 my-1">&amp;</span>
            {hosts.brideName}
          </motion.h1>

          {firstEvent?.date && (
            <motion.div
              className="pt-1 border-t border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                {firstEvent.date}
                {firstEvent.venueName ? ` · ${firstEvent.venueName}` : ""}
              </p>
            </motion.div>
          )}

          {storyExcerpt && (
            <motion.p
              className="text-sm text-gray-500 leading-relaxed"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.4 }}
            >
              {storyExcerpt}
            </motion.p>
          )}

          {/* Accent bar */}
          <motion.div
            className="w-12 h-0.5 mt-2"
            style={{ backgroundColor: primary }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
