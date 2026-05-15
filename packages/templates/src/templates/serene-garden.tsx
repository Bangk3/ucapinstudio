"use client";

import { type MotionStyle, motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

/* ─── Spring / botanical config ──────────────────────────── */
const spring = { type: "spring", stiffness: 60, damping: 14 } as const;
const springFast = { type: "spring", stiffness: 90, damping: 16 } as const;

/* ─── Stable garden particle data ───────────────────────── */
const GARDEN_PARTICLES = [
  { top: "12%", left: "15%", color: "#fda4af", size: 3, dur: 5, delay: 0 },
  { top: "20%", left: "80%", color: "#86efac", size: 2, dur: 7, delay: 0.8 },
  { top: "30%", left: "30%", color: "#fde68a", size: 3, dur: 4, delay: 1.6 },
  { top: "42%", left: "92%", color: "#fda4af", size: 2, dur: 9, delay: 0.3 },
  { top: "55%", left: "5%", color: "#86efac", size: 3, dur: 6, delay: 2.5 },
  { top: "65%", left: "65%", color: "#fde68a", size: 2, dur: 8, delay: 1.2 },
  { top: "75%", left: "45%", color: "#fda4af", size: 3, dur: 5, delay: 3.1 },
  { top: "18%", left: "55%", color: "#fde68a", size: 2, dur: 7, delay: 4.0 },
  { top: "38%", left: "72%", color: "#fda4af", size: 3, dur: 6, delay: 1.9 },
  { top: "82%", left: "20%", color: "#86efac", size: 2, dur: 9, delay: 0.6 },
  { top: "48%", left: "38%", color: "#fde68a", size: 3, dur: 10, delay: 5.0 },
  { top: "88%", left: "75%", color: "#fda4af", size: 2, dur: 4, delay: 2.2 },
  { top: "25%", left: "12%", color: "#86efac", size: 3, dur: 8, delay: 3.8 },
  { top: "60%", left: "85%", color: "#fde68a", size: 2, dur: 6, delay: 0.4 },
  { top: "70%", left: "25%", color: "#fda4af", size: 3, dur: 5, delay: 7.0 },
  { top: "35%", left: "50%", color: "#86efac", size: 2, dur: 7, delay: 1.5 },
  { top: "92%", left: "42%", color: "#fde68a", size: 3, dur: 9, delay: 4.5 },
  { top: "8%", left: "88%", color: "#fda4af", size: 2, dur: 6, delay: 2.8 },
  { top: "52%", left: "60%", color: "#86efac", size: 3, dur: 8, delay: 1.0 },
  { top: "78%", left: "95%", color: "#fde68a", size: 2, dur: 5, delay: 6.0 },
] as const;

/* ─── Floating botanical decoration ─────────────────────── */
function FloatingFloral({
  symbol,
  style,
  delay = 0,
  amplitude = 10,
  duration = 5,
}: {
  symbol: string;
  style: MotionStyle;
  delay?: number;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={style}
      animate={{ y: [0, -amplitude, 0], rotate: [0, 6, -4, 0] }}
      transition={{ repeat: Number.POSITIVE_INFINITY, duration, delay, ease: "easeInOut" }}
    >
      {symbol}
    </motion.div>
  );
}

/* ─── Scroll-triggered section wrapper ─────────────────────────── */
function GardenSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const offset =
    direction === "up"
      ? { y: 48 }
      : direction === "left"
        ? { x: 40 }
        : direction === "right"
          ? { x: -40 }
          : {};

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ ...spring, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated timeline event card ─────────────────────────── */
function TimelineCard({
  children,
  delay,
  isLast,
  primaryColor,
  accentColor,
  surface,
}: {
  children: React.ReactNode;
  delay: number;
  isLast: boolean;
  primaryColor: string;
  accentColor: string;
  surface: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });

  return (
    <div ref={ref} className="flex gap-5">
      {/* Spine */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
        <motion.div
          className="h-5 w-5 rounded-full border-2 flex-shrink-0 mt-1"
          style={{ backgroundColor: surface, borderColor: primaryColor }}
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ ...springFast, delay }}
        >
          <motion.div
            className="h-2 w-2 rounded-full m-auto mt-[3px]"
            style={{ backgroundColor: primaryColor }}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ ...springFast, delay: delay + 0.12 }}
          />
        </motion.div>
        {!isLast && (
          <motion.div
            className="w-px flex-1 mt-1"
            style={{ backgroundColor: `${accentColor}60`, minHeight: 40 }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: delay + 0.2, ease: "easeOut" }}
          />
        )}
      </div>

      {/* Card */}
      <motion.div
        className="flex-1 rounded-2xl p-6 shadow-sm mb-6"
        style={{ backgroundColor: surface, border: `1px solid ${accentColor}40` }}
        initial={{ opacity: 0, x: 30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ ...spring, delay: delay + 0.08 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── Botanical divider ───────────────────────────────────── */
function Divider({ color, accent }: { color: string; accent: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-1" style={{ color }}>
      <div className="h-px w-10" style={{ backgroundColor: accent, opacity: 0.4 }} />
      <span className="text-xs" style={{ color: accent, opacity: 0.6 }}>
        ✦
      </span>
      <span className="text-[10px]" style={{ color: accent, opacity: 0.35 }}>
        ✦
      </span>
      <span className="text-xs" style={{ color: accent, opacity: 0.6 }}>
        ✦
      </span>
      <div className="h-px w-10" style={{ backgroundColor: accent, opacity: 0.4 }} />
    </div>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p
      className="text-xs uppercase tracking-[0.35em] mb-3 text-center"
      style={{ color, opacity: 0.75 }}
    >
      {children}
    </p>
  );
}

/* ─── Main template ───────────────────────────────────────── */

export function SereneGarden({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const { hosts, events, story, thanksNote, galleryUrls, musicUrl, musicTitle } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#9c7050";
  const accent = theme.accentColor ?? "#c9a87a";
  const bg = "#fefcf8";
  const surface = "#fffdf9";
  const ink = "#3a2c24";

  /* Parallax hero bg */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: bg, fontFamily: "'Georgia', serif", color: ink }}
    >
      {/* CSS keyframes — non-preview only */}
      {!preview && (
        <style>{`
          @keyframes gardenFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33%       { transform: translateY(-8px) rotate(4deg); }
            66%       { transform: translateY(-4px) rotate(-3deg); }
          }
          @keyframes petalDrift {
            0%   { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
            10%  { opacity: 0.5; }
            90%  { opacity: 0.3; }
            100% { transform: translateY(calc(100vh + 40px)) rotate(540deg) translateX(40px); opacity: 0; }
          }
          @keyframes gardenPulse {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50%       { opacity: 0.5;  transform: scale(1.08); }
          }
          @keyframes lightRay {
            0%, 100% { opacity: 0; transform: scaleY(0); }
            30%       { opacity: 0.4; transform: scaleY(1); }
            70%       { opacity: 0.4; transform: scaleY(1); }
          }
        `}</style>
      )}

      {/* Drifting petals (non-preview) */}
      {opened &&
        !preview &&
        [
          { left: "8%", delay: "0s", dur: "12s", color: `${accent}` },
          { left: "22%", delay: "2.5s", dur: "15s", color: `${primary}` },
          { left: "45%", delay: "5s", dur: "11s", color: `${accent}` },
          { left: "67%", delay: "1.2s", dur: "14s", color: `${primary}` },
          { left: "85%", delay: "7s", dur: "13s", color: `${accent}` },
        ].map((p, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
            key={i}
            style={{
              position: "fixed",
              top: "-24px",
              left: p.left,
              width: "10px",
              height: "14px",
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              backgroundColor: p.color,
              opacity: 0,
              pointerEvents: "none",
              zIndex: 0,
              animation: `petalDrift ${p.dur} ${p.delay} infinite linear`,
            }}
          />
        ))}

      {/* Garden particles */}
      {opened && !preview && (
        <>
          {GARDEN_PARTICLES.map((p, i) => (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
              key={i}
              style={{
                position: "fixed",
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: "50%",
                backgroundColor: p.color,
                pointerEvents: "none",
                zIndex: 0,
              }}
              animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </>
      )}

      {/* Butterfly */}
      {opened && !preview && (
        <motion.div
          style={{
            position: "fixed",
            zIndex: 1,
            pointerEvents: "none",
          }}
          animate={{
            x: ["5vw", "50vw", "90vw"],
            y: ["80vh", "20vh", "30vh"],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <motion.svg
            viewBox="0 0 40 30"
            width="40"
            height="30"
            aria-hidden="true"
            animate={{ scaleX: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
          >
            {/* Left wing */}
            <ellipse cx="12" cy="15" rx="10" ry="8" fill={accent} opacity="0.6" />
            {/* Right wing */}
            <ellipse cx="28" cy="15" rx="10" ry="8" fill={accent} opacity="0.6" />
            {/* Body */}
            <ellipse cx="20" cy="15" rx="2" ry="8" fill={primary} opacity="0.8" />
          </motion.svg>
        </motion.div>
      )}

      {/* Opening screen */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          primaryColor={primary}
          bgColor={bg}
          fgColor={ink}
          onOpen={() => setOpened(true)}
          {...(guestName !== undefined ? { guestName } : {})}
          {...(theme.coverPhotoUrl !== undefined ? { coverPhotoUrl: theme.coverPhotoUrl } : {})}
        />
      )}

      {/* Background music */}
      {opened && musicUrl && !preview && (
        <MusicPlayer
          musicUrl={musicUrl}
          primaryColor={primary}
          {...(musicTitle !== undefined ? { musicTitle } : {})}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          HERO — parallax + spring names
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden"
      >
        {/* Parallax bg */}
        <motion.div className="absolute inset-0" style={{ y: heroBgY }}>
          {theme.coverPhotoUrl ? (
            <img
              src={theme.coverPhotoUrl}
              alt=""
              className="h-full w-full object-cover opacity-25"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, ${accent}18 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, ${accent}12 0%, transparent 50%),
                                  radial-gradient(circle at 50% 50%, ${primary}08 0%, transparent 70%)`,
              }}
            />
          )}
        </motion.div>

        {/* Light rays */}
        {!preview && (
          <>
            {[
              { top: "10%", left: "20%", delay: "0s", dur: "4s" },
              { top: "5%", left: "50%", delay: "2s", dur: "6s" },
              { top: "15%", left: "75%", delay: "1.5s", dur: "3.5s" },
            ].map((ray, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
                key={i}
                style={{
                  position: "absolute",
                  top: ray.top,
                  left: ray.left,
                  width: "2px",
                  height: "200px",
                  backgroundColor: "white",
                  opacity: 0,
                  transform: "rotate(15deg)",
                  transformOrigin: "top center",
                  animationName: "lightRay",
                  animationDuration: ray.dur,
                  animationDelay: ray.delay,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  pointerEvents: "none",
                }}
              />
            ))}
          </>
        )}

        {/* Floating botanical corners */}
        {!preview ? (
          <>
            <FloatingFloral
              symbol="✿"
              style={{ top: 20, left: 20, fontSize: 28, color: accent, opacity: 0.35 }}
              delay={0}
              duration={4.5}
            />
            <FloatingFloral
              symbol="✿"
              style={{ top: 20, right: 20, fontSize: 22, color: primary, opacity: 0.25 }}
              delay={1.2}
              duration={5.5}
            />
            <FloatingFloral
              symbol="❀"
              style={{ bottom: 40, left: 20, fontSize: 20, color: accent, opacity: 0.3 }}
              delay={0.7}
              duration={6}
            />
            <FloatingFloral
              symbol="✿"
              style={{ bottom: 40, right: 20, fontSize: 26, color: primary, opacity: 0.2 }}
              delay={2}
              duration={4.8}
            />
          </>
        ) : (
          <>
            <div
              className="absolute top-6 left-6 text-2xl leading-none"
              style={{ color: accent, opacity: 0.3 }}
            >
              ✿
            </div>
            <div
              className="absolute top-6 right-6 text-2xl leading-none"
              style={{ color: accent, opacity: 0.3 }}
            >
              ✿
            </div>
            <div
              className="absolute bottom-10 left-6 text-2xl leading-none"
              style={{ color: accent, opacity: 0.3 }}
            >
              ✿
            </div>
            <div
              className="absolute bottom-10 right-6 text-2xl leading-none"
              style={{ color: accent, opacity: 0.3 }}
            >
              ✿
            </div>
          </>
        )}

        <div className="relative z-10 space-y-5 max-w-sm w-full mx-auto">
          {/* Guest name */}
          {guestName && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 }}
            >
              <p className="text-xs uppercase tracking-widest opacity-60">Kepada Yth.</p>
              <p className="text-base font-semibold mt-1" style={{ color: primary }}>
                {guestName}
              </p>
            </motion.div>
          )}

          {/* Invitation label */}
          {opened && !preview ? (
            <motion.p
              className="text-xs uppercase tracking-[0.3em] opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              ✦ Undangan Pernikahan ✦
            </motion.p>
          ) : (
            <p className="text-xs uppercase tracking-[0.3em] opacity-50">✦ Undangan Pernikahan ✦</p>
          )}

          {/* Names — spring float + breathing glow */}
          {opened && !preview ? (
            <div>
              <motion.h1
                className="text-5xl font-bold md:text-6xl leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.25 }}
              >
                <motion.span
                  animate={{
                    textShadow: [
                      "0 0 0px rgba(156,112,80,0)",
                      "0 0 20px rgba(156,112,80,0.4)",
                      "0 0 0px rgba(156,112,80,0)",
                    ],
                  }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  {hosts.groomName}
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-3xl my-2 font-light italic"
                style={{ color: primary }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...springFast, delay: 0.55 }}
              >
                &amp;
              </motion.p>
              <motion.h1
                className="text-5xl font-bold md:text-6xl leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.7 }}
              >
                <motion.span
                  animate={{
                    textShadow: [
                      "0 0 0px rgba(156,112,80,0)",
                      "0 0 20px rgba(156,112,80,0.4)",
                      "0 0 0px rgba(156,112,80,0)",
                    ],
                  }}
                  transition={{
                    duration: 4,
                    delay: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  {hosts.brideName}
                </motion.span>
              </motion.h1>
            </div>
          ) : (
            <div>
              <h1
                className="text-5xl font-bold md:text-6xl leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {hosts.groomName}
              </h1>
              <p className="text-3xl my-2 font-light italic" style={{ color: primary }}>
                &amp;
              </p>
              <h1
                className="text-5xl font-bold md:text-6xl leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {hosts.brideName}
              </h1>
            </div>
          )}

          {/* Date */}
          {events[0]?.date && (
            <motion.p
              className="text-sm text-gray-500 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.0 }}
            >
              {new Date(events[0].date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </motion.p>
          )}

          <Divider color={primary} accent={accent} />

          {/* Countdown */}
          {events[0]?.date && !preview && (
            <Countdown
              targetDate={events[0].date}
              {...(events[0].time !== undefined ? { targetTime: events[0].time } : {})}
              primaryColor={primary}
              label="Menuju Hari Istimewa"
            />
          )}

          {/* Scroll hint */}
          {!preview ? (
            <motion.p
              className="text-xs opacity-30 mt-4 tracking-widest"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
            >
              ↓
            </motion.p>
          ) : (
            <p className="text-xs opacity-30 mt-4 tracking-widest">↓</p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BISMILLAH BANNER — slide up reveal
      ══════════════════════════════════════════════════════════ */}
      <GardenSection direction="none">
        <div className="py-10 text-center" style={{ backgroundColor: primary }}>
          {!preview ? (
            <motion.p
              className="text-2xl md:text-3xl mb-2 text-white"
              style={{ fontFamily: "serif", letterSpacing: "0.05em" }}
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.5, ease: "easeInOut" }}
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
            </motion.p>
          ) : (
            <p
              className="text-2xl md:text-3xl mb-2 text-white"
              style={{ fontFamily: "serif", letterSpacing: "0.05em" }}
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
            </p>
          )}
          <p className="text-xs tracking-[0.25em] text-white/60 uppercase mt-1">
            Bismillahirrahmanirrahim
          </p>
        </div>
      </GardenSection>

      {/* ══════════════════════════════════════════════════════════
          QURAN VERSE — fade in from right
      ══════════════════════════════════════════════════════════ */}
      <GardenSection direction="right" delay={0.05}>
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <div
            className="px-8 py-10 rounded-2xl"
            style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}50` }}
          >
            <p className="text-base leading-relaxed text-gray-600 italic">
              "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri
              dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan
              dijadikan-Nya di antaramu rasa kasih dan sayang."
            </p>
            <p className="mt-4 text-sm font-semibold" style={{ color: primary }}>
              — QS. Ar-Rum: 21
            </p>
          </div>
        </section>
      </GardenSection>

      {/* ══════════════════════════════════════════════════════════
          COUPLE PROFILES
      ══════════════════════════════════════════════════════════ */}
      <GardenSection direction="up" delay={0.05}>
        <section className="mx-auto max-w-2xl px-6 py-4 pb-20">
          <div className="text-center mb-10">
            {/* Dewdrop glow behind heading */}
            <div className="relative inline-block">
              {!preview && (
                <motion.div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    backgroundColor: primary,
                    filter: "blur(30px)",
                  }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  whileInView={{ opacity: [0, 0.3, 0] }}
                  viewport={{ once: false }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              )}
              <SectionLabel color={primary}>Mempelai</SectionLabel>
            </div>
            <Divider color={primary} accent={accent} />
          </div>
          <CoupleCarousel
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            {...(hosts.groomFull !== undefined ? { groomFull: hosts.groomFull } : {})}
            {...(hosts.brideFull !== undefined ? { brideFull: hosts.brideFull } : {})}
            {...(hosts.groomParents !== undefined ? { groomParents: hosts.groomParents } : {})}
            {...(hosts.brideParents !== undefined ? { brideParents: hosts.brideParents } : {})}
            {...(hosts.groomPhotoUrl !== undefined ? { groomPhotoUrl: hosts.groomPhotoUrl } : {})}
            {...(hosts.bridePhotoUrl !== undefined ? { bridePhotoUrl: hosts.bridePhotoUrl } : {})}
            primaryColor={accent}
            ringColor={accent}
            borderStyle="dashed"
            textColor={ink}
            mutedColor="#8a7060"
            groomLabel="Calon Putra"
            brideLabel="Calon Putri"
          />
        </section>
      </GardenSection>

      {/* ══════════════════════════════════════════════════════════
          EVENTS — animated timeline
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ backgroundColor: `${accent}10` }}>
        <div className="mx-auto max-w-xl">
          <GardenSection direction="up">
            <div className="text-center mb-12">
              {/* Dewdrop glow behind section heading */}
              <div className="relative inline-block">
                {!preview && (
                  <motion.div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      backgroundColor: primary,
                      filter: "blur(30px)",
                    }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    whileInView={{ opacity: [0, 0.3, 0] }}
                    viewport={{ once: false }}
                    transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
                  />
                )}
                <SectionLabel color={primary}>Rangkaian Acara</SectionLabel>
              </div>
              <Divider color={primary} accent={accent} />
            </div>
          </GardenSection>

          <div className="space-y-0">
            {events.map((event, idx) => (
              <TimelineCard
                key={event.id}
                delay={idx * 0.18}
                isLast={idx === events.length - 1}
                primaryColor={primary}
                accentColor={accent}
                surface={surface}
              >
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accent }}>
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: ink }}
                >
                  {event.name}
                </h3>
                {event.date && (
                  <p className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                {event.time && (
                  <p className="text-sm text-gray-500 mt-0.5">Pukul {event.time} WIB</p>
                )}
                {event.venueName && (
                  <p className="text-sm font-semibold mt-2" style={{ color: ink }}>
                    {event.venueName}
                  </p>
                )}
                {event.venueAddress && (
                  <p className="text-xs text-gray-400 mt-0.5">{event.venueAddress}</p>
                )}
                {event.dressCode && (
                  <p className="text-xs italic text-gray-400 mt-1">Dresscode: {event.dressCode}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white"
                      style={{ backgroundColor: primary }}
                    >
                      📍 Lihat Peta
                    </a>
                  )}
                  {event.lat !== undefined && event.lng !== undefined && (
                    <a
                      href={`https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium"
                      style={{ borderColor: accent, color: primary }}
                    >
                      Waze
                    </a>
                  )}
                </div>
                {event.lat !== undefined && event.lng !== undefined && (
                  <MapEmbed
                    lat={event.lat}
                    lng={event.lng}
                    {...(event.venueName !== undefined ? { venueName: event.venueName } : {})}
                    className="mt-3"
                  />
                )}
                {event.date && !preview && (
                  <AddToCalendar
                    eventName={event.name}
                    date={event.date}
                    {...(event.time !== undefined ? { time: event.time } : {})}
                    {...(event.venueName !== undefined ? { venueName: event.venueName } : {})}
                    {...(event.venueAddress !== undefined
                      ? { venueAddress: event.venueAddress }
                      : {})}
                    primaryColor={primary}
                  />
                )}
              </TimelineCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          LOVE STORY
      ══════════════════════════════════════════════════════════ */}
      {story && (
        <GardenSection direction="left" delay={0.05}>
          <section className="mx-auto max-w-xl px-6 py-20 text-center">
            <div className="relative inline-block">
              {!preview && (
                <motion.div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    backgroundColor: primary,
                    filter: "blur(30px)",
                  }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  whileInView={{ opacity: [0, 0.3, 0] }}
                  viewport={{ once: false }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              )}
              <SectionLabel color={primary}>Kisah Cinta Kami</SectionLabel>
            </div>
            <Divider color={primary} accent={accent} />
            <div
              className="mt-8 px-6 py-8 rounded-2xl"
              style={{ backgroundColor: `${primary}08`, border: `1px solid ${accent}30` }}
            >
              {!preview ? (
                <motion.div
                  className="text-3xl mb-4"
                  style={{ color: primary, opacity: 0.3 }}
                  animate={{ opacity: [0.2, 0.45, 0.2] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
                >
                  ❝
                </motion.div>
              ) : (
                <div className="text-3xl mb-4 opacity-30" style={{ color: primary }}>
                  ❝
                </div>
              )}
              <p className="text-base leading-relaxed text-gray-600 italic whitespace-pre-line">
                {story}
              </p>
              {!preview ? (
                <motion.div
                  className="text-3xl mt-4 rotate-180"
                  style={{ color: primary, opacity: 0.3 }}
                  animate={{ opacity: [0.2, 0.45, 0.2] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 3,
                    delay: 1.5,
                    ease: "easeInOut",
                  }}
                >
                  ❝
                </motion.div>
              ) : (
                <div className="text-3xl mt-4 opacity-30 rotate-180" style={{ color: primary }}>
                  ❝
                </div>
              )}
            </div>
          </section>
        </GardenSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          LOVE STORY TIMELINE
      ══════════════════════════════════════════════════════════ */}
      {content.timeline && content.timeline.length > 0 && (
        <GardenSection direction="up" delay={0.05}>
          <section className="mx-auto max-w-2xl px-6 py-16">
            <div className="text-center mb-8">
              <SectionLabel color={primary}>Perjalanan Cinta</SectionLabel>
              <Divider color={primary} accent={accent} />
            </div>
            <LoveTimeline items={content.timeline} primaryColor={primary} />
          </section>
        </GardenSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          GALLERY — scale stagger
      ══════════════════════════════════════════════════════════ */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-16" style={{ backgroundColor: `${accent}10` }}>
          <GardenSection direction="up">
            <div className="text-center mb-10">
              <SectionLabel color={primary}>Galeri Foto</SectionLabel>
              <Divider color={primary} accent={accent} />
            </div>
          </GardenSection>
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto max-w-3xl grid grid-cols-2 gap-2 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-xl object-cover shadow-sm cursor-pointer"
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SHARE
      ══════════════════════════════════════════════════════════ */}
      {!preview && (
        <GardenSection direction="up">
          <section className="mx-auto max-w-2xl px-6 py-16 text-center">
            <SectionLabel color={primary}>Bagikan Undangan</SectionLabel>
            <Divider color={primary} accent={accent} />
            <div className="mt-8">
              <ShareBar
                groomName={hosts.groomName}
                brideName={hosts.brideName}
                primaryColor={primary}
              />
            </div>
          </section>
        </GardenSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          RSVP
      ══════════════════════════════════════════════════════════ */}
      {data.rsvpEnabled && !preview && (
        <GardenSection direction="up">
          <section className="mx-auto max-w-2xl px-6 py-8 pb-16">
            <div className="text-center mb-8">
              <SectionLabel color={primary}>Konfirmasi Kehadiran</SectionLabel>
              <Divider color={primary} accent={accent} />
            </div>
            <RsvpForm
              invitationId={data.id}
              primaryColor={primary}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </GardenSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          WISHES
      ══════════════════════════════════════════════════════════ */}
      {data.wishesEnabled && !preview && (
        <GardenSection direction="up">
          <section className="mx-auto max-w-2xl px-6 py-8 pb-20">
            <div className="text-center mb-8">
              <SectionLabel color={primary}>Buku Tamu</SectionLabel>
              <Divider color={primary} accent={accent} />
            </div>
            <WishesSection
              invitationId={data.id}
              primaryColor={primary}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </GardenSection>
      )}

      {/* ══════════════════════════════════════════════════════════
          CLOSING — pulsing florals
      ══════════════════════════════════════════════════════════ */}
      <GardenSection direction="none">
        <section className="px-6 py-24 text-center" style={{ backgroundColor: primary }}>
          {!preview ? (
            <motion.div
              className="text-3xl mb-6"
              style={{ fontFamily: "serif", color: accent }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.5, ease: "easeInOut" }}
            >
              ✿ ❀ ✿
            </motion.div>
          ) : (
            <div
              className="text-3xl mb-6 opacity-50"
              style={{ fontFamily: "serif", color: accent }}
            >
              ✿ ❀ ✿
            </div>
          )}
          <p className="max-w-lg mx-auto leading-relaxed text-white/85 text-base">
            {thanksNote ??
              "Merupakan suatu kehormatan dan kebahagiaan apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami."}
          </p>
          {!preview ? (
            <motion.p
              className="mt-10 text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: accent }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...spring, delay: 0.2 }}
            >
              {hosts.groomName} &amp; {hosts.brideName}
            </motion.p>
          ) : (
            <p
              className="mt-10 text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: accent }}
            >
              {hosts.groomName} &amp; {hosts.brideName}
            </p>
          )}
          {events[0]?.date && (
            <p className="mt-2 text-sm text-white/50">
              {new Date(events[0].date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <div className="mt-8 text-white/30 text-sm">✦</div>
        </section>
      </GardenSection>
    </div>
  );
}
