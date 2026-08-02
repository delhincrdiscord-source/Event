import { NextResponse } from "next/server";
import { prisma } from "@gameverse/database";
import { auth } from "@gameverse/auth/server";
import { z } from "zod";
import { publishRegistrationEvent, type RegistrationEvent } from "@gameverse/utils/redis-pubsub";
import { randomBytes } from "crypto";
import { checkStrictRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const completeRegistrationSchema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email().max(255),
  interest: z.string().min(1).max(128),
  discordUserId: z.string().min(1),
  discordUsername: z.string().min(1).max(128),
});

function generatePassNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = (length: number): string => {
    const bytes = randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        result += chars[byte % chars.length];
      }
    }
    return result;
  };
  return `GV26-${segment(4)}-${segment(4)}`;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in with Discord to register" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = completeRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, interest, discordUserId, discordUsername } = parsed.data;

    // Rate limit: 5 registrations per minute per user
    const { allowed } = await checkStrictRateLimit(`register-complete:${session.user.id}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const discordAccount = await prisma.discordAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!discordAccount) {
      return NextResponse.json(
        { success: false, error: "Discord account not linked. Please sign in with Discord again." },
        { status: 400 }
      );
    }

    if (discordAccount.discordUserId !== discordUserId) {
      return NextResponse.json(
        { success: false, error: "Discord account mismatch. Please sign in with the correct Discord account." },
        { status: 400 }
      );
    }

    const festival = await prisma.festival.findFirst({
      where: { isActive: true, isDeleted: false, status: { in: ["UPCOMING", "LIVE"] } },
    });

    if (!festival) {
      return NextResponse.json(
        { success: false, error: "No active festival available for registration" },
        { status: 404 }
      );
    }

    if (!festival.registrationEnabled) {
      return NextResponse.json(
        { success: false, error: "Registration is currently closed" },
        { status: 403 }
      );
    }

    const existingRegistration = await prisma.registration.findFirst({
      where: { userId: session.user.id, festivalId: festival.id, isDeleted: false },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: "You are already registered for this festival" },
        { status: 409 }
      );
    }

    const passNumber = generatePassNumber();
    const qrCode = `QR-${passNumber}-${Date.now().toString(36)}`;

    const registration = await prisma.registration.create({
      data: {
        userId: session.user.id,
        festivalId: festival.id,
        passNumber,
        qrCode,
        status: "PENDING",
        fullName: name,
        email: email,
        interest: interest,
        discordUsername: discordUsername,
        notes: `Interest: ${interest}. Discord: ${discordUsername}. Discord ID: ${discordUserId}`,
      },
    });

    const registrationEvent: RegistrationEvent = {
      type: "REGISTRATION_CREATED",
      registrationId: registration.id,
      passNumber: registration.passNumber,
      userId: session.user.id,
      discordUserId: discordUserId,
      discordUsername: discordUsername,
      userName: name,
      userEmail: email,
      interest: interest,
      festivalName: festival.name,
      status: "PENDING",
      timestamp: new Date().toISOString(),
    };

    await publishRegistrationEvent(registrationEvent);

    return NextResponse.json(
      {
        success: true,
        data: {
          registrationId: registration.id,
          passNumber: registration.passNumber,
          festivalName: festival.name,
          status: registration.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ err: error }, "Registration completion error");
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
