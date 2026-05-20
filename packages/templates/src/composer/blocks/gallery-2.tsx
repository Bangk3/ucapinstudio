"use client";

import { useEffect, useRef, useState } from "react";

interface GalleryCarouselProps {
  galleryUrls: string[];
  primaryColor: string;
  preview?: boolean;
}

export function GalleryCarousel({ galleryUrls, primaryColor, preview }: GalleryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-advance every 3s, pause on hover
  useEffect(() => {
    if (preview || isPaused || galleryUrls.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % galleryUrls.length);
    }, 3000);
    return () => clearInterval(id);
  }, [isPaused, galleryUrls.length, preview]);

  // Sync scroll position to activeIndex
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[activeIndex] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
  }, [activeIndex]);

  function goTo(idx: number) {
    setActiveIndex(((idx % galleryUrls.length) + galleryUrls.length) % galleryUrls.length);
  }

  if (!galleryUrls || galleryUrls.length === 0) return null;

  return (
    <div className="w-full py-8">
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        {/* Scroll strip */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
          aria-label="Galeri foto"
        >
          {galleryUrls.map((url, idx) => (
            <button
              key={`carousel-${idx}`}
              type="button"
              onClick={() => goTo(idx)}
              className="w-72 h-64 snap-start flex-shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-transform duration-200"
              style={{
                outline: activeIndex === idx ? `2px solid ${primaryColor}` : "none",
                transform: activeIndex === idx ? "scale(1.02)" : "scale(1)",
                ["--tw-ring-color" as string]: primaryColor,
              }}
              aria-label={`Foto ${idx + 1}`}
              aria-current={activeIndex === idx ? "true" : "false"}
            >
              <img
                src={url}
                alt={`Galeri ${idx + 1}`}
                loading={preview || idx <= 2 ? "eager" : "lazy"}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Prev button */}
        {galleryUrls.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Foto sebelumnya"
            className="absolute left-6 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition-colors hover:bg-white text-gray-700"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {galleryUrls.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Foto berikutnya"
            className="absolute right-6 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition-colors hover:bg-white text-gray-700"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {galleryUrls.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4" aria-hidden="true">
          {galleryUrls.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Foto ${idx + 1}`}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: activeIndex === idx ? "20px" : "6px",
                backgroundColor: primaryColor,
                opacity: activeIndex === idx ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
