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
      {/* Floating petals CSS */}
      <style>{`
        @keyframes floatPetal {
          0%   { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(calc(100vh + 40px)) rotate(720deg) translateX(60px); opacity: 0; }
        }
      `}</style>

      {/* Floating petals (only when opened and not in preview) */}
      {opened && !preview && (
        <>
          {[
            { left: "10%", duration: "10s", delay: "0s", color: "#f9a8d4" },
            { left: "25%", duration: "13s", delay: "1.5s", color: "#fda4af" },
            { left: "40%", duration: "9s", delay: "3s", color: "#f9a8d4" },
            { left: "55%", duration: "12s", delay: "0.8s", color: "#fecdd3" },
            { left: "70%", duration: "14s", delay: "4.5s", color: "#fda4af" },
            { left: "85%", duration: "11s", delay: "2s", color: "#fecdd3" },
          ].map((petal, i) => (
            <div
              key={i}
              style={{
                position: "fixed",
                top: "-20px",
                left: petal.left,
                width: "12px",
                height: "16px",
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                backgroundColor: petal.color,
                opacity: 0.4,
                pointerEvents: "none",
                zIndex: 0,
                animation: `floatPetal ${petal.duration} ${petal.delay} infinite linear`,
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
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
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
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: primary }}>
            Mempelai
          </p>
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

      {/* Divider */}
      <motion.div
        className="mx-auto max-w-xs text-center py-4 text-2xl"
        style={{ color: primary }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4, ease: "easeInOut" }}
      >
        ✿ ✿ ✿
      </motion.div>

      {/* Events */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2
          className="mb-10 text-center text-xs uppercase tracking-widest"
          style={{ color: primary }}
        >
          Rangkaian Acara
        </h2>
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
          <p className="mb-4 text-xs uppercase tracking-widest" style={{ color: primary }}>
            Kisah Cinta
          </p>
          <p className="text-gray-700 leading-relaxed italic whitespace-pre-line">"{story}"</p>
        </section>
      )}

      {/* Gallery */}
      {galleryUrls && galleryUrls.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
            {galleryUrls.map((url, i) => (
              <AnimateIn key={i} direction="scale" delay={i * 0.08}>
                <img
                  src={url}
                  alt=""
                  className="aspect-square w-full rounded-2xl object-cover shadow-sm"
                />
              </AnimateIn>
            ))}
          </div>
        </section>
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

      {/* RSVP */}
      {data.rsvpEnabled && !preview && (
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
      )}

      {/* Wishes */}
      {data.wishesEnabled && !preview && (
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
