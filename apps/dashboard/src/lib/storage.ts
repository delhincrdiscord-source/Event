import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const B2_ENDPOINT = `https://s3.${process.env.B2_REGION}.backblazeb2.com`;
const B2_BUCKET = process.env.B2_BUCKET_NAME ?? "";
const B2_KEY_ID = process.env.B2_KEY_ID ?? "";
const B2_APP_KEY = process.env.B2_APP_KEY ?? "";
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL ?? "";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: process.env.B2_REGION ?? "us-west-004",
    credentials: {
      accessKeyId: B2_KEY_ID,
      secretAccessKey: B2_APP_KEY,
    },
  });
  return client;
}

export interface UploadResult {
  fileKey: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageConfig {
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
}

export const STORAGE_CONFIG: StorageConfig = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};

function generateFileKey(originalName: string): string {
  const ext = originalName.split(".").pop() ?? "bin";
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const uuid = crypto.randomUUID();
  return `uploads/${year}/${month}/${uuid}.${ext}`;
}

function getPublicUrl(fileKey: string): string {
  if (B2_PUBLIC_URL) {
    return `${B2_PUBLIC_URL}/${fileKey}`;
  }
  return `${B2_ENDPOINT}/${B2_BUCKET}/${fileKey}`;
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  if (!STORAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Invalid file type: ${mimeType}`);
  }
  if (file.length > STORAGE_CONFIG.maxFileSizeBytes) {
    throw new Error(
      `File too large: ${file.length} bytes (max: ${STORAGE_CONFIG.maxFileSizeBytes})`
    );
  }

  const fileKey = generateFileKey(fileName);
  const s3 = getClient();

  await s3.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
      Body: file,
      ContentType: mimeType,
      ContentLength: file.length,
    })
  );

  return {
    fileKey,
    url: getPublicUrl(fileKey),
    sizeBytes: file.length,
    mimeType,
  };
}

export async function deleteFile(fileKey: string): Promise<boolean> {
  try {
    const s3 = getClient();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: B2_BUCKET,
        Key: fileKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function getFileUrl(fileKey: string): Promise<string | null> {
  try {
    const s3 = getClient();
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch {
    return null;
  }
}

export async function fileExists(fileKey: string): Promise<boolean> {
  try {
    const s3 = getClient();
    await s3.send(
      new HeadObjectCommand({
        Bucket: B2_BUCKET,
        Key: fileKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function getSignedUploadUrl(
  fileName: string,
  mimeType: string,
  expiresIn = 3600
): Promise<{ uploadUrl: string; fileKey: string } | null> {
  try {
    if (!STORAGE_CONFIG.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid file type: ${mimeType}`);
    }
    const fileKey = generateFileKey(fileName);
    const s3 = getClient();
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: fileKey,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    return { uploadUrl, fileKey };
  } catch {
    return null;
  }
}
