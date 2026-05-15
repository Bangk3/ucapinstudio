"use client";

import { Fragment } from "react";

interface CoupleCarouselProps {
  groomName: string;
  brideName: string;
  groomFull?: string;
  brideFull?: string;
  groomParents?: string;
  brideParents?: string;
  groomPhotoUrl?: string;
  bridePhotoUrl?: string;
  /** Photo border / accent color */
  primaryColor: string;
  /** Optional outer ring color (defaults to primaryColor) */
  ringColor?: string;
  /** Photo border style: "solid" | "dashed" (default "solid") */
  borderStyle?: "solid" | "dashed";
  /** Background per card (default transparent) */
  slideBg?: string;
  /** Primary text color (default #1a1a1a) */
  textColor?: string;
  /** Muted text for parents (default #9ca3af) */
  mutedColor?: string;
  /** Role label for groom (default "Mempelai Pria") */
  groomLabel?: string;
  /** Role label for bride (default "Mempelai Wanita") */
  brideLabel?: string;
}

export function CoupleCarousel({
  groomName,
  brideName,
  groomFull,
  brideFull,
  groomParents,
  brideParents,
  groomPhotoUrl,
  bridePhotoUrl,
  primaryColor,
  ringColor,
  borderStyle = "solid",
  slideBg,
  textColor = "#1a1a1a",
  mutedColor = "#9ca3af",
  groomLabel = "Mempelai Pria",
  brideLabel = "Mempelai Wanita",
}: CoupleCarouselProps) {
  const ring = ringColor ?? primaryColor;

  const people = [
    {
      name: groomFull ?? groomName,
      parents: groomParents,
      photo: groomPhotoUrl,
      label: groomLabel,
    },
    {
      name: brideFull ?? brideName,
      parents: brideParents,
      photo: bridePhotoUrl,
      label: brideLabel,
    },
  ];

  return (
    <div className="grid text-center items-start" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
      {people.map((p, idx) => (
        <Fragment key={p.name}>
          <div
            className="flex flex-col items-center space-y-3 px-2 py-4"
            style={{ backgroundColor: slideBg ?? "transparent" }}
          >
            {/* Photo */}
            {p.photo ? (
              <div
                className="relative flex items-center justify-center"
                style={{ width: 120, height: 120 }}
              >
                <div
                  className="absolute rounded-full"
                  style={{ inset: -6, border: `1.5px ${borderStyle} ${ring}`, opacity: 0.45 }}
                />
                <img
                  src={p.photo}
                  alt={p.name}
                  className="rounded-full object-cover"
                  style={{
                    width: 112,
                    height: 112,
                    border: `2.5px ${borderStyle} ${primaryColor}`,
                  }}
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 112,
                  height: 112,
                  border: `2.5px ${borderStyle} ${primaryColor}`,
                  opacity: 0.25,
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="1.2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}

            {/* Role label */}
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: primaryColor }}>
              {p.label}
            </p>

            {/* Name */}
            <h3
              className="text-base font-bold leading-snug"
              style={{ color: textColor, fontFamily: "inherit" }}
            >
              {p.name}
            </h3>

            {/* Parents */}
            {p.parents && (
              <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
                {p.parents}
              </p>
            )}
          </div>

          {/* Center connector — rendered after groom (idx 0) only */}
          {idx === 0 && (
            <div
              key="connector"
              className="flex flex-col items-center justify-start"
              style={{ paddingTop: "42px" }} /* align with photo center */
            >
              {/* Top line */}
              <div style={{ width: 1, height: 20, backgroundColor: primaryColor, opacity: 0.2 }} />

              {/* Heart */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={primaryColor}
                style={{ opacity: 0.75, flexShrink: 0 }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>

              {/* Bottom line */}
              <div style={{ width: 1, height: 20, backgroundColor: primaryColor, opacity: 0.2 }} />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
