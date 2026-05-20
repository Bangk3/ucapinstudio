"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface GalleryMasonryProps {
  galleryUrls: string[];
  primaryColor: string;
  preview?: boolean;
}

export function GalleryMasonry({ galleryUrls }: GalleryMasonryProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => {
    if (activeIndex === null) return;
    setDirection(-1);
    setActiveIndex((i) => (i === null ? null : (i - 1 + galleryUrls.length) % galleryUrls.length));
  }, [activeIndex, galleryUrls.length]);
  const next = useCallback(() => {
    if (activeIndex === null) return;
    setDirection(1);
    setActiveIndex((i) => (i === null ? null : (i + 1) % galleryUrls.length));
  }, [activeIndex, galleryUrls.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, prev, next]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!galleryUrls || galleryUrls.length === 0) return null;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <>
      <div className="w-full px-4 py-8">
        <motion.div
          className="columns-2 gap-3 space-y-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {galleryUrls.map((url, idx) => {
            const isTall = idx % 2 === 0;
            return (
              <motion.button
                key={`masonry-${idx}`}
                type="button"
                className="block w-full overflow-hidden rounded-xl break-inside-avoid cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => {
                  setDirection(0);
                  setActiveIndex(idx);
                }}
                aria-label={`Buka foto ${idx + 1} dari ${galleryUrls.length}`}
                variants={{
                  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                <img
                  src={url}
                  alt={`Galeri ${idx + 1}`}
                  loading={preview ? "eager" : "lazy"}
                  className={`w-full object-cover transition-transform duration-300 hover:scale-105 ${
                    isTall ? "aspect-[3/4]" : "aspect-square"
                  }`}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && activeIndex !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
            onClick={close}
            // biome-ignore lint/a11y/useSemanticElements: motion.div wrapper for framer animation; native <dialog> would lose AnimatePresence integration
            role="dialog"
            aria-modal="true"
            aria-label="Lightbox galeri foto"
          >
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={activeIndex}
                  src={galleryUrls[activeIndex]}
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
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <svg
                width="18"
                height="18"
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
            {galleryUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Foto sebelumnya"
                  className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <svg
                    width="18"
                    height="18"
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Foto berikutnya"
                  className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <svg
                    width="18"
                    height="18"
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
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {activeIndex + 1} / {galleryUrls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
