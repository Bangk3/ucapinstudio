"use client";

interface MapEmbedProps {
  lat: number;
  lng: number;
  venueName?: string;
  /** Extra Tailwind classes on the container */
  className?: string;
}

/**
 * Embedded map via Google Maps iframe (no API key required).
 * Falls back gracefully if iframes are blocked (wrapper is invisible).
 */
export function MapEmbed({ lat, lng, venueName, className = "" }: MapEmbedProps) {
  const src = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={`w-full overflow-hidden rounded-xl border ${className}`}>
      <iframe
        title={venueName ? `Peta lokasi ${venueName}` : "Peta lokasi venue"}
        src={src}
        width="100%"
        height="220"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ border: 0, display: "block" }}
        aria-label={venueName ? `Peta lokasi ${venueName}` : "Peta lokasi venue"}
      />
    </div>
  );
}
