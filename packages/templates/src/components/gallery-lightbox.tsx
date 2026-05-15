"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface GalleryLightboxProps {
  urls: string[];
  className?: string;
  /** Tailwind classes for each grid item wrapper */
  itemClassName?: string;
  /** Tailwind classes for the outer grid container */
  gridClassName?: string;
}

export function GalleryLightbox({
  urls,
  itemClassName = "aspect-square w-full rounded-lg object-cover cursor-pointer",
  gridClassName = "grid grid-cols-2 gap-2 md:grid-cols-3",
}: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);

  const prev = useCallback(() => {
    if (activeIndex === null) return;
    setDirection(-1);
    setActiveIndex((i) => (i === null ? null : (i - 1 + urls.length) % urls.length));
  }, [activeIndex, urls.length]);

  const next = useCallback(() => {
    if (activeIndex === null) return;
    setDirection(1);
    setActiveIndex((i) => (i === null ? null : (i + 1) % urls.length));
  }, [activeIndex, urls.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, prev, next]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <>
      {/* Grid */}
      <div className={gridClassName}>
        {urls.map((url, i) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: gallery items are stable
            key={i}
            type="button"
            onClick={() => {
              setDirection(0);
              setActiveIndex(i);
            }}
            className="group overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={`Buka foto ${i + 1} dari ${urls.length}`}
          >
            <img
              src={url}
              alt={`Galeri ${i + 1}`}
              loading="lazy"
              className={`${itemClassName} transition-transform duration-300 group-hover:scale-105`}
            />
          </button>
        ))}
      </div>

      {/* Lightbox portal */}
      <AnimatePresence>
        {isOpen && activeIndex !== null && (
          <motion.div
            key="lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
            onClick={close}
            // biome-ignore lint/a11y/useSemanticElements: motion.dialog conflicts with AnimatePresence exit animations
            role="dialog"
            aria-modal="true"
            aria-label="Lightbox galeri foto"
          >
            {/* Image area — stop propagation so clicking image doesn't close */}
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={activeIndex}
                  src={urls[activeIndex]}
                  alt={`Galeri ${activeIndex + 1}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute max-h-[90dvh] max-w-[90dvw] select-none rounded-md object-contain"
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={close}
              aria-label="Tutup lightbox"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Prev button */}
            {urls.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Foto sebelumnya"
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {urls.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Foto berikutnya"
                className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {activeIndex + 1} / {urls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
