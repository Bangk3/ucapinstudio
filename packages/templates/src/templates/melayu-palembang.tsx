"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { DigitalAmplop } from "../components/digital-amplop";
import { GalleryLightbox } from "../components/gallery-lightbox";
import { LoveTimeline } from "../components/love-timeline";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import {
  CornerOrnament,
  CrownFlourish,
  PaperTexture,
  PortraitFrame,
} from "../components/ornaments";
import { PoweredByDevLab } from "../components/powered-by";
import { QuickNav, type QuickNavItem } from "../components/quick-nav";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

const bg = "#fdf8ee";
const surface = "#ffffff";
const text = "#3f2618";
const muted = "#8a6f52";
const accentGreen = "#1f6b4a";

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];

/* Songket Melayu motif row — pucuk rebung (bamboo-shoot) triangle weave */
function SongketMelayuRow({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 20" className="mx-auto h-5 w-full max-w-md" aria-hidden="true">
      {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map((x) => (
        <path
          key={x}
          d={`M${x + 4} 16 L${x + 10} 4 L${x + 16} 16 Z`}
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function MelayuPalembang({ data, preview }: TemplateProps) {
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

  const primary = theme.primaryColor ?? "#9c1f2e";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-serif"
      style={{ backgroundColor: bg, color: text }}
    >
      <PaperTexture opacity={0.05} />

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
      <section
        id="beranda"
        className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      >
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        <div className="pointer-events-none absolute inset-6 z-10" aria-hidden="true">
          <div className="absolute top-0 left-0">
            <CornerOrnament variant="songket-melayu" color={primary} corner="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerOrnament variant="songket-melayu" color={primary} corner="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerOrnament variant="songket-melayu" color={primary} corner="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerOrnament variant="songket-melayu" color={primary} corner="bottom-right" />
          </div>
        </div>
        <div className="relative z-10 w-full space-y-5">
          <SongketMelayuRow color={primary} />
          {guestName && (
            <p className="mt-2 text-sm uppercase tracking-[0.3em]" style={{ color: muted }}>
              Kepada Yth. {guestName}
            </p>
          )}
          <p className="text-xs uppercase tracking-[0.4em]" style={{ color: primary }}>
            Undangan Pernikahan
          </p>
          <CrownFlourish color={primary} />
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            {hosts.groomName}
            <span className="block my-2 text-3xl font-light italic" style={{ color: accentGreen }}>
              &amp;
            </span>
            {hosts.brideName}
          </h1>
          <p className="text-sm italic" style={{ color: muted }}>
            {hosts.groomParents ?? ""} &amp; {hosts.brideParents ?? ""}
          </p>
          {events[0]?.date && (
            <AnimateIn delay={0.5} direction="up">
              <p className="mt-4" style={{ color: muted }}>
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
          <SongketMelayuRow color={primary} />
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
      <section id="mempelai" className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="mb-8 text-xs uppercase tracking-widest" style={{ color: primary }}>
          Mempelai
        </p>
        <AnimateIn direction="up">
          <div
            className="grid items-start gap-4 text-center"
            style={{ gridTemplateColumns: "1fr auto 1fr" }}
          >
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.groomPhotoUrl !== undefined ? { src: hosts.groomPhotoUrl } : {})}
                alt={hosts.groomName}
                color={primary}
                variant="songket-melayu"
              />
              <div>
                <p className="font-bold" style={{ color: text }}>
                  {hosts.groomFull ?? hosts.groomName}
                </p>
                {hosts.groomParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    {hosts.groomParents}
                  </p>
                )}
              </div>
            </div>
            <span className="pt-16 text-2xl italic" style={{ color: accentGreen }}>
              &amp;
            </span>
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.bridePhotoUrl !== undefined ? { src: hosts.bridePhotoUrl } : {})}
                alt={hosts.brideName}
                color={primary}
                variant="songket-melayu"
              />
              <div>
                <p className="font-bold" style={{ color: text }}>
                  {hosts.brideFull ?? hosts.brideName}
                </p>
                {hosts.brideParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    {hosts.brideParents}
                  </p>
                )}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* Events */}
      <section id="acara" className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-sm uppercase tracking-widest"
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
                  borderColor: `${primary}44`,
                  borderLeft: `3px solid ${primary}`,
                }}
              >
                <h3 className="text-xl font-bold" style={{ color: primary }}>
                  {event.name}
                </h3>
                {event.date && (
                  <p className="mt-2" style={{ color: muted }}>
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {event.time && ` • ${event.time}`}
                  </p>
                )}
                {event.venueName && (
                  <p className="mt-1 font-medium" style={{ color: text }}>
                    {event.venueName}
                  </p>
                )}
                {event.venueAddress && (
                  <p className="mt-1 text-sm" style={{ color: muted }}>
                    {event.venueAddress}
                  </p>
                )}
                {event.dressCode && (
                  <p className="mt-2 text-xs" style={{ color: muted }}>
                    Dresscode: {event.dressCode}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: primary, color: bg }}
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
          <h2 className="mb-6 text-sm uppercase tracking-widest" style={{ color: primary }}>
            Kisah Kami
          </h2>
          <AnimateIn direction="left">
            <p className="leading-relaxed whitespace-pre-line" style={{ color: muted }}>
              {story}
            </p>
          </AnimateIn>
        </section>
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
        <section id="galeri" className="px-4 py-16">
          <h2
            className="mb-8 text-center text-sm uppercase tracking-widest"
            style={{ color: primary }}
          >
            Galeri
          </h2>
          <GalleryLightbox
            urls={galleryUrls}
            gridClassName="mx-auto grid max-w-4xl grid-cols-2 gap-2 md:grid-cols-3"
            itemClassName="aspect-square w-full rounded-sm object-cover opacity-90 cursor-pointer"
          />
        </section>
      )}

      {/* Quote */}
      {quote && (
        <section className="mx-auto max-w-xl px-6 py-16 text-center">
          <p className="text-xl italic" style={{ color: text }}>
            "{quote}"
          </p>
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
              className="mb-6 text-center text-sm uppercase tracking-widest"
              style={{ color: primary }}
            >
              Konfirmasi Kehadiran
            </h2>
            <RsvpForm
              invitationId={data.id}
              primaryColor={primary}
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface={text}
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
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface={text}
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
      <section className="px-6 py-16 text-center" style={{ backgroundColor: surface }}>
        <AnimateIn direction="none">
          <p className="mx-auto max-w-lg text-lg leading-relaxed" style={{ color: text }}>
            {thanksNote ??
              "Merupakan kehormatan bagi kami jika Bapak/Ibu/Saudara/i berkenan hadir."}
          </p>
          <p className="mt-6 text-xl font-bold" style={{ color: primary }}>
            {hosts.groomName} &amp; {hosts.brideName}
          </p>
        </AnimateIn>
      </section>

      {opened && (
        <QuickNav
          items={QUICK_NAV_ITEMS.filter(
            (item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0,
          )}
          color={primary}
          bg="rgba(253,248,238,0.9)"
        />
      )}

      <PoweredByDevLab />
    </div>
  );
}
