import { auth } from "@gameverse/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const handler = toNextJsHandler(auth);
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "https://dashboard.delhincr.fun";

async function safeHandler(request: Request, method: string) {
  try {
    const res = await (handler as Record<string, (req: Request) => Promise<Response>>)[method]?.(request);
    return res ?? NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: error, method }, "Auth handler error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  
  if (
    url.pathname.includes("/api/auth/sign-in/social") ||
    url.pathname.includes("/api/auth/login/discord") ||
    url.pathname.includes("/api/auth/discord")
  ) {
    const rawCallback = url.searchParams.get("callbackURL");
    const callbackURL = (rawCallback && rawCallback.startsWith("http")) 
      ? rawCallback 
      : `${BETTER_AUTH_URL}/dashboard`;

    try {
      const apiRes = await auth.api.signInSocial({
        body: {
          provider: "discord",
          callbackURL,
        },
        headers: request.headers,
        asResponse: true,
      });

      if (apiRes) {
        const data = (await apiRes.clone().json().catch(() => null)) as { url?: string } | null;
        if (data?.url) {
          const responseHeaders = new Headers(apiRes.headers);
          return NextResponse.redirect(data.url, { headers: responseHeaders });
        }
      }
    } catch (error: unknown) {
      logger.error({ err: error }, "signInSocial API call failed, attempting fallback POST handler");
    }

    try {
      const cleanPostReq = new Request(`${BETTER_AUTH_URL}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cookie": request.headers.get("cookie") || "",
          "user-agent": request.headers.get("user-agent") || "Mozilla/5.0",
        },
        body: JSON.stringify({
          provider: "discord",
          callbackURL,
        }),
      });

      const res = await (handler as Record<string, (req: Request) => Promise<Response>>)["POST"]?.(cleanPostReq);
      if (res) {
        const responseHeaders = new Headers(res.headers);
        if (res.status === 302 || res.status === 307 || res.status === 308) {
          const location = res.headers.get("location");
          if (location) {
            return NextResponse.redirect(location, { headers: responseHeaders });
          }
        }
        const data = (await res.clone().json().catch(() => null)) as { url?: string } | null;
        if (data?.url) {
          return NextResponse.redirect(data.url, { headers: responseHeaders });
        }
      }
    } catch (error: unknown) {
      logger.error({ err: error }, "Failed to handle internal POST sign-in/social");
    }

    // Fallback: direct OAuth redirect
    const clientId = process.env.DISCORD_CLIENT_ID || "1533251353890127922";
    const redirectUri = encodeURIComponent(`${BETTER_AUTH_URL}/api/auth/callback/discord`);
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify+email+guilds.members.read`;
    
    return NextResponse.redirect(discordAuthUrl);
  }

  return safeHandler(request, "GET");
}

export async function POST(request: Request) {
  return safeHandler(request, "POST");
}

export async function PATCH(request: Request) {
  return safeHandler(request, "PATCH");
}

export async function PUT(request: Request) {
  return safeHandler(request, "PUT");
}

export async function DELETE(request: Request) {
  return safeHandler(request, "DELETE");
}
