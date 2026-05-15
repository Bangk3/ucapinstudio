import { CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { BUCKET, storageClient } from "./client";

async function initBucket() {
  // Check if bucket exists
  try {
    await storageClient.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`Bucket "${BUCKET}" already exists`);
  } catch {
    await storageClient.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`Bucket "${BUCKET}" created`);
  }

  // Public read policy for media files
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      },
    ],
  };

  await storageClient.send(
    new PutBucketPolicyCommand({
      Bucket: BUCKET,
      Policy: JSON.stringify(policy),
    }),
  );

  console.log("Bucket policy set (public read)");
  process.exit(0);
}

initBucket().catch((e) => {
  console.error(e);
  process.exit(1);
});
