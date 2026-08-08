import { listInvitations, slugExists } from "@/lib/invitations";
import { getServerSession } from "@/lib/session";
import {
  TemplateLockedError,
  UnknownTemplateError,
  assertTemplateAccess,
} from "@/lib/template-access";
import { uuidv7 } from "@/lib/uuid";
import { db, invitations, memberships, tenants } from "@invyte/db";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(tenantId: string, base: string): Promise<string> {
  let slug = slugify(base);
  let attempt = 0;
  while (await slugExists(tenantId, slug)) {
    attempt++;
    slug = `${slugify(base)}-${attempt}`;
  }
  return slug;
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  kind: z
    .enum(["wedding", "engagement", "birthday", "aqiqah", "khitanan", "baby_shower", "corporate"])
    .default("wedding"),
  templateId: z.string().optional(),
  tenantSlug: z.string().min(1),
});

async function resolveTenantId(tenantSlug: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(
      and(eq(tenants.slug, tenantSlug), eq(memberships.userId, userId), isNull(tenants.deletedAt)),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantSlug = req.nextUrl.searchParams.get("tenantSlug");
  if (!tenantSlug) return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await listInvitations(tenantId);
  return NextResponse.json({ invitations: rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { name, slug: rawSlug, kind, templateId, tenantSlug } = parsed.data;

  const tenantId = await resolveTenantId(tenantSlug, session.user.id);
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedTemplateId = templateId ?? "minimalist-modern";
  try {
    await assertTemplateAccess(tenantId, resolvedTemplateId);
  } catch (err) {
    if (err instanceof TemplateLockedError) {
      return NextResponse.json({ error: "Template ini belum di-unlock" }, { status: 402 });
    }
    if (err instanceof UnknownTemplateError) {
      return NextResponse.json({ error: "Template tidak dikenal" }, { status: 404 });
    }
    throw err;
  }

  const slug = rawSlug
    ? (await slugExists(tenantId, rawSlug))
      ? await uniqueSlug(tenantId, rawSlug)
      : rawSlug
    : await uniqueSlug(tenantId, name);

  const id = uuidv7();
  const now = new Date();

  const [inv] = await db
    .insert(invitations)
    .values({
      id,
      tenantId,
      name,
      slug,
      kind,
      templateId: resolvedTemplateId,
      status: "draft",
      content: {
        hosts: { groomName: "", brideName: "" },
        events: [],
      },
      theme: {},
      settings: {},
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ invitation: inv }, { status: 201 });
}
