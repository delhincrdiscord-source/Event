// =====================================================
// Crypto Utilities
// =====================================================

import { randomBytes, createHash, timingSafeEqual as nodeTimingSafeEqual } from "crypto";

/**
 * Generate a cryptographically random token
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Hash a token with SHA-256
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a cryptographically secure pass number in format GV26-XXXX-XXXX
 */
export function generatePassNumber(): string {
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

/**
 * Generate a request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${randomBytes(4).toString("hex")}`;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses Node.js built-in crypto.timingSafeEqual which avoids length-based
 * timing side-channels by always comparing the full buffer length.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    let result = 0;
    const maxLen = Math.max(bufA.length, bufB.length);
    for (let i = 0; i < maxLen; i++) {
      result |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
    }
    return false;
  }

  return nodeTimingSafeEqual(bufA, bufB);
}
