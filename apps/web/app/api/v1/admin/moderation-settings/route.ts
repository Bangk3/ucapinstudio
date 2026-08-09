import { requireAdminSession } from "@/lib/require-admin";
import { getModerationSettings } from "@/lib/settings";
import { db, platformSettings } from "@invyte/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  spamThreshold: z.number().int().min(0).max(100).optional(),
  bannedWords: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  return NextResponse.json(await getModerationSettings());
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminSession(req, { write: true });
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const now = new Date();
  const { spamThreshold, bannedWords } = parsed.data;

  if (spamThreshold !== undefined) {
    await db
      .insert(platformSettings)
      .values({
        key: "wish_spam_threshold",
        value: spamThreshold,
        updatedBy: auth.session.user.id,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: spamThreshold, updatedBy: auth.session.user.id, updatedAt: now },
      });
  }

  if (bannedWords !== undefined) {
    const valueText = bannedWords
      .map((w) => w.trim())
      .filter(Boolean)
      .join(",");
    await db
      .insert(platformSettings)
      .values({
        key: "wish_banned_words",
        valueText,
        updatedBy: auth.session.user.id,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { valueText, updatedBy: auth.session.user.id, updatedAt: now },
      });
  }

  return NextResponse.json(await getModerationSettings());
}
