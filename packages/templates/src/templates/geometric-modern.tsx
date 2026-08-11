"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { PoweredByDevLab } from "../components/powered-by";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

const bg = "#fafafa";
const surface = "#ffffff";
const text = "#1a1a1a";
const muted = "#8a8a8a";

/* Bold geometric corner marks — editorial grid feel */
function CornerMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden="true">
      <path d="M4 4 L36 4 M4 4 L4 36" stroke={color} strokeWidth="3" fill="none" />
    </svg>
  );
}

export function GeometricModern({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const {
    hosts,
    events,
    story,
    quote,
    quoteAuthor,
    thanksNote,
    galleryUrls,
    musicUrl,
    musicTitle,
  } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#2f4f4f";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: "'Space Grotesk', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Opening screen */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          {...(guestName !== undefined ? { guestName } : {})}
          primaryColor={primary}
          bgColor={bg}
          fgColor={text}
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
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        {/* Diagonal grid lines — editorial */}
        {!preview && (
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <pattern id="geo-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path
                  d="M48 0 L0 48 M0 0 L48 48"
                  stroke={primary}
                  strokeWidth="0.5"
                  opacity="0.12"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo-grid)" />
          </svg>
        )}

        <div className="relative z-10 space-y-5">
          {guestName && (
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
              Kepada Yth. {guestName}
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <CornerMark color={primary} />
            <p className="text-xs uppercase tracking-[0.4em] font-bold" style={{ color: primary }}>
              Undangan Pernikahan
            </p>
            <CornerMark color={primary} />
          </div>
          <h1 className="text-5xl font-bold leading-tight md:text-6xl tracking-tight">
            {hosts.groomName}
            <span className="block text-3xl font-light my-2" style={{ color: primary }}>
              &amp;
            </span>
            {hosts.brideName}
          </h1>
          <p className="text-sm text-gray-500 italic">
            {hosts.groomParents ?? ""} &amp; {hosts.brideParents ?? ""}
          </p>
          {events[0]?.date && (
            <AnimateIn delay={0.5} direction="up">
              <p className="mt-4 text-gray-600">
                {new Date(events[0].date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </AnimateIn>
          )}
          {events[0]?.date && !preview && (
            <AnimateIn delay={0.7} direction="up">
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

      {/* Couple */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest font-bold mb-8" style={{ color: primary }}>
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
            textColor={text}
            mutedColor={muted}
            slideBg={surface}
          />
        </AnimateIn>
      </section>

      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-xs uppercase tracking-widest font-bold"
          style={{ color: primary }}
        >
          Rangkaian Acara
        </h2>
        <div className="space-y-6">
          {events.map((event) => (
            <AnimateIn key={event.id} direction="up">
              <div
                className="rounded-sm border p-6 text-center"
                style={{
                  backgroundColor: surface,
                  borderColor: "#e5e5e5",
                  borderTop: `4px solid ${primary}`,
                }}
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
                {event.dressCode && (
                  <p className="mt-2 text-xs text-gray-500">Dresscode: {event.dressCode}</p>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm text-white"
                      style={{ backgroundColor: primary }}
                    >
                      Google Maps
                    </a>
                  )}
                  {event.lat !== undefined && event.lng !== undefined && (
                    <a
                      href={`https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm border px-4 py-1.5 text-sm"
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
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2
            className="mb-6 text-xs uppercase tracking-widest font-bold"
            style={{ color: primary }}
          >
            Kisah Kami
          </h2>
          <AnimateIn direction="left">
            <p className="leading-relaxed whitespace-pre-line">{story}</p>
          </AnimateIn>
        </section>
      )}

      {/* Love story timeline */}
      {content.timeline && content.timeline.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h2
            className="mb-8 text-center text-xs uppercase tracking-widest font-bold"
            style={{ color: primary }}
          >
            Perjalanan Cinta
          </h2>
          <LoveTimeline items={content.timeline} primaryColor={primary} />
        </section>
      )}

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-16">
          <h2
            className="mb-8 text-center text-xs uppercase tracking-widest font-bold"
            style={{ color: primary }}
          >
            Galeri
          </h2>
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto grid max-w-4xl grid-cols-2 gap-2 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-sm object-cover cursor-pointer"
          />
        </section>
      )}

      {/* Quote */}
      {quote && (
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <p className="text-xl italic">"{quote}"</p>
          {quoteAuthor && (
            <p className="mt-3 text-sm" style={{ color: muted }}>
              — {quoteAuthor}
            </p>
          )}
        </section>
      )}

      {/* Digital Amplop */}
      {content.amplop && (
        <section className="mx-auto max-w-xl px-6 py-16">
          <DigitalAmplop amplop={content.amplop} primaryColor={primary} />
        </section>
      )}

      {/* RSVP */}
      {data.rsvpEnabled && !preview && (
        <AnimateIn direction="up">
          <section className="mx-auto max-w-2xl px-6 py-16">
            <h2
              className="mb-6 text-center text-xs uppercase tracking-widest font-bold"
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
              className="mb-6 text-center text-xs uppercase tracking-widest font-bold"
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
          <h2
            className="mb-6 text-xs uppercase tracking-widest font-bold"
            style={{ color: primary }}
          >
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
      <section className="px-6 py-16 text-center text-white" style={{ backgroundColor: primary }}>
        <AnimateIn direction="none">
          <p className="mx-auto max-w-lg text-lg leading-relaxed">
            {thanksNote ??
              "Merupakan kehormatan bagi kami jika Bapak/Ibu/Saudara/i berkenan hadir."}
          </p>
          <p className="mt-6 font-bold text-xl">
            {hosts.groomName} &amp; {hosts.brideName}
          </p>
        </AnimateIn>
      </section>

      <PoweredByDevLab />
    </div>
  );
}
