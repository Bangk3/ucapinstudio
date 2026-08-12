"use client";

import type { ReactNode } from "react";

export type QuickNavIcon = "home" | "couple" | "gallery" | "location";

export interface QuickNavItem {
  /** Must match the `id` attribute of the section this link jumps to. */
  id: string;
  icon: QuickNavIcon;
  label: string;
}

interface QuickNavProps {
  items: QuickNavItem[];
  color: string;
  bg?: string;
}

const ICONS: Record<QuickNavIcon, ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10" />,
  couple: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2 21v-2a5 5 0 0 1 5-5h2M15 14h2a5 5 0 0 1 5 5v2" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  location: (
    <>
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
};

/** Sticky bottom quick-jump nav for long-scrolling templates. */
export function QuickNav({ items, color, bg = "rgba(255,255,255,0.9)" }: QuickNavProps) {
  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full px-2 py-2 shadow-lg backdrop-blur-sm"
      style={{ backgroundColor: bg }}
      aria-label="Navigasi cepat"
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110"
          aria-label={item.label}
          title={item.label}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[item.icon]}
          </svg>
          <span className="sr-only">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
