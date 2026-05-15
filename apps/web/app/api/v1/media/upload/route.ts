import { requireSession } from "@/lib/session";
import { uuidv7 } from "@/lib/uuid";
import { db, media, memberships, tenants } from "@invyte/db";
import { uploadAudio, uploadImage } from "@invyte/storage";
import { and, eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

async function verifyTenantAccess(tenantId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .innerJoin(memberships, eq(memberships.tenantId, tenants.id))
    .where(and(eq(tenants.id, tenantId), eq(memberships.userId, userId), isNull(tenants.deletedAt)))
    .limit(1);
  return row !== undefined;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse multipart
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const tenantId = formData.get("tenantId");
  const type = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (typeof tenantId !== "string" || !tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }
  if (type !== "image" && type !== "audio") {
    return NextResponse.json({ error: "type must be 'image' or 'audio'" }, { status: 422 });
  }

  // Verify membership
  const allowed = await verifyTenantAccess(tenantId, session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload via storage adapter
  let result: Awaited<ReturnType<typeof uploadImage>>;
  try {
    if (type === "image") {
      result = await uploadImage(tenantId, buffer, "media");
    } else {
      result = await uploadAudio(tenantId, buffer, file.name);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    if (message.includes("too large")) {
      return NextResponse.json({ error: message }, { status: 413 });
    }
    if (message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Persist to media table
  const mediaId = uuidv7();
  const now = new Date();

  await db.insert(media).values({
    id: mediaId,
    tenantId,
    type,
    storageKey: result.key,
    ...(result.url !== undefined ? { publicUrl: result.url } : {}),
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    ...(result.width !== undefined ? { width: result.width } : {}),
    ...(result.height !== undefined ? { height: result.height } : {}),
    variants: result.variants as Record<string, string>,
    createdAt: now,
  });

  return NextResponse.json({ url: result.url, mediaId }, { status: 201 });
}
