"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn, StaggerChildren } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

/* ── Shimmer CSS ──────────────────────────────────────────── */
const SHIMMER_STYLE = `
@keyframes royalShimmer {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}
@keyframes royalPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.08); }
}
@keyframes scrollUnfurl {
  from { clip-path: inset(0 0 100% 0); opacity: 0; }
  to   { clip-path: inset(0 0 0% 0);   opacity: 1; }
}
@keyframes headingShimmer {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}
`;

/* ── Section with scroll-triggered reveal ─────────────────── */
function RoyalSection({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: import("framer-motion").MotionStyle;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      {...(style !== undefined ? { style } : {})}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.76, 0, 0.24, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function RoyalJava({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const { hosts, events, story, thanksNote, galleryUrls, musicUrl, musicTitle } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#8b1a2e";
  const gold = theme.accentColor ?? "#c9a84c";
  const bg = "#fdf8f0";

  /* Gold shimmer gradient style */
  const goldShimmerStyle: React.CSSProperties = !preview
    ? {
        background: `linear-gradient(90deg, ${gold} 0%, #ffe87c 35%, ${gold} 50%, #ffe87c 65%, ${gold} 100%)`,
        backgroundSize: "300% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "royalShimmer 4s linear infinite",
      }
    : { color: gold };

  /* Heading shimmer (richer gold for section headings) */
  const headingShimmerStyle: React.CSSProperties = !preview
    ? {
        background: `linear-gradient(90deg, #8b1a2e 0%, #c9a84c 25%, #ffd700 50%, #c9a84c 75%, #8b1a2e 100%)`,
        backgroundSize: "300% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "headingShimmer 5s linear infinite",
      }
    : { color: gold };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: bg, fontFamily: "'Georgia', serif", color: "#1a0a0a" }}
    >
      {!preview && <style>{SHIMMER_STYLE}</style>}

      {/* Batik border trim — top */}
      <svg width="100%" height="16" aria-hidden="true">
        <defs>
          <pattern id="batikTop" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <polygon points="8,0 16,8 8,16 0,8" fill={gold} opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="16" fill="url(#batikTop)" />
      </svg>

      {/* Opening screen */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          primaryColor={primary}
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

      {/* Royal header stripes */}
      <div className="h-2" style={{ backgroundColor: gold }} />
      <div className="h-1" style={{ backgroundColor: primary }} />
      <div
        className="py-4 text-center text-xs tracking-[0.4em] uppercase"
        style={{ backgroundColor: primary }}
      >
        <span style={goldShimmerStyle}>✦ Undangan Pernikahan ✦</span>
      </div>
      <div className="h-1" style={{ backgroundColor: primary }} />
      <div className="h-2" style={{ backgroundColor: gold }} />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-15"
          />
        )}

        {/* Batik SVG pattern overlay */}
        {!preview && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <svg width="100%" height="100%" aria-hidden="true">
              <defs>
                <pattern
                  id="batikHero"
                  x="0"
                  y="0"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <polygon
                    points="16,2 30,16 16,30 2,16"
                    fill="none"
                    stroke={gold}
                    strokeWidth="0.8"
                  />
                  <circle cx="16" cy="16" r="3" fill={gold} opacity="0.6" />
                  <line x1="16" y1="2" x2="16" y2="0" stroke={gold} strokeWidth="0.5" />
                  <line x1="30" y1="16" x2="32" y2="16" stroke={gold} strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#batikHero)" />
            </svg>
          </motion.div>
        )}

        <div className="relative z-10 space-y-6">
          {/* Pulsing ornament */}
          {!preview ? (
            <motion.div
              className="text-5xl mb-2"
              style={{ color: gold }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
            >
              ❖
            </motion.div>
          ) : (
            <div className="text-5xl mb-2" style={{ color: gold }}>
              ❖
            </div>
          )}

          {guestName && (
            <AnimateIn delay={0.1}>
              <p className="text-sm italic text-gray-600">Kepada Yth. {guestName}</p>
            </AnimateIn>
          )}

          {/* Names — royal side entrance */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={goldShimmerStyle}>
              Dengan rahmat dan karunia Tuhan
            </p>

            {!preview ? (
              <>
                {/* Groom slides from left */}
                <motion.h1
                  className="text-5xl font-bold md:text-6xl"
                  style={{ color: primary }}
                  initial={{ opacity: 0, x: -60 }}
                  animate={opened ? { opacity: 1, x: 0 } : {}}
                  transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }}
                >
                  {hosts.groomName}
                </motion.h1>

                {/* Connector scales in */}
                <motion.p
                  className="my-4 text-2xl italic"
                  style={{ color: gold }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={opened ? { opacity: 1, scale: 1 } : {}}
                  transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.7 }}
                >
                  — & —
                </motion.p>

                {/* Bride slides from right */}
                <motion.h1
                  className="text-5xl font-bold md:text-6xl"
                  style={{ color: primary }}
                  initial={{ opacity: 0, x: 60 }}
                  animate={opened ? { opacity: 1, x: 0 } : {}}
                  transition={{ type: "spring", stiffness: 80, damping: 20, delay: 1.0 }}
                >
                  {hosts.brideName}
                </motion.h1>
              </>
            ) : (
              <>
                <h1 className="text-5xl font-bold md:text-6xl" style={{ color: primary }}>
                  {hosts.groomName}
                </h1>
                <p className="my-4 text-2xl italic" style={{ color: gold }}>
                  — & —
                </p>
                <h1 className="text-5xl font-bold md:text-6xl" style={{ color: primary }}>
                  {hosts.brideName}
                </h1>
              </>
            )}
          </div>

          {events[0]?.date && (
            <AnimateIn delay={1.6} direction="none">
              <p className="mt-6 text-base text-gray-700">
                {new Date(events[0].date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </AnimateIn>
          )}

          <AnimateIn delay={1.7} direction="none">
            <div className="text-2xl" style={{ color: gold }}>
              ❖
            </div>
          </AnimateIn>

          {events[0]?.date && !preview && (
            <AnimateIn delay={1.8}>
              <Countdown
                targetDate={events[0].date}
                {...(events[0].time !== undefined ? { targetTime: events[0].time } : {})}
                primaryColor={primary}
                label="Menuju Hari Bahagia"
              />
            </AnimateIn>
          )}
        </div>
      </section>

      {/* ── Couple ──────────────────────────────────────────────── */}
      <RoyalSection>
        <section className="mx-auto max-w-2xl px-6 py-20">
          <div className="border-y py-10" style={{ borderColor: gold }}>
            <CoupleCarousel
              groomName={hosts.groomName}
              brideName={hosts.brideName}
              {...(hosts.groomFull !== undefined ? { groomFull: hosts.groomFull } : {})}
              {...(hosts.brideFull !== undefined ? { brideFull: hosts.brideFull } : {})}
              {...(hosts.groomParents !== undefined ? { groomParents: hosts.groomParents } : {})}
              {...(hosts.brideParents !== undefined ? { brideParents: hosts.brideParents } : {})}
              {...(hosts.groomPhotoUrl !== undefined ? { groomPhotoUrl: hosts.groomPhotoUrl } : {})}
              {...(hosts.bridePhotoUrl !== undefined ? { bridePhotoUrl: hosts.bridePhotoUrl } : {})}
              primaryColor={gold}
              ringColor={gold}
              textColor={primary}
              mutedColor="#7a6050"
              groomLabel="Putra"
              brideLabel="Putri"
            />
          </div>
        </section>
      </RoyalSection>

      {/* ── Events ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <AnimateIn>
          <h2
            className="mb-10 text-center text-xs uppercase tracking-widest"
            style={headingShimmerStyle}
          >
            ❖ Acara ❖
          </h2>
        </AnimateIn>
        <StaggerChildren staggerDelay={0.18} direction="up" className="space-y-6">
          {events.map((event) => (
            <motion.div
              key={event.id}
              className="p-6 text-center"
              style={{ border: `1px solid ${gold}`, backgroundColor: "white" }}
              initial={{ opacity: 0, rotateX: 15, y: 20 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: gold }}>
                ❖
              </p>
              <h3 className="text-xl font-bold mb-2" style={{ color: primary }}>
                {event.name}
              </h3>
              {event.date && (
                <p className="text-gray-700">
                  {new Date(event.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {event.time && ` • Pukul ${event.time} WIB`}
                </p>
              )}
              {event.venueName && <p className="mt-2 font-semibold">{event.venueName}</p>}
              {event.venueAddress && <p className="text-sm text-gray-500">{event.venueAddress}</p>}
              {event.dressCode && (
                <p className="mt-2 text-xs italic text-gray-500">Dresscode: {event.dressCode}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {event.mapsUrl && (
                  <a
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-sm text-white"
                    style={{ backgroundColor: primary }}
                  >
                    Lihat Peta
                  </a>
                )}
                {event.lat !== undefined && event.lng !== undefined && (
                  <a
                    href={`https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border px-4 py-1.5 text-sm"
                    style={{ borderColor: gold, color: gold }}
                  >
                    Waze
                  </a>
                )}
              </div>
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
            </motion.div>
          ))}
        </StaggerChildren>
      </section>

      {/* ── Story ───────────────────────────────────────────────── */}
      {story && (
        <AnimateIn direction="none">
          <section className="mx-auto max-w-xl px-6 py-16 text-center">
            <div className="text-2xl mb-6" style={{ color: gold }}>
              ❖
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line italic">{story}</p>
          </section>
        </AnimateIn>
      )}

      {/* ── Gallery ─────────────────────────────────────────────── */}
      {galleryUrls && galleryUrls.length > 0 && (
        <AnimateIn direction="up">
          <section className="px-4 py-12">
            <GalleryLightbox
              urls={galleryUrls}
              gridClassName="mx-auto grid max-w-3xl grid-cols-2 gap-2 md:grid-cols-3"
              itemClassName="aspect-square w-full object-cover shadow-lg cursor-pointer"
            />
          </section>
        </AnimateIn>
      )}

      {/* ── Share ───────────────────────────────────────────────── */}
      {!preview && (
        <AnimateIn>
          <section className="mx-auto max-w-2xl px-6 py-16 text-center">
            <h2 className="mb-6 text-xs uppercase tracking-widest" style={headingShimmerStyle}>
              ❖ Bagikan Undangan ❖
            </h2>
            <ShareBar
              groomName={hosts.groomName}
              brideName={hosts.brideName}
              primaryColor={primary}
            />
          </section>
        </AnimateIn>
      )}

      {/* ── RSVP ────────────────────────────────────────────────── */}
      {data.rsvpEnabled && !preview && (
        <AnimateIn>
          <section className="mx-auto max-w-2xl px-6 py-16">
            <h2
              className="mb-6 text-center text-sm uppercase tracking-widest"
              style={{ color: primary }}
            >
              Konfirmasi Kehadiran
            </h2>
            <RsvpForm
              invitationId={data.id}
              primaryColor={primary}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </AnimateIn>
      )}

      {/* ── Wishes ──────────────────────────────────────────────── */}
      {data.wishesEnabled && !preview && (
        <AnimateIn>
          <section className="mx-auto max-w-2xl px-6 py-16">
            <h2
              className="mb-6 text-center text-sm uppercase tracking-widest"
              style={{ color: primary }}
            >
              Buku Tamu
            </h2>
            <WishesSection
              invitationId={data.id}
              primaryColor={primary}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </AnimateIn>
      )}

      {/* ── Royal seal + closing ──────────────────────────────────── */}
      <AnimateIn direction="none">
        <section className="px-6 py-20 text-center text-white" style={{ backgroundColor: primary }}>
          {/* Royal seal stamp */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 }}
            className="mx-auto mb-8"
            style={{ width: 80, height: 80 }}
          >
            <svg viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="38" fill="none" stroke={gold} strokeWidth="1.5" />
              <circle cx="40" cy="40" r="30" fill="none" stroke={gold} strokeWidth="0.8" />
              <text
                x="40"
                y="38"
                textAnchor="middle"
                fontSize="7"
                fill={gold}
                fontFamily="Georgia, serif"
                letterSpacing="1"
              >
                UNDANGAN
              </text>
              <text
                x="40"
                y="48"
                textAnchor="middle"
                fontSize="7"
                fill={gold}
                fontFamily="Georgia, serif"
                letterSpacing="1"
              >
                PERNIKAHAN
              </text>
              <polygon
                points="40,14 42,22 50,22 44,27 46,35 40,30 34,35 36,27 30,22 38,22"
                fill={gold}
                opacity="0.7"
              />
            </svg>
          </motion.div>

          <motion.div
            className="text-3xl mb-6"
            animate={!preview ? { rotate: [0, 15, -15, 0], scale: [1, 1.1, 1.1, 1] } : {}}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 5, ease: "easeInOut" }}
          >
            <span style={goldShimmerStyle}>❖</span>
          </motion.div>
          <p className="max-w-lg mx-auto leading-relaxed text-red-100">
            {thanksNote ??
              "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir."}
          </p>
          <p className="mt-8 font-bold text-xl" style={goldShimmerStyle}>
            {hosts.groomName} & {hosts.brideName}
          </p>
        </section>
      </AnimateIn>

      <div className="h-1" style={{ backgroundColor: primary }} />
      <div className="h-2" style={{ backgroundColor: gold }} />

      {/* Batik border trim — bottom */}
      <svg width="100%" height="16" aria-hidden="true">
        <defs>
          <pattern
            id="batikBottom"
            x="0"
            y="0"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <polygon points="8,0 16,8 8,16 0,8" fill={gold} opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="16" fill="url(#batikBottom)" />
      </svg>
    </div>
  );
}
