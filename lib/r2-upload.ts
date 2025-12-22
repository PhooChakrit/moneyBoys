import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client from "@/lib/r2";

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Upload a file to R2 and return the public URL
 */
export async function uploadToR2(
  file: File,
  folder: string = "uploads",
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${folder}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return `${PUBLIC_URL}/${filename}`;
}

/**
 * Generate a presigned URL for uploading directly from client
 */
export async function getUploadUrl(
  filename: string,
  folder: string = "uploads",
): Promise<string> {
  const key = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return uploadUrl;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(fileUrl: string): Promise<void> {
  // Extract key from URL
  const key = fileUrl.replace(`${PUBLIC_URL}/`, "");

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}
