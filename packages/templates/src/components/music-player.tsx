"use client";

import { useEffect, useRef, useState } from "react";

interface MusicPlayerProps {
  musicUrl: string;
  musicTitle?: string;
  primaryColor?: string;
}

export function MusicPlayer({ musicUrl, musicTitle, primaryColor = "#6b8f6e" }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  // Autoplay on mount — component mounts after user clicks "Buka Undangan"
  // so user activation is still valid → try unmuted first, fall back to muted
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.muted = false;

    audio
      .play()
      .then(() => {
        setPlaying(true);
        setMuted(false);
      })
      .catch(() => {
        // Unmuted blocked (strict autoplay policy) — fall back to muted
        audio.muted = true;
        setMuted(true);
        audio
          .play()
          .then(() => setPlaying(true))
          .catch(() => {
            // All blocked — user must click play button
            setPlaying(false);
          });
      });
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && !muted) {
      // Mute instead of pause to keep sync
      audio.muted = true;
      setMuted(true);
    } else if (playing && muted) {
      audio.muted = false;
      setMuted(false);
    } else {
      // Was not playing (autoplay blocked)
      audio.muted = false;
      audio.play().catch(() => {});
      setPlaying(true);
      setMuted(false);
    }
  };

  const isAudible = playing && !muted;

  return (
    <>
      {/* biome-ignore lint/a11y/useMediaCaption: background music has no transcript */}
      <audio ref={audioRef} src={musicUrl} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        title={isAudible ? "Matikan musik" : "Putar musik"}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg text-white transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: primaryColor }}
      >
        {isAudible ? (
          /* Pause / mute icon */
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M18.5 12a6.5 6.5 0 01-1.16 3.705l-1.43-1.43A4.5 4.5 0 0017.5 12a4.5 4.5 0 00-1.59-3.415l1.43-1.43A6.5 6.5 0 0118.5 12zm-2.5 0a4 4 0 01-.78 2.341l-1.435-1.435A2 2 0 0014 12a2 2 0 00-.785-1.594L14.65 8.97A4 4 0 0116 12zM3 9v6h4l5 5V4L7 9H3zm13.5 3a6.5 6.5 0 00-1.875-4.568l1.414-1.414A8.5 8.5 0 0118.5 12a8.5 8.5 0 01-2.461 5.982l-1.414-1.414A6.5 6.5 0 0016.5 12z" />
          </svg>
        ) : (
          /* Play / unmute icon */
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0013 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {/* First-interaction hint when muted */}
      {playing && muted && (
        <div
          className="fixed bottom-20 right-3 z-40 rounded-lg px-3 py-2 text-xs text-white shadow-lg"
          style={{ backgroundColor: primaryColor, maxWidth: "140px" }}
        >
          {musicTitle ?? "Musik"}
          <br />
          <span className="opacity-80">Tap untuk putar ♫</span>
        </div>
      )}
    </>
  );
}
