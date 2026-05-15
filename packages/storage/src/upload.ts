import { nanoid } from "nanoid";
import sharp from "sharp";
import { getPublicUrl, putObject } from "./client";
import { IMAGE_SIZES, type StorageVariant, type UploadResult } from "./types";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MAGIC_BYTES: Array<{ magic: number[]; type: string }> = [
  { magic: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  { magic: [0x89, 0x50, 0x4e, 0x47], type: "image/png" },
  { magic: [0x52, 0x49, 0x46, 0x46], type: "image/webp" },
  { magic: [0x47, 0x49, 0x46], type: "image/gif" },
];

function detectMimeType(buffer: Buffer): string | null {
  for (const { magic, type } of MAGIC_BYTES) {
    if (magic.every((byte, i) => buffer[i] === byte)) return type;
  }
  return null;
}

export async function uploadImage(
  tenantId: string,
  buffer: Buffer,
  folder = "media",
): Promise<UploadResult> {
  const mimeType = detectMimeType(buffer);
  if (!mimeType || !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error("Invalid image type");
  }

  if (buffer.length > 20 * 1024 * 1024) {
    throw new Error("Image too large (max 20MB)");
  }

  const id = nanoid();
  const baseKey = `${tenantId}/${folder}/${id}`;

  const image = sharp(buffer);
  const meta = await image.metadata();
  const variants: Partial<Record<StorageVariant, string>> = {};

  // Upload WebP variants
  for (const [name, width] of Object.entries(IMAGE_SIZES) as Array<[StorageVariant, number]>) {
    if (meta.width && meta.width < width) continue; // skip upscale

    const resized = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `${baseKey}/${name}.webp`;
    await putObject(key, resized, "image/webp");
    variants[name] = getPublicUrl(key);
  }

  // Original
  const origKey = `${baseKey}/original`;
  await putObject(origKey, buffer, mimeType);
  variants.original = getPublicUrl(origKey);

  return {
    key: baseKey,
    url: variants.md ?? variants.sm ?? variants.original,
    variants,
    width: meta.width,
    height: meta.height,
    sizeBytes: buffer.length,
    mimeType,
  };
}

export async function uploadAudio(
  tenantId: string,
  buffer: Buffer,
  originalName: string,
): Promise<UploadResult> {
  if (buffer.length > 8 * 1024 * 1024) {
    throw new Error("Audio too large (max 8MB)");
  }

  const id = nanoid();
  const ext = originalName.split(".").pop() ?? "mp3";
  const key = `${tenantId}/audio/${id}.${ext}`;
  await putObject(key, buffer, "audio/mpeg");

  return {
    key,
    url: getPublicUrl(key),
    variants: {},
    sizeBytes: buffer.length,
    mimeType: "audio/mpeg",
  };
}
