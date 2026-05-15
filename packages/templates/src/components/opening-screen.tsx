"use client";

import { useEffect, useState } from "react";

interface OpeningScreenProps {
  groomName: string;
  brideName: string;
  guestName?: string;
  primaryColor?: string;
  coverPhotoUrl?: string;
  /** Background color when no cover photo. Defaults to cream #f9f7f4. */
  bgColor?: string;
  /** Foreground/text color when no cover photo. Defaults to dark #2c2c2c. */
  fgColor?: string;
  onOpen: () => void;
}

export function OpeningScreen({
  groomName,
  brideName,
  guestName,
  primaryColor = "#6b8f6e",
  coverPhotoUrl,
  bgColor = "#f9f7f4",
  fgColor = "#2c2c2c",
  onOpen,
}: OpeningScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Lock body scroll while overlay is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleOpen = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onOpen();
    }, 600);
  };

  if (!visible) return null;

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-8"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        transition: "opacity 0.6s ease",
        opacity: fading ? 0 : 1,
        backgroundColor: coverPhotoUrl ? "#000" : bgColor,
      }}
    >
      {/* Background cover photo */}
      {coverPhotoUrl && (
        <div className="absolute inset-0 z-0">
          <img src={coverPhotoUrl} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <div className="relative z-10 space-y-6" style={{ color: coverPhotoUrl ? "#fff" : fgColor }}>
        {guestName && (
          <p
            className="text-xs uppercase tracking-widest opacity-80"
            style={{ fontFamily: "inherit" }}
          >
            Kepada Yth.
          </p>
        )}
        {guestName && (
          <p className="text-lg font-semibold" style={{ fontFamily: "inherit" }}>
            {guestName}
          </p>
        )}

        <p
          className="text-xs uppercase tracking-widest opacity-60 mt-6"
          style={{ fontFamily: "inherit" }}
        >
          Undangan Pernikahan
        </p>

        <h1
          className="text-4xl font-bold leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {groomName}
          <span
            className="text-2xl font-light"
            style={{
              display: "block",
              margin: "4px 0",
              color: coverPhotoUrl ? "rgba(255,255,255,0.7)" : primaryColor,
              opacity: coverPhotoUrl ? 1 : 0.85,
            }}
          >
            &
          </span>
          {brideName}
        </h1>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-3 opacity-40">
          <div className="h-px w-12" style={{ backgroundColor: "currentColor" }} />
          <span className="text-xs">✦</span>
          <div className="h-px w-12" style={{ backgroundColor: "currentColor" }} />
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="mt-4 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Buka Undangan</span>
          <span className="text-base">✉</span>
        </button>
      </div>
    </div>
  );
}
