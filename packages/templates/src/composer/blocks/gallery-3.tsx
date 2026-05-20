"use client";

import { motion, useReducedMotion } from "framer-motion";

interface GalleryPolaroidProps {
  galleryUrls: string[];
  primaryColor: string;
  preview?: boolean;
}

const ROTATIONS = [-6, -3, 0, 3, 6];

export function GalleryPolaroid({ galleryUrls, primaryColor, preview }: GalleryPolaroidProps) {
  const shouldReduceMotion = useReducedMotion();
  const reduced = shouldReduceMotion === true;

  if (!galleryUrls || galleryUrls.length === 0) return null;

  return (
    <div className="w-full px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 place-items-center">
        {galleryUrls.map((url, idx) => {
          const rotation = ROTATIONS[idx % ROTATIONS.length] ?? 0;
          const initialRotation: number = reduced ? 0 : rotation;
          const finalRotation: number = reduced ? 0 : rotation;
          return (
            <motion.div
              key={`polaroid-${idx}`}
              className="relative bg-white shadow-md cursor-default select-none"
              style={{
                padding: "12px",
                paddingBottom: "32px",
              }}
              initial={{
                opacity: 0,
                y: reduced ? 0 : 24,
                rotate: initialRotation,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
                rotate: finalRotation,
              }}
              whileHover={{
                rotate: 0,
                scale: 1.05,
                zIndex: 10,
                boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
              }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
              aria-label={`Foto ${idx + 1}`}
            >
              <img
                src={url}
                alt={`Galeri ${idx + 1}`}
                loading={preview || idx <= 3 ? "eager" : "lazy"}
                className="aspect-square w-full object-cover"
                style={{ minWidth: "120px", maxWidth: "200px" }}
              />
              {/* Caption line */}
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-2"
                aria-hidden="true"
              >
                <div
                  className="h-0.5 w-8 rounded-full opacity-30"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
