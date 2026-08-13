"use client";

import { motion, useScroll, useSpring } from "framer-motion";
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

const bg = "#0c0c0e";
const surface = "#16161a";
const onSurface = "#e8e6e1";

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];

/* Gold foil shimmer text — editorial serif, "old money" */
function FoilText({
  children,
  color,
  preview,
}: {
  children: React.ReactNode;
  color: string;
  preview?: boolean;
}) {
  return (
    <span
      style={
        preview
          ? { color, fontFamily: "'Playfair Display', Georgia, serif" }
          : {
              fontFamily: "'Playfair Display', Georgia, serif",
              background: `linear-gradient(110deg, ${color} 0%, #f5e3a0 25%, ${color} 50%, #f5e3a0 75%, ${color} 100%)`,
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "foilShimmer 4s linear infinite",
            }
      }
    >
      {children}
    </span>
  );
}

export function DarkLuxury({ data, preview }: TemplateProps) {
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

  const primary = theme.primaryColor ?? "#c9a84c";

  /* Page-level scroll for progress bar */
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: bg,
        color: onSurface,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <PaperTexture opacity={0.05} />
      <style>{`
        @keyframes foilShimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Scroll progress bar — fixed left */}
      {!preview && (
        <motion.div
          style={{ position: "fixed", top: 0, left: 0, width: 2, height: "100vh", zIndex: 50 }}
        >
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: primary,
              scaleY: smoothProgress,
              transformOrigin: "top",
            }}
          />
        </motion.div>
      )}

      {/* Opening screen */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          {...(guestName !== undefined ? { guestName } : {})}
          primaryColor={primary}
          bgColor={bg}
          fgColor={onSurface}
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
        className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
      >
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        {/* Thin gold frame — luxury border */}
        <div
          className="pointer-events-none absolute inset-4 z-10 rounded-sm"
          style={{ border: `1px solid ${primary}55` }}
          aria-hidden="true"
        />
        {/* Corner flourishes */}
        <div className="pointer-events-none absolute inset-6 z-10" aria-hidden="true">
          <div className="absolute top-0 left-0">
            <CornerOrnament variant="gold-line" color={primary} corner="top-left" />
          </div>
          <div className="absolute top-0 right-0">
            <CornerOrnament variant="gold-line" color={primary} corner="top-right" />
          </div>
          <div className="absolute bottom-0 left-0">
            <CornerOrnament variant="gold-line" color={primary} corner="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0">
            <CornerOrnament variant="gold-line" color={primary} corner="bottom-right" />
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          {guestName && (
            <p className="text-sm uppercase tracking-[0.35em] text-gray-400">
              Kepada Yth. {guestName}
            </p>
          )}
          <p className="text-xs uppercase tracking-[0.5em]" style={{ color: primary }}>
            Undangan Pernikahan
          </p>
          <CrownFlourish color={primary} />
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            <FoilText color={primary} preview={Boolean(preview)}>
              {hosts.groomName}
            </FoilText>
            <span className="block text-3xl font-light italic my-2" style={{ color: primary }}>
              &amp;
            </span>
            <FoilText color={primary} preview={Boolean(preview)}>
              {hosts.brideName}
            </FoilText>
          </h1>
          <p className="text-sm text-gray-400 italic">
            {hosts.groomParents ?? ""} &amp; {hosts.brideParents ?? ""}
          </p>
          {events[0]?.date && (
            <AnimateIn delay={0.5} direction="up">
              <p className="mt-4 text-gray-300">
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
      <section id="mempelai" className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest mb-8" style={{ color: primary }}>
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
                variant="gold-line"
              />
              <div>
                <p className="font-bold" style={{ color: onSurface }}>
                  {hosts.groomFull ?? hosts.groomName}
                </p>
                {hosts.groomParents && (
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {hosts.groomParents}
                  </p>
                )}
              </div>
            </div>
            <span className="pt-16 text-2xl italic" style={{ color: primary }}>
              &amp;
            </span>
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.bridePhotoUrl !== undefined ? { src: hosts.bridePhotoUrl } : {})}
                alt={hosts.brideName}
                color={primary}
                variant="gold-line"
              />
              <div>
                <p className="font-bold" style={{ color: onSurface }}>
                  {hosts.brideFull ?? hosts.brideName}
                </p>
                {hosts.brideParents && (
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
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
          className="mb-10 text-center text-xs uppercase tracking-widest"
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
                  <p className="mt-2 text-gray-300">
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
                  <p className="mt-1 font-medium text-white">{event.venueName}</p>
                )}
                {event.venueAddress && (
                  <p className="mt-1 text-sm text-gray-400">{event.venueAddress}</p>
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
                      className="inline-flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm font-medium text-black"
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
          <h2 className="mb-6 text-xs uppercase tracking-widest" style={{ color: primary }}>
            Kisah Kami
          </h2>
          <AnimateIn direction="left">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{story}</p>
          </AnimateIn>
        </section>
      )}

      {/* Love story timeline */}
      {content.timeline && content.timeline.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h2
            className="mb-8 text-center text-xs uppercase tracking-widest"
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
            className="mb-8 text-center text-xs uppercase tracking-widest"
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
          <p className="text-xl italic text-gray-200">"{quote}"</p>
          {quoteAuthor && <p className="mt-3 text-sm text-gray-500">— {quoteAuthor}</p>}
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
              className="mb-6 text-center text-xs uppercase tracking-widest"
              style={{ color: primary }}
            >
              Konfirmasi Kehadiran
            </h2>
            <RsvpForm
              invitationId={data.id}
              primaryColor={primary}
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface={onSurface}
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
              className="mb-6 text-center text-xs uppercase tracking-widest"
              style={{ color: primary }}
            >
              Buku Tamu
            </h2>
            <WishesSection
              invitationId={data.id}
              primaryColor={primary}
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface={onSurface}
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </AnimateIn>
      )}

      {/* Share */}
      {!preview && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-xs uppercase tracking-widest" style={{ color: primary }}>
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
          <p className="mx-auto max-w-lg text-lg text-gray-200 leading-relaxed">
            {thanksNote ??
              "Merupakan kehormatan bagi kami jika Bapak/Ibu/Saudara/i berkenan hadir."}
          </p>
          <p className="mt-6 font-bold text-xl" style={{ color: primary }}>
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
          bg="rgba(22,22,26,0.85)"
        />
      )}

      <PoweredByDevLab />
    </div>
  );
}
