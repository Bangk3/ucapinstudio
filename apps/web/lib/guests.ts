import { db, guests } from "@invyte/db";
import type { Guest } from "@invyte/db";
import { and, count, desc, eq, ilike } from "drizzle-orm";

export type { Guest };

export interface ListGuestsOpts {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export async function listGuests(invitationId: string, opts: ListGuestsOpts = {}) {
  const { search, category, limit = 50, offset = 0 } = opts;

  const conditions = [eq(guests.invitationId, invitationId)];

  if (search) {
    conditions.push(ilike(guests.name, `%${search}%`));
  }

  if (category) {
    conditions.push(eq(guests.category, category as Guest["category"]));
  }

  return db
    .select()
    .from(guests)
    .where(and(...conditions))
    .orderBy(desc(guests.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getGuest(guestId: string): Promise<Guest | null> {
  const [row] = await db.select().from(guests).where(eq(guests.id, guestId)).limit(1);
  return row ?? null;
}

export async function getGuestBySlug(invitationId: string, slug: string): Promise<Guest | null> {
  const [row] = await db
    .select()
    .from(guests)
    .where(and(eq(guests.invitationId, invitationId), eq(guests.slug, slug)))
    .limit(1);
  return row ?? null;
}

export async function countGuests(invitationId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(guests)
    .where(eq(guests.invitationId, invitationId));
  return row?.total ?? 0;
}
