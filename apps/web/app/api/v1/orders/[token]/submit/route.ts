import { uuidv7 } from "@/lib/uuid";
import { db, media, orders } from "@invyte/db";
import { uploadImage } from "@invyte/storage";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ token: string }> };

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

async function uploadOneImage(tenantId: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(tenantId, buffer, "order-submission");

  await db.insert(media).values({
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

  if (!result.url) throw new Error("Upload succeeded but no public URL was returned");
  return result.url;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const [order] = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  let proofImageUrl: string;
  const galleryUrls: string[] = [];
  try {
    proofImageUrl = await uploadOneImage(order.tenantId, proofFile);
    for (const file of galleryFiles) {
      galleryUrls.push(await uploadOneImage(order.tenantId, file));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const submittedData = { ...parsedSubmitted.data, galleryUrls };

  await db.update(orders).set({ submittedData, proofImageUrl }).where(eq(orders.id, order.id));

  return NextResponse.json({ ok: true });
}
