"use client";

import { useEffect } from "react";

/**
 * Layout for the check-in section.
 *
 * Registers the service worker and sets the PWA manifest so the check-in
 * scanner is installable and works offline.
 */
export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // SW registration failure is non-fatal — scanner still works online
      });
    }
  }, []);

  return (
    <>
      {/* PWA manifest — scoped to checkin pages */}
      <link rel="manifest" href="/manifest.json" />
      {children}
    </>
  );
}
