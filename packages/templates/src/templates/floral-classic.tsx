"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

/* Stable petal data */
const PETALS = [
  { left: "8%", duration: "10s", delay: "0s", color: "#f9a8d4", size: 12 },
  { left: "18%", duration: "13s", delay: "1.5s", color: "#fda4af", size: 18 },
  { left: "27%", duration: "9s", delay: "3s", color: "#f9a8d4", size: 8 },
  { left: "37%", duration: "12s", delay: "0.8s", color: "#fecdd3", size: 12 },
  { left: "46%", duration: "15s", delay: "4.5s", color: "#fda4af", size: 18 },
  { left: "55%", duration: "11s", delay: "2s", color: "#fecdd3", size: 8 },
  { left: "64%", duration: "14s", delay: "6s", color: "#f9a8d4", size: 12 },
  { left: "73%", duration: "10s", delay: "1.2s", color: "#fda4af", size: 18 },
  { left: "81%", duration: "13s", delay: "3.8s", color: "#fecdd3", size: 8 },
  { left: "88%", duration: "11s", delay: "0.5s", color: "#f9a8d4", size: 12 },
  { left: "14%", duration: "16s", delay: "7s", color: "#fecdd3", size: 18 },
  { left: "43%", duration: "9s", delay: "5s", color: "#fda4af", size: 8 },
  { left: "61%", duration: "12s", delay: "2.5s", color: "#f9a8d4", size: 12 },
  { left: "93%", duration: "14s", delay: "4s", color: "#fda4af", size: 18 },
] as const;

/* Sparkle star SVG positions */
const SPARKLES = [
  { top: "12%", left: "8%", size: 8, delay: 0 },
  { top: "20%", left: "90%", size: 6, delay: 0.7 },
  { top: "35%", left: "5%", size: 10, delay: 1.4 },
  { top: "50%", left: "95%", size: 7, delay: 2.1 },
  { top: "65%", left: "10%", size: 9, delay: 0.3 },
  { top: "75%", left: "88%", size: 6, delay: 3.0 },
  { top: "15%", left: "50%", size: 8, delay: 1.8 },
  { top: "40%", left: "80%", size: 7, delay: 4.2 },
  { top: "80%", left: "30%", size: 6, delay: 2.6 },
  { top: "90%", left: "70%", size: 9, delay: 0.9 },
] as const;

export function FloralClassic({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const { hosts, events, story, thanksNote, galleryUrls, musicUrl, musicTitle } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#c4826a";
  const accent = theme.accentColor ?? "#f5ede8";

  return (
    <div
      className="min-h-screen text-[#3d2c2c] overflow-x-hidden"
      style={{ backgroundColor: accent, fontFamily: "'Georgia', serif" }}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes floatPetal {
          0%   { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(calc(100vh + 40px)) rotate(720deg) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes sparkle {
          0%   { transform: scale(0) rotate(0deg);   opacity: 0; }
          40%  { transform: scale(1) rotate(90deg);  opacity: 1; }
          100% { transform: scale(0) rotate(180deg); opacity: 0; }
        }
        @keyframes shimmerHero {
          0%   { background-position: -100% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Floating petals */}
      {opened && !preview && (
        <>
          {PETALS.map((petal, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
              key={i}
              style={
                {
                  position: "fixed",
                  top: "-20px",
                  left: petal.left,
                  width: `${petal.size}px`,
                  height: `${Math.round(petal.size * 1.35)}px`,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  backgroundColor: petal.color,
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: 0,
                  "--drift": `${-40 + (Math.round(i * 8.5) % 120)}px`,
                  animation: `floatPetal ${petal.duration} ${petal.delay} infinite linear`,
                } as React.CSSProperties
              }
            />
          ))}
        </>
      )}

      {/* Sparkle stars */}
      {opened && !preview && (
        <>
          {SPARKLES.map((s, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
              key={i}
              style={{
                position: "fixed",
                top: s.top,
                left: s.left,
                width: `${s.size}px`,
                height: `${s.size}px`,
                pointerEvents: "none",
                zIndex: 0,
                animationDelay: `${s.delay}s`,
                animationDuration: "2.5s",
                animationName: "sparkle",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
              }}
            >
              <svg viewBox="0 0 10 10" fill={primary} aria-hidden="true">
                <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4" />
              </svg>
            </div>
          ))}
        </>
      )}

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

      {/* Decorative header */}
      <div className="h-2 w-full" style={{ backgroundColor: primary }} />

      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-15"
          />
        )}

        {/* Background shimmer overlay */}
        {!preview && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmerHero 3s ease-in-out 0s 1, shimmerHero 3s ease-in-out 6s infinite",
            }}
          />
        )}

        <div className="relative z-10">
          {guestName && (
            <p className="mb-4 text-sm italic text-gray-500">Kepada Yth. {guestName}</p>
          )}
          <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: primary }}>
            ~ Undangan Pernikahan ~
          </p>
          {opened && !preview ? (
            <motion.div
              className="my-6 text-5xl font-light tracking-wide md:text-6xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <span className="font-bold">{hosts.groomName}</span>
              <div className="my-3 text-2xl italic" style={{ color: primary }}>
                dan
              </div>
              <span className="font-bold">{hosts.brideName}</span>
            </motion.div>
          ) : (
            <div className="my-6 text-5xl font-light tracking-wide md:text-6xl">
              <span className="font-bold">{hosts.groomName}</span>
              <div className="my-3 text-2xl italic" style={{ color: primary }}>
                dan
              </div>
              <span className="font-bold">{hosts.brideName}</span>
            </div>
          )}
          {events[0]?.date && (
            <p className="mt-4 text-base text-gray-600">
              {new Date(events[0].date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {/* Countdown */}
          {events[0]?.date && !preview && (
            <div className="mt-8">
              <Countdown
                targetDate={events[0].date}
                {...(events[0].time !== undefined ? { targetTime: events[0].time } : {})}
                primaryColor={primary}
                label="Menuju Hari Bahagia"
              />
            </div>
          )}
        </div>
      </section>

      {/* Couple carousel */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center mb-10">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: primary }}>
              Mempelai
            </p>
          </motion.div>
        </div>
        <AnimateIn direction="up">
          <CoupleCarousel
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            {...(hosts.groomFull !== undefined ? { groomFull: hosts.groomFull } : {})}
            {...(hosts.brideFull !== undefined ? { brideFull: hosts.brideFull } : {})}
            {...(hosts.groomParents !== undefined ? { groomParents: hosts.groomParents } : {})}
            {...(hosts.brideParents !== undefined ? { brideParents: hosts.brideParents } : {})}
            {...(hosts.groomPhotoUrl !== undefined ? { groomPhotoUrl: hosts.groomPhotoUrl } : {})}
            {...(hosts.bridePhotoUrl !== undefined ? { bridePhotoUrl: hosts.bridePhotoUrl } : {})}
            primaryColor={primary}
            textColor="#3d2c2c"
            mutedColor="#a0856e"
          />
        </AnimateIn>
      </section>

      {/* Animated rose branch divider */}
      <div className="mx-auto max-w-xs py-4 flex items-center justify-center">
        <svg viewBox="0 0 200 30" width="200" height="30" aria-hidden="true">
          <motion.path
            d="M10,15 C40,5 60,25 100,15 C140,5 160,25 190,15"
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <motion.circle
            cx="50"
            cy="12"
            r="4"
            fill="none"
            stroke={primary}
            strokeWidth="1.2"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          />
          <motion.circle
            cx="100"
            cy="18"
            r="4"
            fill="none"
            stroke={primary}
            strokeWidth="1.2"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.9 }}
          />
          <motion.circle
            cx="150"
            cy="12"
            r="4"
            fill="none"
            stroke={primary}
            strokeWidth="1.2"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1.2 }}
          />
        </svg>
      </div>

      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <motion.div
          whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            className="mb-10 text-center text-xs uppercase tracking-widest"
            style={{ color: primary }}
          >
            Rangkaian Acara
          </h2>
        </motion.div>
        <div className="space-y-6">
          {events.map((event, index) => (
            <AnimateIn key={event.id} direction="up" delay={index * 0.15}>
              <div className="rounded-2xl bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm">
                <h3 className="text-xl font-bold">{event.name}</h3>
                {event.date && (
                  <p className="mt-1 text-gray-600">
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {event.time && ` • ${event.time} WIB`}
                  </p>
                )}
                {event.venueName && <p className="mt-2 font-semibold">{event.venueName}</p>}
                {event.venueAddress && (
                  <p className="text-sm text-gray-500">{event.venueAddress}</p>
                )}
                {/* Maps deeplinks */}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm text-white"
                      style={{ backgroundColor: primary }}
                    >
                      Lihat Lokasi
                    </a>
                  )}
                  {event.lat !== undefined && event.lng !== undefined && (
                    <a
                      href={`https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm"
                      style={{ borderColor: primary, color: primary }}
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
                {/* Add to calendar */}
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
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Story */}
      {story && (
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="mb-4 text-xs uppercase tracking-widest" style={{ color: primary }}>
              Kisah Cinta
            </p>
          </motion.div>
          <p className="text-gray-700 leading-relaxed italic whitespace-pre-line">"{story}"</p>
        </section>
      )}

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-12">
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-2xl object-cover shadow-sm cursor-pointer"
          />
        </section>
      )}

      {/* Share */}
      {!preview && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="mb-6 text-xs uppercase tracking-widest" style={{ color: primary }}>
              Bagikan Undangan
            </h2>
          </motion.div>
          <ShareBar
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            primaryColor={primary}
          />
        </section>
      )}

      {/* RSVP */}
      {data.rsvpEnabled && !preview && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2
              className="mb-6 text-center text-sm uppercase tracking-widest"
              style={{ color: primary }}
            >
              Konfirmasi Kehadiran
            </h2>
          </motion.div>
          <RsvpForm
            invitationId={data.id}
            primaryColor={primary}
            {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
            {...(guestName !== undefined ? { guestName } : {})}
          />
        </section>
      )}

      {/* Wishes */}
      {data.wishesEnabled && !preview && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <motion.div
            whileInView={{ scale: [0.95, 1.02, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2
              className="mb-6 text-center text-sm uppercase tracking-widest"
              style={{ color: primary }}
            >
              Buku Tamu
            </h2>
          </motion.div>
          <WishesSection
            invitationId={data.id}
            primaryColor={primary}
            {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
            {...(guestName !== undefined ? { guestName } : {})}
          />
        </section>
      )}

      {/* Closing */}
      <section className="px-6 py-20 text-center" style={{ backgroundColor: primary }}>
        <p className="text-white/90 text-lg max-w-lg mx-auto leading-relaxed">
          {thanksNote ??
            "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir."}
        </p>
        <p className="mt-6 text-white font-bold text-xl">
          {hosts.groomName} & {hosts.brideName}
        </p>
        <p className="mt-2 text-white/70 text-sm">✿</p>
      </section>

      <div className="h-2 w-full" style={{ backgroundColor: primary }} />
    </div>
  );
}
