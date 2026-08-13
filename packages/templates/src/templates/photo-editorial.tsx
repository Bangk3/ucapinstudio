"use client";
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

const bg = "#ffffff";
const surface = "#f7f7f5";
const text = "#111111";
const muted = "#767676";

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  { id: "beranda", icon: "home", label: "Beranda" },
  { id: "mempelai", icon: "couple", label: "Mempelai" },
  { id: "acara", icon: "location", label: "Acara" },
  { id: "galeri", icon: "gallery", label: "Galeri" },
];

/* Magazine-style kicker — small caps with rule */
function Kicker({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-8" style={{ backgroundColor: color }} />
      <span className="text-xs uppercase tracking-[0.35em]" style={{ color }}>
        {children}
      </span>
      <span className="h-px w-8" style={{ backgroundColor: color }} />
    </div>
  );
}

export function PhotoEditorial({ data, preview }: TemplateProps) {
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

  const primary = theme.primaryColor ?? "#b02a30";
  const heroPhoto = theme.coverPhotoUrl ?? hosts.groomPhotoUrl ?? hosts.bridePhotoUrl;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: "'Bodoni Moda', Georgia, serif" }}
    >
      <PaperTexture opacity={0.04} />

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

      {/* Hero — split layout, magazine cover */}
      <section id="beranda" className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
        {/* Photo side */}
        <div className="relative min-h-[50dvh] md:min-h-dvh overflow-hidden">
          {heroPhoto ? (
            <img
              src={heroPhoto}
              alt="Hero"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: surface }}
            >
              <p className="text-6xl" style={{ color: primary }}>
                {hosts.groomName[0]}&amp;{hosts.brideName[0]}
              </p>
            </div>
          )}
          <div
            className="absolute bottom-6 left-6 text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
          >
            <p className="text-xs uppercase tracking-[0.35em]">Save the Date</p>
            {events[0]?.date && (
              <p className="mt-1 text-2xl font-bold">
                {new Date(events[0].date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Typography side */}
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          {guestName && (
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gray-500">
              Kepada Yth. {guestName}
            </p>
          )}
          <Kicker color={primary}>Wedding Invitation</Kicker>
          <CrownFlourish color={primary} />
          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
            {hosts.groomName}
            <span className="block text-3xl font-light italic my-2" style={{ color: primary }}>
              &amp;
            </span>
            {hosts.brideName}
          </h1>
          <p className="mt-4 text-sm text-gray-500 italic">
            {hosts.groomParents ?? ""} &amp; {hosts.brideParents ?? ""}
          </p>
          {events[0]?.date && (
            <AnimateIn delay={0.5} direction="up">
              <p className="mt-6 text-gray-600">
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
      </section>

      {/* Couple */}
      <section id="mempelai" className="relative mx-auto max-w-2xl px-6 py-20 text-center">
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
        <Kicker color={primary}>Mempelai</Kicker>
        <div className="relative z-20 mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <AnimateIn direction="up">
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.groomPhotoUrl !== undefined ? { src: hosts.groomPhotoUrl } : {})}
                alt={hosts.groomName}
                color={primary}
                variant="gold-line"
              />
              <div>
                <p className="font-bold">{hosts.groomFull ?? hosts.groomName}</p>
                {hosts.groomParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    Putra dari {hosts.groomParents}
                  </p>
                )}
              </div>
            </div>
          </AnimateIn>
          <AnimateIn direction="up">
            <div className="flex flex-col items-center gap-3">
              <PortraitFrame
                {...(hosts.bridePhotoUrl !== undefined ? { src: hosts.bridePhotoUrl } : {})}
                alt={hosts.brideName}
                color={primary}
                variant="gold-line"
              />
              <div>
                <p className="font-bold">{hosts.brideFull ?? hosts.brideName}</p>
                {hosts.brideParents && (
                  <p className="text-sm" style={{ color: muted }}>
                    Putri dari {hosts.brideParents}
                  </p>
                )}
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Events */}
      <section id="acara" className="mx-auto max-w-2xl px-6 py-16">
        <Kicker color={primary}>Rangkaian Acara</Kicker>
        <div className="mt-10 space-y-6">
          {events.map((event) => (
            <AnimateIn key={event.id} direction="up">
              <div
                className="border p-6 text-center"
                style={{ borderColor: "#e5e5e5", backgroundColor: surface }}
              >
                <h3 className="text-2xl font-bold">{event.name}</h3>
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
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm text-white"
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
                      className="inline-flex items-center gap-1.5 border px-4 py-1.5 text-sm"
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
          <Kicker color={primary}>Kisah Kami</Kicker>
          <AnimateIn direction="left">
            <p className="mt-6 leading-relaxed whitespace-pre-line">{story}</p>
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
        <section id="galeri" className="px-4 py-16">
          <Kicker color={primary}>Galeri</Kicker>
          <div className="mt-8">
            <GalleryLightbox
              urls={galleryUrls}
              gridClassName="mx-auto grid max-w-4xl grid-cols-2 gap-2 md:grid-cols-3"
              itemClassName="aspect-square w-full object-cover cursor-pointer"
            />
          </div>
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

      {opened && (
        <QuickNav
          items={QUICK_NAV_ITEMS.filter(
            (item) => item.id !== "galeri" || (galleryUrls?.length ?? 0) > 0,
          )}
          color={primary}
          bg="rgba(255,255,255,0.92)"
        />
      )}

      <PoweredByDevLab />
    </div>
  );
}
