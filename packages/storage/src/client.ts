import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function createStorageClient() {
  const endpoint = process.env.STORAGE_ENDPOINT ?? "http://localhost:9000";
  const accessKeyId = process.env.STORAGE_ACCESS_KEY ?? "undangan_minio";
  const secretAccessKey = process.env.STORAGE_SECRET_KEY ?? "undangan_minio_secret";
  const region = process.env.STORAGE_REGION ?? "us-east-1";

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // required for MinIO
  });
}

export const storageClient = createStorageClient();
export const BUCKET = process.env.STORAGE_BUCKET ?? "undangan";
export const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? "http://localhost:9000/undangan";

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await storageClient.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await storageClient.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(storageClient, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn,
  });
}
