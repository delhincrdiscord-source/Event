import { NextResponse } from "next/server";
import { prisma } from "@gameverse/database";
import { uploadFile, STORAGE_CONFIG } from "@/lib/storage";
import { auth } from "@gameverse/auth/server";
import { checkStrictRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to upload files" },
        { status: 401 }
      );
    }

    const { allowed } = await checkStrictRateLimit(`upload:${session.user.id}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many upload requests. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!STORAGE_CONFIG.allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type: ${file.type}. Allowed: ${STORAGE_CONFIG.allowedMimeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > STORAGE_CONFIG.maxFileSizeBytes) {
      return NextResponse.json(
        { success: false, error: `File too large. Max: ${STORAGE_CONFIG.maxFileSizeBytes / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type);

    const media = await prisma.media.create({
      data: {
        fileKey: result.fileKey,
        url: result.url,
        mimeType: result.mimeType,
        sizeBytes: BigInt(result.sizeBytes),
        uploaderId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: media.id,
          fileKey: result.fileKey,
          url: result.url,
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ err: error }, "Media upload error");
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
