import { createHash } from "node:crypto";
import { db, viewEvents } from "@invyte/db";

function detectDevice(ua: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(lower)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(lower)) return "mobile";
  return "desktop";
}

export async function trackView(opts: {
  invitationId: string;
  guestId?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}) {
  try {
    const ipHash = opts.ip ? createHash("sha256").update(opts.ip).digest("hex").slice(0, 16) : null;
    const device = detectDevice(opts.userAgent ?? "");
    await db.insert(viewEvents).values({
      invitationId: opts.invitationId,
      guestId: opts.guestId ?? null,
      ipHash,
      userAgent: opts.userAgent?.slice(0, 512) ?? null,
      referrer: opts.referrer?.slice(0, 512) ?? null,
      device,
    });
  } catch {
    // Never throw — analytics failure must not break invitation page
  }
}
