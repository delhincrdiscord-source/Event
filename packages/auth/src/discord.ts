import { prisma } from "@gameverse/database/client";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { logger } from "./logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const ivHex = parts[0]!;
  const tagHex = parts[1]!;
  const encrypted = parts[2]!;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string | null;
  global_name: string | null;
  avatar: string | null;
  email: string | null;
  verified: boolean;
}

export interface DiscordOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}

export async function linkDiscordAccount(
  userId: string,
  profile: DiscordProfile,
  tokens: DiscordOAuthTokens
): Promise<void> {
  const existingAccount = await prisma.discordAccount.findUnique({
    where: { discordUserId: profile.id },
  });

  if (existingAccount) {
    if (existingAccount.userId !== userId) {
      throw new Error("This Discord account is already linked to another user");
    }

    await prisma.discordAccount.update({
      where: { id: existingAccount.id },
      data: {
        username: profile.username,
        discriminator: profile.discriminator,
        globalName: profile.global_name,
        avatarUrl: profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null,
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: encrypt(tokens.refreshToken),
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
        syncedAt: new Date(),
      },
    });
  } else {
    await prisma.discordAccount.create({
      data: {
        userId,
        discordUserId: profile.id,
        username: profile.username,
        discriminator: profile.discriminator,
        globalName: profile.global_name,
        avatarUrl: profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null,
        accessTokenEncrypted: encrypt(tokens.accessToken),
        refreshTokenEncrypted: encrypt(tokens.refreshToken),
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        scope: tokens.scope,
        isGuildMember: false,
      },
    });
  }
}

export async function getDiscordAccount(userId: string) {
  const account = await prisma.discordAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    return null;
  }

  return {
    ...account,
    accessToken: decrypt(account.accessTokenEncrypted),
    refreshToken: decrypt(account.refreshTokenEncrypted),
  };
}

export async function getDiscordAccountByDiscordId(discordUserId: string) {
  const account = await prisma.discordAccount.findUnique({
    where: { discordUserId },
  });

  if (!account) {
    return null;
  }

  return {
    ...account,
    accessToken: decrypt(account.accessTokenEncrypted),
    refreshToken: decrypt(account.refreshTokenEncrypted),
  };
}

export async function verifyGuildMembership(
  discordUserId: string,
  guildId: string
): Promise<boolean> {
  const account = await getDiscordAccountByDiscordId(discordUserId);

  if (!account) {
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (response.ok) {
      const member = await response.json() as {
        nick?: string;
        joined_at?: string;
      };

      await prisma.discordAccount.update({
        where: { id: account.id },
        data: {
          isGuildMember: true,
          guildJoinedAt: member.joined_at ? new Date(member.joined_at) : null,
          nickname: member.nick,
        },
      });

      return true;
    }

    if (response.status === 404) {
      await prisma.discordAccount.update({
        where: { id: account.id },
        data: {
          isGuildMember: false,
        },
      });

      return false;
    }

    logger.error(`Discord API error: ${response.status}`, { status: response.status });
    return false;
  } catch (error) {
    logger.error(`Failed to verify guild membership: ${error instanceof Error ? error.message : String(error)}`, { err: error });
    return false;
  }
}
