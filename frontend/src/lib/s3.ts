/**
 * 263Tube - S3 Image Upload Utility
 *
 * Server-side utility for uploading creator images to S3.
 * Used by:
 *   - Admin image upload API route (manual creator management)
 *   - Seed script (bulk YouTube channel import)
 *
 * Bucket: 263tube-creator-images (af-south-1)
 * Key structure: creators/{slug}/{type}.jpg
 */

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "263tube-creator-images";
const S3_REGION =
  process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "af-south-1";

const s3Client = new S3Client({ region: S3_REGION });

/**
 * Upload a creator image (profile or banner) to S3.
 *
 * @param buffer - The image file contents
 * @param slug   - Creator slug (used in the S3 key path)
 * @param type   - "profile" or "banner"
 * @param contentType - MIME type (defaults to image/jpeg)
 * @returns The public S3 URL of the uploaded image
 */
export async function uploadCreatorImage(
  buffer: Buffer | Uint8Array,
  slug: string,
  type: "profile" | "banner",
  contentType: string = "image/jpeg"
): Promise<string> {
  const key = `creators/${slug}/${type}.jpg`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  await upload.done();

  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Build the public S3 URL for a creator image without uploading.
 * Useful for constructing expected URLs.
 */
export function getCreatorImageUrl(
  slug: string,
  type: "profile" | "banner"
): string {
  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/creators/${slug}/${type}.jpg`;
}

export { S3_BUCKET_NAME, S3_REGION };
