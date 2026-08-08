import { createHash } from "node:crypto";
import { rateLimitIp } from "@/lib/rate-limit";
import { uuidv7 } from "@/lib/uuid";
import { db, media, orders } from "@invyte/db";
import { MAX_IMAGE_BYTES, deleteUploadResult, uploadImage } from "@invyte/storage";
import type { UploadResult } from "@invyte/storage";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

type Ctx = { params: Promise<{ token: string }> };

const MAX_GALLERY_IMAGES = 10;

const eventSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  date: z.string().optional(),
  time: z.string().optional(),
  venueName: z.string().max(255).optional(),
  venueAddress: z.string().max(500).optional(),
});

const submittedDataSchema = z.object({
  hosts: z.object({
    groomName: z.string().min(1).max(255),
    brideName: z.string().min(1).max(255),
    groomFull: z.string().max(255).optional(),
    brideFull: z.string().max(255).optional(),
    groomParents: z.string().max(255).optional(),
    brideParents: z.string().max(255).optional(),
  }),
  events: z.array(eventSchema).min(1),
  story: z.string().max(5000).optional(),
});

async function uploadOneImage(tenantId: string, file: File): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadImage(tenantId, buffer, "order-submission");
}

function insertMediaRow(tenantId: string, result: UploadResult) {
  return db.insert(media).values({
    id: uuidv7(),
    tenantId,
    type: "image",
    storageKey: result.key,
    ...(result.url !== undefined ? { publicUrl: result.url } : {}),
    mimeType: result.mimeType,
    sizeBytes: result.sizeBytes,
    ...(result.width !== undefined ? { width: result.width } : {}),
    ...(result.height !== undefined ? { height: result.height } : {}),
    variants: result.variants as Record<string, string>,
    createdAt: new Date(),
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Rate limit: this is the app's only unauthenticated write path — same
  // limit/window as the RSVP route for consistency (10/hour per IP).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimitIp("order-submit", hashIp(ip), 10, 60 * 60 * 1000);
  if (rl && !rl.success) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // Finding 2: one-time public form — never silently overwrite a prior submission.
  if (order.submittedData !== null) {
    return NextResponse.json(
      { error: "Data untuk order ini sudah pernah dikirim" },
      { status: 409 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const submittedDataRaw = formData.get("submittedData");
  if (typeof submittedDataRaw !== "string") {
    return NextResponse.json({ error: "submittedData wajib diisi" }, { status: 422 });
  }
  let submittedDataJson: unknown;
  try {
    submittedDataJson = JSON.parse(submittedDataRaw);
  } catch {
    return NextResponse.json({ error: "submittedData harus berupa JSON valid" }, { status: 422 });
  }
  const parsedSubmitted = submittedDataSchema.safeParse(submittedDataJson);
  if (!parsedSubmitted.success) {
    return NextResponse.json({ error: parsedSubmitted.error.flatten() }, { status: 422 });
  }

  const proofFile = formData.get("proofImage");
  if (!(proofFile instanceof File)) {
    return NextResponse.json({ error: "Bukti transfer wajib diupload" }, { status: 422 });
  }

  const galleryFiles = formData.getAll("galleryImages").filter((f): f is File => f instanceof File);

  // Finding 3: cap gallery file count before any upload processing begins.
  if (galleryFiles.length > MAX_GALLERY_IMAGES) {
    return NextResponse.json({ error: "Maksimal 10 foto galeri" }, { status: 422 });
  }

  // Cheap pre-filter before buffering anything into memory — uploadImage
  // enforces the same 20MB limit itself, this just avoids paying for
  // .arrayBuffer() on a deliberately huge file first.
  for (const file of [proofFile, ...galleryFiles]) {
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 20MB" }, { status: 422 });
    }
  }

  // Finding 1: upload+validate every file first, insert media rows only after
  // ALL uploads succeed — otherwise a later failure leaves earlier media rows
  // dangling with no order ever referencing them.
  let proofResult: UploadResult;
  const galleryResults: UploadResult[] = [];
  const uploadedSoFar: UploadResult[] = [];
  try {
    proofResult = await uploadOneImage(order.tenantId, proofFile);
    uploadedSoFar.push(proofResult);
    if (!proofResult.url) throw new Error("Upload succeeded but no public URL was returned");
    for (const file of galleryFiles) {
      const result = await uploadOneImage(order.tenantId, file);
      uploadedSoFar.push(result);
      galleryResults.push(result);
    }
  } catch (err) {
    // Finding 3: a mid-batch failure leaves earlier files sitting in MinIO
    // with no media row ever created for them — clean those up now rather
    // than leaving permanent orphaned blobs.
    await Promise.all(uploadedSoFar.map((result) => deleteUploadResult(result)));
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  await insertMediaRow(order.tenantId, proofResult);
  for (const result of galleryResults) {
    await insertMediaRow(order.tenantId, result);
  }

  const galleryUrls = galleryResults.map((r) => r.url).filter((u): u is string => u !== undefined);

  const submittedData = { ...parsedSubmitted.data, galleryUrls };

  await db
    .update(orders)
    .set({
      submittedData,
      proofImageUrl: proofResult.url,
      ...(order.paymentStatus === "rejected"
        ? // A resubmission after a rejection must re-enter the admin review
          // queue — the queue only shows approve/reject for "pending" orders.
          // Also clear the stale rejection reason so a later approval doesn't
          // leave old rejection text on an order that's now paid.
          { paymentStatus: "pending" as const, rejectionReason: null }
        : // Already "pending": no-op. Already "paid": never downgrade — this
          // route only requires submittedData === null to reach here, so a
          // paid order with no submission must stay paid.
          {}),
    })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ ok: true });
}
