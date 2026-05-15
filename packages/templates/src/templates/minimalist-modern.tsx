"use client";

import { motion } from "framer-motion";
import { useState } from "react";
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

export function MinimalistModern({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const { hosts, events, story, quote, thanksNote, galleryUrls, musicUrl, musicTitle } = content;
  const [opened, setOpened] = useState(preview); // skip opening screen in preview

  const primary = theme.primaryColor ?? "#6b8f6e";

  return (
    <div
      className="min-h-screen bg-[#f9f7f4] font-serif text-[#2c2c2c] overflow-x-hidden"
      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
    >
      {/* Opening screen (only on public page, not preview) */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          {...(guestName !== undefined ? { guestName } : {})}
          primaryColor={primary}
          {...(theme.coverPhotoUrl !== undefined ? { coverPhotoUrl: theme.coverPhotoUrl } : {})}
          onOpen={() => setOpened(true)}
        />
      )}

      {/* Background music */}
      {opened && musicUrl && !preview && (
        <MusicPlayer
          musicUrl={musicUrl}
          {...(musicTitle !== undefined ? { musicTitle } : {})}
          primaryColor={primary}
        />
      )}

      {/* Hero */}
      <section
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center"
        style={{ backgroundColor: "#f9f7f4" }}
      >
        {theme.coverPhotoUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={theme.coverPhotoUrl}
              alt="Cover"
              className="h-full w-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative z-10 space-y-4">
          {guestName && (
            <p className="text-sm uppercase tracking-widest text-gray-500">
              Kepada Yth. {guestName}
            </p>
          )}
          <p className="text-sm uppercase tracking-widest" style={{ color: primary }}>
            Pernikahan
          </p>
          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            {!preview ? (
              <>
                <motion.span
                  style={{ display: "block" }}
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {hosts.groomName}
                </motion.span>
                <motion.span
                  className="text-3xl font-light"
                  style={{ display: "block", margin: "8px 0", color: primary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  &
                </motion.span>
                <motion.span
                  style={{ display: "block" }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {hosts.brideName}
                </motion.span>
              </>
            ) : (
              <>
                {hosts.groomName}
                <span
                  className="text-3xl font-light"
                  style={{ display: "block", margin: "8px 0", color: primary }}
                >
                  &
                </span>
                {hosts.brideName}
              </>
            )}
          </h1>
          {events[0]?.date && (
            <AnimateIn delay={0.7} direction="up">
              <p className="mt-6 text-lg text-gray-600">
                {new Date(events[0].date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </AnimateIn>
          )}

          {/* Countdown */}
          {events[0]?.date && !preview && (
            <AnimateIn delay={0.9} direction="up">
              <div className="mt-8">
                <Countdown
                  targetDate={events[0].date}
                  {...(events[0].time !== undefined ? { targetTime: events[0].time } : {})}
                  primaryColor={primary}
                  label="Menuju Hari Bahagia"
                />
              </div>
            </AnimateIn>
          )}
        </div>
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ color: primary }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
        >
          ↓
        </motion.div>
      </section>

      {/* Couple carousel */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mb-10 h-px bg-gray-200" />
        <p className="text-xs uppercase tracking-widest mb-8" style={{ color: primary }}>
          Mempelai
        </p>
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
            textColor="#2c2c2c"
            mutedColor="#9ca3af"
          />
        </AnimateIn>
        <div className="mt-10 h-px bg-gray-200" />
      </section>

      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-sm uppercase tracking-widest"
          style={{ color: primary }}
        >
          Acara
        </h2>
        <StaggerChildren className="space-y-8" staggerDelay={0.15}>
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm"
            >
              <h3 className="text-xl font-bold">{event.name}</h3>
              {event.date && (
                <p className="mt-2 text-gray-600">
                  {new Date(event.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {event.time && ` • ${event.time}`}
                </p>
              )}
              {event.venueName && <p className="mt-1 font-medium">{event.venueName}</p>}
              {event.venueAddress && (
                <p className="mt-1 text-sm text-gray-500">{event.venueAddress}</p>
              )}
              {/* Maps deeplinks */}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {event.mapsUrl && (
                  <a
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm text-white"
                    style={{ backgroundColor: primary }}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Google Maps
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
          ))}
        </StaggerChildren>
      </section>

      {/* Story */}
      {story && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-sm uppercase tracking-widest" style={{ color: primary }}>
            Kisah Kami
          </h2>
          <AnimateIn direction="left">
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{story}</p>
          </AnimateIn>
        </section>
      )}

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-16">
          <h2
            className="mb-8 text-center text-sm uppercase tracking-widest"
            style={{ color: primary }}
          >
            Galeri
          </h2>
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto grid max-w-4xl grid-cols-2 gap-2 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-lg object-cover cursor-pointer"
          />
        </section>
      )}

      {/* Quote */}
      {quote && (
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <p className="text-xl italic text-gray-600">"{quote}"</p>
          {content.quoteAuthor && (
            <p className="mt-3 text-sm text-gray-400">— {content.quoteAuthor}</p>
          )}
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

      {/* Share */}
      {!preview && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-sm uppercase tracking-widest" style={{ color: primary }}>
            Bagikan Undangan
          </h2>
          <ShareBar
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            primaryColor={primary}
          />
        </section>
      )}

      {/* Thanks */}
      {thanksNote && (
        <section className="px-6 py-16 text-center text-white" style={{ backgroundColor: primary }}>
          <AnimateIn direction="none">
            <p className="mx-auto max-w-lg text-lg leading-relaxed">{thanksNote}</p>
            <p className="mt-6 font-bold text-xl">
              {hosts.groomName} & {hosts.brideName}
            </p>
          </AnimateIn>
        </section>
      )}
    </div>
  );
}
