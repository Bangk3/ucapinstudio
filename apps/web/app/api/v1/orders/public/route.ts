/**
 * POST /api/v1/orders/public
 *
 * Public, unauthenticated self-service order intake — the homepage's
 * "Dibuatin Admin aja" CTA. Combines what's normally two steps (admin
 * creates an order in /admin/orders, customer fills /order/[token]) into
 * one: creates the tenant/membership/order AND immediately saves the
 * wedding details + payment proof, all from a single public form.
 *
 * The order is owned by whichever superadmin configured the CTA's WA
 * number (platform_settings.admin_whatsapp_number.updatedBy) — falling
 * back to the earliest superadmin — since there's no admin session to
 * attribute it to. Same manual-review flow after that: shows up in
 * /admin/orders like any staff-created order.
 *
 * Body: multipart/form-data
 *   customerContact: string        (WA number)
 *   submittedData: string          (JSON — see lib/order-schema.ts)
 *   proofImage: File
 *   galleryImages: File[]          (optional, max 10)
 */
import { createHash, randomBytes } from "node:crypto";
import { MAX_GALLERY_IMAGES, submittedDataSchema } from "@/lib/order-schema";
import { rateLimitIp } from "@/lib/rate-limit";
import { getPricingSettings } from "@/lib/settings";
import { uniqueTenantSlug } from "@/lib/tenant-slug";
import { uuidv7 } from "@/lib/uuid";
import { db, media, memberships, orders, platformSettings, tenants, user } from "@invyte/db";
import { MAX_IMAGE_BYTES, deleteUploadResult, uploadImage } from "@invyte/storage";
import type { UploadResult } from "@invyte/storage";
import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

async function resolveOrderOwner(): Promise<string | null> {
  const [settingRow] = await db
    .select({ updatedBy: platformSettings.updatedBy })
    .from(platformSettings)
    .where(eq(platformSettings.key, "admin_whatsapp_number"));
  if (settingRow?.updatedBy) return settingRow.updatedBy;

  const [fallback] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "superadmin"))
    .orderBy(asc(user.createdAt))
    .limit(1);
  return fallback?.id ?? null;
}

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

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  // Stricter than order-submit's 10/hour — this creates a full tenant +
  // membership + order, not just a data row on an already-vetted one.
  const rl = await rateLimitIp("public-order", hashIp(ip), 3, 24 * 60 * 60 * 1000);
  if (rl && !rl.success) {
    return NextResponse.json(
      {
        error:
          "Terlalu banyak percobaan. Coba lagi besok, atau hubungi kami langsung via WhatsApp.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const customerContact = formData.get("customerContact");
  if (typeof customerContact !== "string" || !customerContact.trim()) {
    return NextResponse.json({ error: "Nomor WhatsApp wajib diisi" }, { status: 422 });
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
  if (galleryFiles.length > MAX_GALLERY_IMAGES) {
    return NextResponse.json({ error: "Maksimal 10 foto galeri" }, { status: 422 });
  }
  for (const file of [proofFile, ...galleryFiles]) {
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 20MB" }, { status: 422 });
    }
  }

  const ownerId = await resolveOrderOwner();
  if (!ownerId) {
    return NextResponse.json(
      { error: "Fitur ini belum dikonfigurasi. Hubungi kami langsung via WhatsApp." },
      { status: 503 },
    );
  }

  const { hosts } = parsedSubmitted.data;
  const customerName = `${hosts.groomName} & ${hosts.brideName}`;
  const { orderPackagePrice } = await getPricingSettings();
  const tenantSlug = await uniqueTenantSlug(customerName);
  const tenantId = uuidv7();
  const orderId = uuidv7();
  const accessToken = randomBytes(32).toString("base64url");
  const now = new Date();

  const [order] = await db.transaction(async (tx) => {
    await tx.insert(tenants).values({
      id: tenantId,
      slug: tenantSlug,
      name: customerName,
      type: "organization",
      plan: "free",
      settings: { source: "public_order" },
      createdAt: now,
      updatedAt: now,
    });
    await tx
      .insert(memberships)
      .values({ userId: ownerId, tenantId, role: "owner", joinedAt: now });
    return tx
      .insert(orders)
      .values({
        id: orderId,
        customerName,
        customerContact: customerContact.trim(),
        price: orderPackagePrice,
        createdBy: ownerId,
        tenantId,
        accessToken,
        paymentStatus: "pending",
        createdAt: now,
      })
      .returning();
  });
  if (!order) {
    return NextResponse.json({ error: "Gagal membuat order" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/order/${accessToken}`;

  // The tenant/order now exist regardless of what happens below — on upload
  // failure we still hand back the link so the visitor (or admin, from the
  // orders queue) can retry the data+proof step via the normal token flow
  // instead of losing the whole submission.
  let proofResult: UploadResult;
  const galleryResults: UploadResult[] = [];
  const uploadedSoFar: UploadResult[] = [];
  try {
    proofResult = await uploadOneImage(tenantId, proofFile);
    uploadedSoFar.push(proofResult);
    if (!proofResult.url) throw new Error("Upload succeeded but no public URL was returned");
    for (const file of galleryFiles) {
      const result = await uploadOneImage(tenantId, file);
      uploadedSoFar.push(result);
      galleryResults.push(result);
    }
  } catch (err) {
    await Promise.all(uploadedSoFar.map((result) => deleteUploadResult(result)));
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json(
      { error: `Order dibuat, tapi upload foto gagal: ${message}`, publicUrl, accessToken },
      { status: 422 },
    );
  }

  await insertMediaRow(tenantId, proofResult);
  for (const result of galleryResults) {
    await insertMediaRow(tenantId, result);
  }

  const galleryUrls = galleryResults.map((r) => r.url).filter((u): u is string => u !== undefined);
  await db
    .update(orders)
    .set({
      submittedData: { ...parsedSubmitted.data, galleryUrls },
      proofImageUrl: proofResult.url,
    })
    .where(eq(orders.id, order.id));

  return NextResponse.json({ ok: true, publicUrl, accessToken }, { status: 201 });
}
