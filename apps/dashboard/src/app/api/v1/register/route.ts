import { NextResponse } from "next/server";
import { prisma } from "@gameverse/database";
import { z } from "zod";
import { publishRegistrationEvent, type RegistrationEvent } from "@gameverse/utils/redis-pubsub";
import { randomBytes } from "crypto";
import { checkStrictRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email().max(255),
  discordUsername: z.string().min(2).max(128),
  interest: z.string().min(1).max(128),
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
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, discordUsername, interest } = parsed.data;

    // Rate limit: 5 registrations per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { allowed } = await checkStrictRateLimit(`register:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Find the active festival
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

    // Check if user already registered with this email
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      // Check if already registered for this festival
      const existingReg = await prisma.registration.findFirst({
        where: { userId, festivalId: festival.id, isDeleted: false },
      });

      if (existingReg) {
        return NextResponse.json(
          { success: false, error: "You are already registered for this festival" },
          { status: 409 }
        );
      }
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          username: discordUsername.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() + "_" + Date.now().toString(36),
          globalName: name,
        },
      });
      userId = newUser.id;

      // Assign MEMBER role
      const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" } });
      if (memberRole) {
        await prisma.userRole.create({
          data: { userId, roleId: memberRole.id },
        });
      }
    }

    // Create registration
    const passNumber = generatePassNumber();
    const qrCode = `QR-${passNumber}-${Date.now().toString(36)}`;

    const registration = await prisma.registration.create({
      data: {
        userId,
        festivalId: festival.id,
        passNumber,
        qrCode,
        status: "PENDING",
        fullName: name,
        email: email,
        interest: interest,
        discordUsername: discordUsername,
        notes: `Interest: ${interest}. Discord: ${discordUsername}`,
      },
    });

    const discordAccount = await prisma.discordAccount.findUnique({
      where: { userId },
      select: { discordUserId: true },
    });

    const registrationEvent: RegistrationEvent = {
      type: "REGISTRATION_CREATED",
      registrationId: registration.id,
      passNumber: registration.passNumber,
      userId: userId,
      discordUserId: discordAccount?.discordUserId ?? null,
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
    logger.error({ err: error }, "Registration API error");
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
