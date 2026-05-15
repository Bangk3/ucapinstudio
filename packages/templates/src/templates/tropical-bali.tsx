"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
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

/* Stable firefly data */
const FIREFLIES = [
  { top: "15%", left: "10%", size: 5, dur: 2.8, delay: 0 },
  { top: "25%", left: "85%", size: 4, dur: 3.5, delay: 0.7 },
  { top: "40%", left: "20%", size: 6, dur: 2.2, delay: 1.4 },
  { top: "55%", left: "75%", size: 5, dur: 4.0, delay: 2.1 },
  { top: "70%", left: "35%", size: 4, dur: 3.2, delay: 0.3 },
  { top: "80%", left: "60%", size: 6, dur: 2.8, delay: 3.0 },
  { top: "10%", left: "55%", size: 5, dur: 4.5, delay: 1.8 },
  { top: "35%", left: "90%", size: 4, dur: 3.8, delay: 4.2 },
  { top: "60%", left: "5%", size: 6, dur: 2.5, delay: 2.6 },
  { top: "85%", left: "80%", size: 5, dur: 3.0, delay: 0.9 },
  { top: "20%", left: "40%", size: 4, dur: 2.2, delay: 5.0 },
  { top: "50%", left: "50%", size: 6, dur: 3.5, delay: 1.5 },
  { top: "75%", left: "15%", size: 5, dur: 4.8, delay: 0.5 },
  { top: "45%", left: "70%", size: 4, dur: 2.0, delay: 3.8 },
  { top: "90%", left: "45%", size: 6, dur: 3.3, delay: 7.0 },
] as const;

export function TropicalBali({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const { hosts, events, story, thanksNote, galleryUrls, musicUrl, musicTitle } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#2d6a4f";
  const accent = theme.accentColor ?? "#c87941";

  /* Parallax — only active in live (non-preview) mode */
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, 150]);

  /* Slightly shifted accent for pulse */
  const accentShifted = "#d4894e";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#fdf6ec", fontFamily: "'Georgia', serif", color: "#2c1810" }}
    >
      <style>{`
        @keyframes waveFloat {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(-5px); }
        }
      `}</style>

      {/* Firefly dots */}
      {opened && !preview && (
        <>
          {FIREFLIES.map((f, i) => (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable decorative items
              key={i}
              style={{
                position: "fixed",
                top: f.top,
                left: f.left,
                width: `${f.size}px`,
                height: `${f.size}px`,
                borderRadius: "50%",
                backgroundColor: "#a8e063",
                boxShadow: `0 0 6px 2px #a8e06366`,
                pointerEvents: "none",
                zIndex: 0,
              }}
              animate={{ opacity: [0, 0.8, 0], scale: [0, 1.2, 0] }}
              transition={{
                duration: f.dur,
                delay: f.delay,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
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

      {/* Hero — lush tropical */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {theme.coverPhotoUrl ? (
          !preview ? (
            <motion.div className="absolute inset-0 h-full w-full" style={{ y: parallaxY }}>
              <img
                src={theme.coverPhotoUrl}
                alt=""
                className="h-full w-full object-cover opacity-30"
              />
            </motion.div>
          ) : (
            <img
              src={theme.coverPhotoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )
        ) : (
          <div className="absolute inset-0 opacity-10 text-[12rem] flex items-center justify-center select-none">
            🌿
          </div>
        )}

        {/* Palm leaf shapes in corners */}
        {!preview && (
          <>
            <motion.svg
              viewBox="0 0 80 120"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 80,
                height: 120,
                opacity: 0.1,
                fill: "#1a4731",
                transformOrigin: "top left",
              }}
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <path d="M5,110 Q20,60 60,10 Q50,50 40,80 Q30,60 10,50 Q30,80 5,110 Z" />
            </motion.svg>
            <motion.svg
              viewBox="0 0 80 120"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 120,
                opacity: 0.1,
                fill: "#1a4731",
                transformOrigin: "top right",
                transform: "scaleX(-1)",
              }}
              animate={{ rotate: [3, -3, 3] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <path d="M5,110 Q20,60 60,10 Q50,50 40,80 Q30,60 10,50 Q30,80 5,110 Z" />
            </motion.svg>
            <motion.svg
              viewBox="0 0 80 120"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 80,
                height: 120,
                opacity: 0.1,
                fill: "#1a4731",
                transformOrigin: "bottom left",
                transform: "scaleY(-1)",
              }}
              animate={{ rotate: [-2, 4, -2] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <path d="M5,110 Q20,60 60,10 Q50,50 40,80 Q30,60 10,50 Q30,80 5,110 Z" />
            </motion.svg>
            <motion.svg
              viewBox="0 0 80 120"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 80,
                height: 120,
                opacity: 0.1,
                fill: "#1a4731",
                transformOrigin: "bottom right",
                transform: "scale(-1, -1)",
              }}
              animate={{ rotate: [4, -2, 4] }}
              transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <path d="M5,110 Q20,60 60,10 Q50,50 40,80 Q30,60 10,50 Q30,80 5,110 Z" />
            </motion.svg>
          </>
        )}

        {/* Tropical frame */}
        <div className="absolute top-0 left-0 right-0 h-3" style={{ backgroundColor: primary }} />
        <div className="absolute bottom-0 left-0 right-0 h-3" style={{ backgroundColor: accent }} />

        {/* Hero names — nature burst entrance */}
        <div className="relative z-10 space-y-4">
          {guestName && <p className="text-sm text-gray-600 italic">Kepada Yth. {guestName}</p>}
          <p className="text-xs uppercase tracking-widest" style={{ color: accent }}>
            🌺 Undangan Pernikahan 🌺
          </p>
          {opened && !preview ? (
            <>
              <motion.h1
                className="text-5xl font-bold md:text-7xl"
                style={{ color: primary }}
                initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {hosts.groomName}
              </motion.h1>
              <motion.p
                className="text-2xl italic"
                style={{ color: accent }}
                initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              >
                &amp;
              </motion.p>
              <motion.h1
                className="text-5xl font-bold md:text-7xl"
                style={{ color: primary }}
                initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {hosts.brideName}
              </motion.h1>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-bold md:text-7xl" style={{ color: primary }}>
                {hosts.groomName}
              </h1>
              <p className="text-2xl italic" style={{ color: accent }}>
                &amp;
              </p>
              <h1 className="text-5xl font-bold md:text-7xl" style={{ color: primary }}>
                {hosts.brideName}
              </h1>
            </>
          )}
          {events[0]?.date && (
            <p className="mt-6 text-base text-gray-600">
              {new Date(events[0].date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {events[0]?.venueName && (
            <p className="text-sm text-gray-500">📍 {events[0].venueName}, Bali</p>
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

      {/* Wave SVG at hero bottom */}
      <div className="relative overflow-hidden" style={{ height: 60, marginTop: -30 }}>
        <div
          style={{
            width: "120%",
            marginLeft: "-10%",
            animation: !preview ? "waveFloat 4s ease-in-out infinite" : undefined,
          }}
        >
          <svg
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
            style={{ width: "100%", height: 60 }}
            aria-hidden="true"
          >
            <path
              d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z"
              fill="#fdf6ec"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Couple carousel */}
      {!preview ? (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.5, ease: "easeInOut" }}
        >
          <section className="mx-auto max-w-2xl px-6 py-20">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accent }}>
                Mempelai
              </p>
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
              primaryColor={primary}
              ringColor={accent}
              textColor="#2c1810"
              mutedColor="#7a6050"
            />
          </section>
        </motion.div>
      ) : (
        <section className="mx-auto max-w-2xl px-6 py-20">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accent }}>
              Mempelai
            </p>
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
            primaryColor={primary}
            ringColor={accent}
            textColor="#2c1810"
            mutedColor="#7a6050"
          />
        </section>
      )}

      {/* Tropical color pulse section */}
      {!preview ? (
        <motion.div
          animate={{ backgroundColor: [primary, accentShifted, primary] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          style={{ paddingTop: 8, paddingBottom: 8 }}
        />
      ) : (
        <div style={{ backgroundColor: primary, paddingTop: 8, paddingBottom: 8 }} />
      )}

      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-xs uppercase tracking-widest"
          style={{ color: accent }}
        >
          🌴 Rangkaian Acara 🌴
        </h2>
        <div className="space-y-5">
          {events.map((event, idx) => (
            <AnimateIn
              key={event.id}
              direction={idx % 2 === 0 ? "left" : "right"}
              delay={idx * 0.1}
            >
              <motion.div
                className="rounded-2xl bg-white p-6 shadow-md text-center"
                style={{ borderTop: `4px solid ${primary}` }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-xl font-bold" style={{ color: primary }}>
                  {event.name}
                </h3>
                {event.date && (
                  <p className="mt-1 text-gray-600">
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {event.time && ` • ${event.time}`}
                  </p>
                )}
                {event.venueName && <p className="mt-2 font-semibold">{event.venueName}</p>}
                {event.venueAddress && (
                  <p className="text-sm text-gray-500">{event.venueAddress}</p>
                )}
                {event.dressCode && (
                  <p className="mt-1 text-xs text-gray-400">Dresscode: {event.dressCode}</p>
                )}
                {/* Maps deeplinks */}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm text-white"
                      style={{ backgroundColor: accent }}
                    >
                      🗺 Lihat Peta
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
              </motion.div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Story */}
      {story && (
        <AnimateIn direction="up">
          <section className="mx-auto max-w-xl px-6 py-16 text-center">
            <p className="text-xs uppercase tracking-widest mb-6" style={{ color: accent }}>
              🌺 Kisah Kami
            </p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{story}</p>
          </section>
        </AnimateIn>
      )}

      {/* Love story timeline */}
      {content.timeline && content.timeline.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h2
            className="mb-8 text-center text-sm uppercase tracking-widest"
            style={{ color: primary }}
          >
            Perjalanan Cinta
          </h2>
          <LoveTimeline items={content.timeline} primaryColor={primary} />
        </section>
      )}

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-12">
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-2xl object-cover shadow-md cursor-pointer"
          />
        </section>
      )}

      {/* Share */}
      {!preview && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-xs uppercase tracking-widest" style={{ color: accent }}>
            Bagikan Undangan
          </h2>
          <ShareBar
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            primaryColor={primary}
          />
        </section>
      )}

      {/* RSVP */}
      {data.rsvpEnabled && !preview && (
        <AnimateIn direction="up">
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

      {/* Wishes */}
      {data.wishesEnabled && !preview && (
        <AnimateIn direction="up">
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

      {/* Closing */}
      <AnimateIn direction="none">
        <section className="px-6 py-20 text-center text-white" style={{ backgroundColor: primary }}>
          <div className="text-3xl mb-4">🌿 🌺 🌿</div>
          <p className="max-w-lg mx-auto leading-relaxed text-green-100">
            {thanksNote ?? "Kehadiran Bapak/Ibu/Saudara/i adalah kehormatan terbesar bagi kami."}
          </p>
          <p className="mt-6 font-bold text-xl">
            {hosts.groomName} &amp; {hosts.brideName}
          </p>
        </section>
      </AnimateIn>
    </div>
  );
}
