"use client";

import { AlertTriangle, ArrowLeft, Camera, Check, CloudOff, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  invitationId: string;
  tenantSlug: string;
  backHref?: string;
}

interface QueuedCheckin {
  id: string;
  guestSlug: string;
  tenantSlug: string;
  invitationId: string;
  timestamp: number;
}

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "success"; guestName: string; alreadyCheckedIn: boolean; queued?: boolean }
  | { status: "error"; message: string }
  | { status: "no_camera"; message: string };

const QUEUE_KEY = "invyte_checkin_queue";

function readQueue(): QueuedCheckin[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedCheckin[];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedCheckin[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function enqueue(entry: Omit<QueuedCheckin, "id">): void {
  const q = readQueue();
  q.push({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  writeQueue(q);
}

// Extract guestSlug from a URL like: /[tenant]/u/[invitationSlug]/[guestSlug]
function extractGuestSlug(rawText: string): string | null {
  try {
    const url = new URL(rawText);
    const parts = url.pathname.split("/").filter(Boolean);
    // expected: [tenant, "u", invitationSlug, guestSlug]
    if (parts.length >= 4 && parts[1] === "u") {
      return parts[3] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function CheckinScanner({ invitationId, tenantSlug, backHref }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<ScanState>({ status: "idle" });
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: number; fail: number } | null>(null);

  // Refresh queue count from localStorage
  const refreshQueueCount = useCallback(() => {
    setQueueCount(readQueue().length);
  }, []);

  // Drain the offline queue — try each entry against the API
  const drainQueue = useCallback(async () => {
    const q = readQueue();
    if (q.length === 0) return;

    setSyncing(true);
    let ok = 0;
    let fail = 0;
    const remaining: QueuedCheckin[] = [];

    for (const entry of q) {
      try {
        const res = await fetch(`/api/v1/invitations/${entry.invitationId}/checkin-by-slug`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestSlug: entry.guestSlug,
            tenantSlug: entry.tenantSlug,
          }),
        });
        if (res.ok) {
          ok++;
        } else {
          fail++;
          remaining.push(entry);
        }
      } catch {
        fail++;
        remaining.push(entry);
      }
    }

    writeQueue(remaining);
    setQueueCount(remaining.length);
    setSyncing(false);
    setSyncResult({ ok, fail });
    // Clear sync result after 4s
    setTimeout(() => setSyncResult(null), 4000);
  }, []);

  // Online/offline detection + auto-sync
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      drainQueue();
    };
    const onOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    refreshQueueCount();

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [drainQueue, refreshQueueCount]);

  // Listen for SW message to drain queue (Background Sync)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === "DRAIN_CHECKIN_QUEUE") {
        drainQueue();
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [drainQueue]);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setCameraStarted(false);
  }, []);

  // Process a decoded QR string
  const handleQrData = useCallback(
    async (rawText: string) => {
      if (state.status === "success" || state.status === "error") return;

      const guestSlug = extractGuestSlug(rawText);
      if (!guestSlug) {
        setState({ status: "error", message: "QR tidak dikenali" });
        resetTimerRef.current = setTimeout(() => setState({ status: "scanning" }), 3000);
        return;
      }

      // Offline path: queue locally
      if (!navigator.onLine) {
        enqueue({ guestSlug, tenantSlug, invitationId, timestamp: Date.now() });
        refreshQueueCount();
        setState({
          status: "success",
          guestName: guestSlug,
          alreadyCheckedIn: false,
          queued: true,
        });

        // Register background sync if supported (Chrome / Edge only)
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            // `sync` is only available in browsers that support Background Sync API
            const syncReg = reg as ServiceWorkerRegistration & {
              sync?: { register(tag: string): Promise<void> };
            };
            await syncReg.sync?.register("invyte-checkin-sync");
          } catch {
            // Background Sync not critical
          }
        }

        resetTimerRef.current = setTimeout(() => setState({ status: "scanning" }), 3000);
        return;
      }

      // Online path
      setState({ status: "success", guestName: "...", alreadyCheckedIn: false });

      try {
        const res = await fetch(`/api/v1/invitations/${invitationId}/checkin-by-slug`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestSlug, tenantSlug }),
        });
        const data = (await res.json()) as {
          success: boolean;
          guestName?: string;
          alreadyCheckedIn?: boolean;
          error?: string;
        };

        if (res.ok && data.success) {
          setState({
            status: "success",
            guestName: data.guestName ?? guestSlug,
            alreadyCheckedIn: data.alreadyCheckedIn ?? false,
          });
        } else {
          setState({ status: "error", message: data.error ?? "Gagal check-in" });
        }
      } catch {
        // Network failed even though we thought we were online — queue it
        enqueue({ guestSlug, tenantSlug, invitationId, timestamp: Date.now() });
        refreshQueueCount();
        setState({
          status: "success",
          guestName: guestSlug,
          alreadyCheckedIn: false,
          queued: true,
        });
      }

      resetTimerRef.current = setTimeout(() => setState({ status: "scanning" }), 3000);
    },
    [invitationId, tenantSlug, state.status, refreshQueueCount],
  );

  // QR scan loop using requestAnimationFrame
  const scanLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamically import jsqr to keep initial bundle small
    const jsQR = (await import("jsqr")).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code?.data) {
      await handleQrData(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [handleQrData]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStarted(true);
      setState({ status: "scanning" });
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setState({
        status: "no_camera",
        message: "Izin kamera ditolak atau kamera tidak tersedia.",
      });
    }
  }, [scanLoop]);

  // Resume scan loop when state returns to "scanning"
  useEffect(() => {
    if (state.status === "scanning" && cameraStarted && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(scanLoop);
    }
  }, [state.status, cameraStarted, scanLoop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [stopCamera]);

  const isOverlayVisible = state.status === "success" || state.status === "error";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Idle screen ──────────────────────────────────────────────────────── */}
      {!cameraStarted && state.status === "idle" && (
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <div
            className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <Camera className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-xl font-bold">Scanner Check-in</h1>
          <p className="text-sm text-gray-300 max-w-xs">
            Arahkan kamera ke QR Code tamu untuk melakukan check-in.
          </p>
          {!isOnline && (
            <div className="flex items-center gap-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 text-xs text-yellow-300">
              <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Offline — check-in akan disimpan lokal
            </div>
          )}
          <button
            type="button"
            onClick={startCamera}
            className="rounded-xl bg-white text-black px-6 py-3 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Mulai Kamera
          </button>
        </div>
      )}

      {/* ── No camera ────────────────────────────────────────────────────────── */}
      {state.status === "no_camera" && (
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <p className="text-red-400 font-medium">{state.message}</p>
          <button
            type="button"
            onClick={startCamera}
            className="rounded-xl bg-white text-black px-6 py-3 font-semibold text-sm"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ── Camera feed ──────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover ${cameraStarted ? "block" : "hidden"}`}
        style={{ maxHeight: "100dvh" }}
      />

      {/* ── Scanning reticle ─────────────────────────────────────────────────── */}
      {state.status === "scanning" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="relative w-64 h-64 border-2 border-white/70 rounded-2xl"
            aria-label="Area pemindaian QR"
          >
            <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
            <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
            <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
            <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
              Arahkan ke QR Code
            </p>
          </div>
        </div>
      )}

      {/* ── Result overlay ───────────────────────────────────────────────────── */}
      {isOverlayVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div
            className={`rounded-2xl px-8 py-10 text-center w-72 ${
              state.status === "success"
                ? state.queued
                  ? "bg-blue-600"
                  : state.alreadyCheckedIn
                    ? "bg-yellow-500"
                    : "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {state.status === "success" ? (
              <>
                <div className="flex justify-center mb-3" aria-hidden="true">
                  {state.queued ? (
                    <CloudOff className="h-12 w-12" />
                  ) : state.alreadyCheckedIn ? (
                    <AlertTriangle className="h-12 w-12" />
                  ) : (
                    <Check className="h-12 w-12" strokeWidth={3} />
                  )}
                </div>
                <p className="text-xl font-bold">{state.guestName}</p>
                <p className="text-sm mt-1 opacity-90">
                  {state.queued
                    ? "Disimpan — akan sync saat online"
                    : state.alreadyCheckedIn
                      ? "Sudah check-in sebelumnya"
                      : "Check-in berhasil!"}
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-3" aria-hidden="true">
                  <X className="h-12 w-12" strokeWidth={3} />
                </div>
                <p className="text-lg font-bold">{state.message}</p>
              </>
            )}
            <p className="text-xs mt-4 opacity-70">Otomatis lanjut dalam 3 detik…</p>
          </div>
        </div>
      )}

      {/* ── Top-left: back link ───────────────────────────────────────────────── */}
      {backHref && (
        <Link
          href={backHref}
          className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/70 transition-colors"
          aria-label="Kembali ke dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Kembali
        </Link>
      )}

      {/* ── Top-right: stop + status indicators ─────────────────────────────── */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Offline badge */}
        {!isOnline && (
          <span className="flex items-center gap-1 rounded-full bg-yellow-500/80 px-2.5 py-1 text-xs font-medium text-black backdrop-blur">
            <CloudOff className="h-3 w-3" aria-hidden="true" />
            Offline
          </span>
        )}

        {/* Queue count */}
        {queueCount > 0 && (
          <button
            type="button"
            onClick={drainQueue}
            disabled={syncing || !isOnline}
            className="flex items-center gap-1 rounded-full bg-blue-500/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur disabled:opacity-60"
            aria-label={`${queueCount} check-in tertunda, klik untuk sync`}
          >
            {syncing ? (
              <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
            )}
            {queueCount}
          </button>
        )}

        {/* Sync result flash */}
        {syncResult && (
          <span className="rounded-full bg-green-500/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            ✓ {syncResult.ok} sync
            {syncResult.fail > 0 && ` · ${syncResult.fail} gagal`}
          </span>
        )}

        {cameraStarted && (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/70 transition-colors"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
