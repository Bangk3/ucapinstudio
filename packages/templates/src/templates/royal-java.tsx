"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn, StaggerChildren } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

/* ── Shimmer CSS injected once ─────────────────────────────────── */
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
`;

/* ── Section with scroll-triggered reveal ───────────────────────── */
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

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: bg, fontFamily: "'Georgia', serif", color: "#1a0a0a" }}
    >
      {!preview && <style>{SHIMMER_STYLE}</style>}

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

          {/* Names — royal unfurl from top + bottom */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={goldShimmerStyle}>
              Dengan rahmat dan karunia Tuhan
            </p>

            {!preview ? (
              <>
                <motion.h1
                  className="text-5xl font-bold md:text-6xl"
                  style={{ color: primary }}
                  initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
                  animate={opened ? { clipPath: "inset(0 0 0% 0)", opacity: 1 } : {}}
                  transition={{ duration: 1.0, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
                >
                  {hosts.groomName}
                </motion.h1>

                <motion.p
                  className="my-4 text-2xl italic"
                  style={{ color: gold }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={opened ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  — & —
                </motion.p>

                <motion.h1
                  className="text-5xl font-bold md:text-6xl"
                  style={{ color: primary }}
                  initial={{ clipPath: "inset(100% 0 0% 0)", opacity: 0 }}
                  animate={opened ? { clipPath: "inset(0% 0 0% 0)", opacity: 1 } : {}}
                  transition={{ duration: 1.0, delay: 1.1, ease: [0.76, 0, 0.24, 1] }}
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
            style={goldShimmerStyle}
          >
            ❖ Acara ❖
          </h2>
        </AnimateIn>
        <StaggerChildren staggerDelay={0.18} direction="up" className="space-y-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-6 text-center"
              style={{ border: `1px solid ${gold}`, backgroundColor: "white" }}
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
            </div>
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
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 md:grid-cols-3">
              {galleryUrls.map((url, i) => (
                <motion.img
                  key={i}
                  src={url}
                  alt=""
                  className="aspect-square w-full object-cover shadow-lg"
                  style={{ border: `2px solid ${gold}` }}
                  initial={!preview ? { opacity: 0, scale: 0.92 } : {}}
                  whileInView={!preview ? { opacity: 1, scale: 1 } : {}}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                />
              ))}
            </div>
          </section>
        </AnimateIn>
      )}

      {/* ── Share ───────────────────────────────────────────────── */}
      {!preview && (
        <AnimateIn>
          <section className="mx-auto max-w-2xl px-6 py-16 text-center">
            <h2 className="mb-6 text-xs uppercase tracking-widest" style={goldShimmerStyle}>
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

      {/* ── Closing ─────────────────────────────────────────────── */}
      <AnimateIn direction="none">
        <section className="px-6 py-20 text-center text-white" style={{ backgroundColor: primary }}>
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
    </div>
  );
}
