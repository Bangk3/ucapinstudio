"use client";

import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { DigitalAmplop } from "../components/digital-amplop";
import { MapEmbed } from "../components/map-embed";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { PoweredByDevLab } from "../components/powered-by";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import { getAnimationConfig } from "../composer/animation-presets";
import { GalleryMasonry } from "../composer/blocks/gallery-1";
import { GalleryCarousel } from "../composer/blocks/gallery-2";
import { GalleryPolaroid } from "../composer/blocks/gallery-3";
import { HeroCentered } from "../composer/blocks/hero-1";
import { HeroSplit } from "../composer/blocks/hero-2";
import { HeroBotanical } from "../composer/blocks/hero-3";
import { StoryProse } from "../composer/blocks/story-1";
import { StoryTimeline } from "../composer/blocks/story-2";
import { ComposerDivider } from "../composer/divider";
import type { ComposerRecipe, ComposerSection, TemplateProps } from "../types";

const DEFAULT_RECIPE: ComposerRecipe = {
  version: 1,
  heroVariant: 1,
  galleryVariant: 1,
  storyVariant: 1,
  animationPreset: "soft-fade",
  dividerStyle: "geometric",
  sections: [
    { type: "hero", enabled: true },
    { type: "couple", enabled: true },
    { type: "countdown", enabled: true },
    { type: "events", enabled: true },
    { type: "story", enabled: true },
    { type: "gallery", enabled: true },
    { type: "amplop", enabled: true },
    { type: "rsvp", enabled: true },
    { type: "wishes", enabled: true },
  ],
};

export function ComposerDynamic({ data, preview }: TemplateProps) {
  const { content, theme, guestName, guestId, rsvpEnabled, wishesEnabled } = data;
  const {
    hosts,
    events,
    story,
    quote,
    quoteAuthor,
    galleryUrls,
    musicUrl,
    musicTitle,
    timeline,
    amplop,
  } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#c4826a";
  const rawRecipe = content.composerRecipe ?? DEFAULT_RECIPE;

  // Backfill: legacy recipes (generated before countdown support) lack
  // the countdown section. Insert it after "couple" so existing invitations
  // get the countdown without DB migration or AI re-generation.
  const r: ComposerRecipe = (() => {
    const hasCountdown = rawRecipe.sections.some((s) => s.type === "countdown");
    if (hasCountdown) return rawRecipe;
    const coupleIdx = rawRecipe.sections.findIndex((s) => s.type === "couple");
    const insertAt = coupleIdx >= 0 ? coupleIdx + 1 : 0;
    const sections = [...rawRecipe.sections];
    sections.splice(insertAt, 0, { type: "countdown", enabled: true });
    return { ...rawRecipe, sections };
  })();

  // Unused but referenced for side-effect (prevents tree-shaking of animation config in dev)
  void getAnimationConfig(r.animationPreset);

  const enabledSections = r.sections.filter((s) => s.enabled);

  function renderSection(section: ComposerSection) {
    switch (section.type) {
      case "hero":
        return (
          <section key="hero">
            {r.heroVariant === 1 && (
              <HeroCentered
                hosts={hosts}
                events={events}
                theme={theme}
                {...(guestName !== undefined ? { guestName } : {})}
                {...(preview !== undefined ? { preview } : {})}
              />
            )}
            {r.heroVariant === 2 && (
              <HeroSplit
                hosts={hosts}
                events={events}
                theme={theme}
                {...(story !== undefined ? { story } : {})}
                {...(guestName !== undefined ? { guestName } : {})}
                {...(preview !== undefined ? { preview } : {})}
              />
            )}
            {r.heroVariant === 3 && (
              <HeroBotanical
                hosts={hosts}
                events={events}
                theme={theme}
                {...(guestName !== undefined ? { guestName } : {})}
                {...(preview !== undefined ? { preview } : {})}
              />
            )}
          </section>
        );

      case "couple":
        return (
          <section key="couple" className="mx-auto max-w-2xl w-full px-6 py-12">
            <AnimateIn direction="up" delay={0}>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold mb-8"
                style={{ color: primary, opacity: 0.7 }}
              >
                Mempelai
              </p>
            </AnimateIn>
            <AnimateIn direction="up" delay={0.1}>
              <CoupleCarousel
                groomName={hosts.groomName}
                brideName={hosts.brideName}
                {...(hosts.groomFull !== undefined ? { groomFull: hosts.groomFull } : {})}
                {...(hosts.brideFull !== undefined ? { brideFull: hosts.brideFull } : {})}
                {...(hosts.groomParents !== undefined ? { groomParents: hosts.groomParents } : {})}
                {...(hosts.brideParents !== undefined ? { brideParents: hosts.brideParents } : {})}
                {...(hosts.groomPhotoUrl !== undefined
                  ? { groomPhotoUrl: hosts.groomPhotoUrl }
                  : {})}
                {...(hosts.bridePhotoUrl !== undefined
                  ? { bridePhotoUrl: hosts.bridePhotoUrl }
                  : {})}
                primaryColor={primary}
              />
            </AnimateIn>
          </section>
        );

      case "countdown": {
        const firstEvent = events[0];
        if (!firstEvent?.date) return null;
        return (
          <section key="countdown" className="mx-auto max-w-xl w-full px-6 py-12">
            <AnimateIn direction="up" delay={0}>
              <Countdown
                targetDate={firstEvent.date}
                {...(firstEvent.time ? { targetTime: firstEvent.time } : {})}
                primaryColor={primary}
                label="Menuju Hari Bahagia"
              />
            </AnimateIn>
          </section>
        );
      }

      case "events":
        return (
          <section key="events" className="mx-auto max-w-2xl w-full px-6 py-10">
            <AnimateIn direction="up" delay={0}>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold mb-8"
                style={{ color: primary, opacity: 0.7 }}
              >
                Rangkaian Acara
              </p>
            </AnimateIn>
            <div className="space-y-8">
              {events.map((event, idx) => (
                <AnimateIn key={event.id} direction="up" delay={idx * 0.1}>
                  <div className="rounded-2xl border p-6 space-y-3 bg-white/60 backdrop-blur-sm shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base" style={{ color: primary }}>
                        {event.name}
                      </h3>
                      {event.dressCode && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border text-gray-500 shrink-0">
                          {event.dressCode}
                        </span>
                      )}
                    </div>
                    {event.date && (
                      <p className="text-sm text-gray-600">
                        {event.date}
                        {event.time ? ` · ${event.time}` : ""}
                      </p>
                    )}
                    {event.venueName && (
                      <p className="text-sm font-medium text-gray-700">{event.venueName}</p>
                    )}
                    {event.venueAddress && (
                      <p className="text-xs text-gray-500 leading-relaxed">{event.venueAddress}</p>
                    )}
                    {event.mapsUrl && (
                      <a
                        href={event.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ color: primary }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        Lihat Lokasi
                      </a>
                    )}
                    {event.lat !== undefined && event.lng !== undefined && (
                      <MapEmbed
                        lat={event.lat}
                        lng={event.lng}
                        {...(event.venueName !== undefined ? { venueName: event.venueName } : {})}
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
                    {event.livestreamUrl && (
                      <a
                        href={event.livestreamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ color: primary }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                        </svg>
                        Saksikan Live
                      </a>
                    )}
                  </div>
                </AnimateIn>
              ))}
            </div>
          </section>
        );

      case "story":
        return (
          <section key="story" className="w-full">
            {r.storyVariant === 1 ? (
              <StoryProse
                {...(story !== undefined ? { story } : {})}
                {...(quote !== undefined ? { quote } : {})}
                {...(quoteAuthor !== undefined ? { quoteAuthor } : {})}
                primaryColor={primary}
              />
            ) : (
              <StoryTimeline
                {...(story !== undefined ? { story } : {})}
                {...(quote !== undefined ? { quote } : {})}
                {...(quoteAuthor !== undefined ? { quoteAuthor } : {})}
                {...(timeline !== undefined ? { timeline } : {})}
                primaryColor={primary}
              />
            )}
          </section>
        );

      case "gallery":
        if (!galleryUrls || galleryUrls.length === 0) return null;
        return (
          <section key="gallery" className="w-full">
            <AnimateIn direction="up" delay={0}>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold mb-2"
                style={{ color: primary, opacity: 0.7 }}
              >
                Galeri
              </p>
            </AnimateIn>
            {r.galleryVariant === 1 && (
              <GalleryMasonry
                galleryUrls={galleryUrls}
                primaryColor={primary}
                {...(preview !== undefined ? { preview } : {})}
              />
            )}
            {r.galleryVariant === 2 && (
              <GalleryCarousel
                galleryUrls={galleryUrls}
                primaryColor={primary}
                {...(preview !== undefined ? { preview } : {})}
              />
            )}
            {r.galleryVariant === 3 && (
              <GalleryPolaroid
                galleryUrls={galleryUrls}
                primaryColor={primary}
                {...(preview !== undefined ? { preview } : {})}
              />
            )}
          </section>
        );

      case "amplop":
        if (!amplop) return null;
        return (
          <section key="amplop" className="mx-auto max-w-xl w-full px-6 py-10">
            <AnimateIn direction="up" delay={0}>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold mb-6"
                style={{ color: primary, opacity: 0.7 }}
              >
                Amplop Digital
              </p>
            </AnimateIn>
            <AnimateIn direction="up" delay={0.1}>
              <DigitalAmplop amplop={amplop} primaryColor={primary} />
            </AnimateIn>
          </section>
        );

      case "rsvp":
        if (!rsvpEnabled) return null;
        return (
          <section key="rsvp" className="mx-auto max-w-xl w-full px-6 py-10">
            <AnimateIn direction="up" delay={0}>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold mb-6"
                style={{ color: primary, opacity: 0.7 }}
              >
                RSVP
              </p>
            </AnimateIn>
            <AnimateIn direction="up" delay={0.1}>
              <RsvpForm
                invitationId={data.id}
                {...(guestId !== undefined ? { guestId } : {})}
                primaryColor={primary}
              />
            </AnimateIn>
          </section>
        );

      case "wishes":
        if (!wishesEnabled) return null;
        return (
          <section key="wishes" className="mx-auto max-w-xl w-full px-6 py-10">
            <AnimateIn direction="up" delay={0}>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-center font-semibold mb-6"
                style={{ color: primary, opacity: 0.7 }}
              >
                Ucapan &amp; Doa
              </p>
            </AnimateIn>
            <AnimateIn direction="up" delay={0.1}>
              <WishesSection invitationId={data.id} primaryColor={primary} />
            </AnimateIn>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-800">
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

      {/* Sections with dividers between them */}
      {enabledSections.map((section, idx) => (
        <div key={section.type}>
          {renderSection(section)}
          {idx < enabledSections.length - 1 && (
            <ComposerDivider type={r.dividerStyle} primaryColor={primary} />
          )}
        </div>
      ))}

      {/* Footer share bar */}
      {opened && (
        <footer className="py-10 px-6 text-center space-y-6">
          <ShareBar
            groomName={hosts.groomName}
            brideName={hosts.brideName}
            primaryColor={primary}
          />
          {content.thanksNote && (
            <p className="text-xs text-gray-400 italic max-w-sm mx-auto leading-relaxed">
              {content.thanksNote}
            </p>
          )}
          <p className="text-[10px] text-gray-300 uppercase tracking-widest">
            Dibuat dengan Invyte
          </p>
        </footer>
      )}

      <PoweredByDevLab />
    </div>
  );
}
