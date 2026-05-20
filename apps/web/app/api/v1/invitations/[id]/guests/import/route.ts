import { resolveGuestPhone } from "@/lib/guest-phone";
import { getServerSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { db, guests, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";

const VALID_CATEGORIES = new Set([
  "family",
  "friends",
  "colleagues",
  "school",
  "community",
  "vip",
  "other",
]);

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let inQuote = false;
    let cell = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === "," && !inQuote) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    rows.push(cells);
  }
  return rows;
}

async function resolveTenantAndInvitation(
  invitationId: string,
  userId: string,
  tenantSlug: string,
): Promise<{ tenantId: string } | null> {
  const [row] = await db
    .select({ tenantId: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .innerJoin(invitations, eq(invitations.tenantId, tenants.id))
    .where(
      and(
        eq(tenants.slug, tenantSlug),
        eq(memberships.userId, userId),
        eq(invitations.id, invitationId),
        isNull(tenants.deletedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const resolved = await resolveTenantAndInvitation(id, session.user.id, tenantSlug);
  if (!resolved) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";
  let csvText: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file field required" }, { status: 400 });
    }
    csvText = await (file as File).text();
  } else {
    csvText = await req.text();
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) return NextResponse.json({ imported: 0, errors: [] });

  // Detect and skip header row
  const firstRow = rows[0]!;
  const hasHeader = firstRow[0]?.toLowerCase() === "name" || firstRow[0]?.toLowerCase() === "nama";
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (dataRows.length > 1000) {
    return NextResponse.json({ error: "Max 1000 rows per import" }, { status: 422 });
  }

  // CSV column order: name, phone, email, category, notes
  const now = new Date();
  const toInsert: (typeof guests.$inferInsert)[] = [];
  const errors: { row: number; reason: string }[] = [];
  const seenHashes = new Set<string>(); // dedup within batch

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]!;
    const rowNum = i + (hasHeader ? 2 : 1);

    const name = row[0]?.trim();
    if (!name) {
      errors.push({ row: rowNum, reason: "name is required" });
      continue;
    }
    if (name.length > 255) {
      errors.push({ row: rowNum, reason: "name too long (max 255)" });
      continue;
    }

    const rawPhone = row[1]?.trim() || undefined;
    const email = row[2]?.trim() || undefined;
    const rawCategory = row[3]?.trim().toLowerCase() || "other";
    const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : "other";
    const notes = row[4]?.trim() || undefined;

    // Normalize + hash phone for dedup
    const { normalized: phone, hash: phoneHash } = await resolveGuestPhone(
      rawPhone ?? null,
      resolved.tenantId,
    );

    // In-batch dedup check
    if (phoneHash && seenHashes.has(phoneHash)) {
      errors.push({ row: rowNum, reason: `duplicate phone in file (${rawPhone})` });
      continue;
    }
    if (phoneHash) seenHashes.add(phoneHash);

    toInsert.push({
      id: uuidv7(),
      tenantId: resolved.tenantId,
      invitationId: id,
      slug: nanoid(8),
      name,
      category: category as
        | "family"
        | "friends"
        | "colleagues"
        | "school"
        | "community"
        | "vip"
        | "other",
      plusOneAllowed: false,
      ...(phone !== null ? { phone } : {}),
      ...(phoneHash !== null ? { phoneHash } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(notes !== undefined ? { notes } : {}),
      createdAt: now,
      updatedAt: now,
    });
  }

  // Pre-flight DB dedup: filter out rows whose phoneHash already exists in this invitation
  const hashList = toInsert
    .map((r) => r.phoneHash)
    .filter((h): h is string => typeof h === "string");
  if (hashList.length > 0) {
    const existing = await db
      .select({ phoneHash: guests.phoneHash, name: guests.name })
      .from(guests)
      .where(and(eq(guests.invitationId, id), inArray(guests.phoneHash, hashList)));
    const existingHashes = new Map(existing.map((e) => [e.phoneHash, e.name]));
    if (existingHashes.size > 0) {
      // Reject conflicting rows, keep the rest
      const filtered: typeof toInsert = [];
      for (const r of toInsert) {
        if (r.phoneHash && existingHashes.has(r.phoneHash)) {
          errors.push({
            row: 0,
            reason: `phone already used by existing guest "${existingHashes.get(r.phoneHash)}" (${r.name})`,
          });
          continue;
        }
        filtered.push(r);
      }
      toInsert.length = 0;
      toInsert.push(...filtered);
    }
  }

  let imported = 0;
  if (toInsert.length > 0) {
    // Insert in batches of 100
    for (let i = 0; i < toInsert.length; i += 100) {
      const batch = toInsert.slice(i, i + 100);
      await db.insert(guests).values(batch);
      imported += batch.length;
    }
  }

  return NextResponse.json({ imported, errors });
}
