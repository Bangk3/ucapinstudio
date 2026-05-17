/**
 * Invyte Check-in Service Worker
 *
 * Strategy:
 *   - Static assets (JS/CSS/_next/*): cache-first (stale-while-revalidate)
 *   - Navigation (HTML): network-first with offline fallback
 *   - API POST /checkin-by-slug: pass-through (offline queue is in the component)
 *   - Everything else: network-first
 *
 * Offline checkin queue is handled by the CheckinScanner component via
 * localStorage + Background Sync where available.
 */

const CACHE_NAME = "invyte-checkin-v1";

// Assets to pre-cache on install (shell)
const PRECACHE_URLS = ["/checkin"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST checkins handled by component offline queue)
  if (request.method !== "GET") return;

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith("http")) return;

  // _next/static — cache-first (immutable hashed assets)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API routes — network-only (stale data is worse than no data)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation (HTML pages) — network-first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Static assets (fonts, icons, images) — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ── Background Sync ───────────────────────────────────────────────────────────
// Drain the offline checkin queue when connectivity is restored.
// The component writes { guestSlug, tenantSlug, invitationId, timestamp }[]
// to localStorage key "invyte_checkin_queue".
self.addEventListener("sync", (event) => {
  if (event.tag === "invyte-checkin-sync") {
    event.waitUntil(drainCheckinQueue());
  }
});

async function drainCheckinQueue() {
  const clients = await self.clients.matchAll({ type: "window" });
  // Notify active clients to drain the queue (they have localStorage access)
  for (const client of clients) {
    client.postMessage({ type: "DRAIN_CHECKIN_QUEUE" });
  }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached ?? fetchPromise;
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}
