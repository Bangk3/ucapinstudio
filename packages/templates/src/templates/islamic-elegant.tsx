"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { AddToCalendar } from "../components/add-to-calendar";
import { AnimateIn } from "../components/animate-in";
import { Countdown } from "../components/countdown";
import { CoupleCarousel } from "../components/couple-carousel";
import { MusicPlayer } from "../components/music-player";
import { OpeningScreen } from "../components/opening-screen";
import { RsvpForm } from "../components/rsvp-form";
import { ShareBar } from "../components/share-bar";
import { WishesSection } from "../components/wishes-section";
import type { TemplateProps } from "../types";

export function IslamicElegant({ data, preview }: TemplateProps) {
  const { content, theme, guestName } = data;
  const { hosts, events, thanksNote, galleryUrls, musicUrl, musicTitle } = content;
  const [opened, setOpened] = useState(preview);

  const primary = theme.primaryColor ?? "#c9a84c";
  const bg = "#0f1b2d";
  const surface = "#162235";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: bg, color: "#e8dcc8", fontFamily: "'Georgia', serif" }}
    >
      {/* Keyframe animations — only injected for real (non-preview) views */}
      {!preview && (
        <style>{`
          @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.7; }
            50%       { opacity: 1; }
          }
        `}</style>
      )}

      {/* Opening screen */}
      {!opened && (
        <OpeningScreen
          groomName={hosts.groomName}
          brideName={hosts.brideName}
          primaryColor={primary}
          bgColor={bg}
          fgColor="#e8dcc8"
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

      {/* Bismillah banner */}
      <AnimateIn direction="none">
        <div className="py-6 text-center" style={{ backgroundColor: surface }}>
          <p
            className="text-2xl"
            style={
              !preview
                ? {
                    fontFamily: "serif",
                    background: `linear-gradient(90deg, ${primary} 0%, #ffd700 40%, ${primary} 60%, #ffd700 100%)`,
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "shimmer 3s linear infinite",
                  }
                : { color: primary, fontFamily: "serif" }
            }
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>
          <p className="mt-1 text-xs text-gray-400 tracking-widest">BISMILLAHIRRAHMANIRRAHIM</p>
        </div>
      </AnimateIn>

      {/* Hero */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {theme.coverPhotoUrl && (
          <img
            src={theme.coverPhotoUrl}
            alt="Cover"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        <div className="relative z-10 space-y-6">
          {guestName && <p className="text-sm text-gray-400">Kepada Yth. {guestName}</p>}

          {/* Ornament — floating */}
          {!preview ? (
            <motion.div
              className="text-4xl"
              style={{ color: primary }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
            >
              ✦ ✦ ✦
            </motion.div>
          ) : (
            <div className="text-4xl" style={{ color: primary }}>
              ✦ ✦ ✦
            </div>
          )}

          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Undangan Pernikahan</p>

          <div>
            {/* Groom name — clip-path curtain reveal */}
            {opened && !preview ? (
              <motion.h1
                className="text-5xl font-bold md:text-6xl"
                style={{ color: primary }}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 1.0, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
              >
                {hosts.groomName}
              </motion.h1>
            ) : (
              <h1 className="text-5xl font-bold md:text-6xl" style={{ color: primary }}>
                {hosts.groomName}
              </h1>
            )}

            <p className="my-3 text-gray-400 italic">putra dari {hosts.groomParents ?? "..."}</p>

            {/* ☽ ☆ ☾ ornament — floating */}
            {!preview ? (
              <motion.div
                className="text-3xl"
                style={{ color: primary }}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
              >
                ☽ ☆ ☾
              </motion.div>
            ) : (
              <div className="text-3xl" style={{ color: primary }}>
                ☽ ☆ ☾
              </div>
            )}

            {/* & symbol */}
            {opened && !preview ? (
              <motion.div
                className="text-3xl my-2"
                style={{ color: primary }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                &amp;
              </motion.div>
            ) : null}

            {/* Bride name — clip-path curtain reveal */}
            {opened && !preview ? (
              <motion.h1
                className="text-5xl font-bold md:text-6xl mt-3"
                style={{ color: primary }}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 1.0, delay: 1.2, ease: [0.76, 0, 0.24, 1] }}
              >
                {hosts.brideName}
              </motion.h1>
            ) : (
              <h1 className="text-5xl font-bold md:text-6xl mt-3" style={{ color: primary }}>
                {hosts.brideName}
              </h1>
            )}
            <p className="mt-3 text-gray-400 italic">putri dari {hosts.brideParents ?? "..."}</p>
          </div>
          {events[0]?.date && (
            <p className="mt-4 text-base text-gray-300">
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
      <AnimateIn direction="up">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="text-center mb-8">
            <div className="text-xl mb-2" style={{ color: primary }}>
              ✦
            </div>
            <h2 className="text-xs uppercase tracking-widest text-gray-400">Mempelai</h2>
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
            textColor="#e8dcc8"
            mutedColor="rgba(255,255,255,0.4)"
            slideBg={surface}
            groomLabel="Putra"
            brideLabel="Putri"
          />
        </section>
      </AnimateIn>

      {/* Ayat */}
      <AnimateIn direction="up">
        <section
          className="mx-auto max-w-xl px-6 py-16 text-center"
          style={{ backgroundColor: surface }}
        >
          <p className="text-2xl leading-loose mb-4" style={{ color: primary, direction: "rtl" }}>
            وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا
          </p>
          <p className="text-sm text-gray-400 italic">
            "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari
            jenismu sendiri..."
          </p>
          <p className="mt-2 text-xs text-gray-500">QS. Ar-Rum: 21</p>
        </section>
      </AnimateIn>

      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center mb-10">
          <div className="text-2xl mb-2" style={{ color: primary }}>
            ✦
          </div>
          <h2 className="text-xs uppercase tracking-widest text-gray-400">Rangkaian Acara</h2>
        </div>
        <div className="space-y-6">
          {events.map((event, idx) => (
            <AnimateIn key={event.id} direction="up" delay={idx * 0.15}>
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: surface, borderLeft: `3px solid ${primary}` }}
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
                  <p className="mt-2 text-white font-medium">{event.venueName}</p>
                )}
                {event.venueAddress && (
                  <p className="text-sm text-gray-400 mt-1">{event.venueAddress}</p>
                )}
                {event.dressCode && (
                  <p className="mt-2 text-xs text-gray-500">Dresscode: {event.dressCode}</p>
                )}
                {/* Maps deeplinks */}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium text-black"
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
                      className="inline-flex items-center gap-1.5 rounded border px-4 py-1.5 text-sm"
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
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 md:grid-cols-3">
            {galleryUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="aspect-square w-full rounded-lg object-cover opacity-90"
              />
            ))}
          </div>
        </section>
      )}

      {/* Share */}
      {!preview && (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="mb-6 text-xs uppercase tracking-widest text-gray-400">Bagikan Undangan</h2>
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
              cardBg={surface}
              cardBorder={`${primary}33`}
              onSurface="#e8dcc8"
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
              onSurface="#e8dcc8"
              {...(data.guestId !== undefined ? { guestId: data.guestId } : {})}
              {...(guestName !== undefined ? { guestName } : {})}
            />
          </section>
        </AnimateIn>
      )}

      {/* Closing */}
      <AnimateIn direction="none">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: surface }}>
          <div className="text-3xl mb-4" style={{ color: primary }}>
            ✦ ✦ ✦
          </div>
          <p className="text-gray-300 max-w-lg mx-auto leading-relaxed">
            {thanksNote ??
              "Merupakan kehormatan dan kebahagiaan bagi kami jika Bapak/Ibu/Saudara/i berkenan hadir."}
          </p>
          <p className="mt-8 font-bold text-xl" style={{ color: primary }}>
            {hosts.groomName} &amp; {hosts.brideName}
          </p>
          <p className="mt-4 text-gray-500 text-sm">وَاللَّهُ وَلِيُّ التَّوْفِيق</p>
        </section>
      </AnimateIn>
    </div>
  );
}
