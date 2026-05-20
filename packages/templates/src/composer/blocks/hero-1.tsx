"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Countdown } from "../../components/countdown";
import type { EventInfo, HostInfo, ThemeConfig } from "../../types";

interface HeroCenteredProps {
  hosts: HostInfo;
  events: EventInfo[];
  theme: ThemeConfig;
  guestName?: string;
  preview?: boolean;
}

export function HeroCentered({ hosts, events, theme, guestName, preview }: HeroCenteredProps) {
  const shouldReduceMotion = useReducedMotion();
  const primary = theme.primaryColor ?? "#c4826a";
  const fontHeading = theme.fontHeading ?? "Georgia, serif";
  const coverPhoto = theme.coverPhotoUrl;

  const firstEvent = events[0];

  // Split name into characters for reveal animation
  const groomChars = hosts.groomName.split("");
  const brideChars = hosts.brideName.split("");

  const charVariant = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: i * 0.04,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      {coverPhoto ? (
        <img
          src={coverPhoto}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: primary, opacity: 0.12 }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center text-white">
        {guestName && (
          <motion.p
            className="text-xs uppercase tracking-[0.2em] opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Kepada Yth. {guestName}
          </motion.p>
        )}

        <p
          className="text-sm uppercase tracking-[0.3em] opacity-70"
          style={{ fontFamily: fontHeading }}
        >
          The Wedding Of
        </p>

        {/* Groom name */}
        <motion.h1
          className="flex flex-wrap justify-center text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
          style={{ fontFamily: fontHeading }}
          initial="hidden"
          animate="visible"
          aria-label={hosts.groomName}
        >
          {groomChars.map((char, i) => (
            <motion.span key={`g-${i}`} custom={i} variants={charVariant}>
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.span
          className="text-2xl opacity-70"
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          &amp;
        </motion.span>

        {/* Bride name */}
        <motion.h1
          className="flex flex-wrap justify-center text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
          style={{ fontFamily: fontHeading }}
          initial="hidden"
          animate="visible"
          aria-label={hosts.brideName}
        >
          {brideChars.map((char, i) => (
            <motion.span key={`b-${i}`} custom={groomChars.length + i + 2} variants={charVariant}>
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Date */}
        {firstEvent?.date && (
          <motion.p
            className="mt-2 text-sm uppercase tracking-[0.25em] opacity-75"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {firstEvent.date}
          </motion.p>
        )}

        {/* Countdown */}
        {firstEvent?.date && !preview && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <Countdown
              targetDate={firstEvent.date}
              {...(firstEvent.time !== undefined ? { targetTime: firstEvent.time } : {})}
              primaryColor={primary}
            />
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">Gulir</span>
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
