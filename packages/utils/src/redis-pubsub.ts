import { Redis } from "@upstash/redis";
import { logger } from "./logger";

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn("Upstash Redis not configured; pub/sub disabled");
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export interface RegistrationEvent {
  type: "REGISTRATION_CREATED" | "REGISTRATION_STATUS_UPDATED";
  registrationId: string;
  passNumber: string;
  userId: string;
  discordUserId: string | null;
  discordUsername: string | null;
  userName: string;
  userEmail: string;
  interest: string;
  festivalName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WAITLISTED";
  messageId?: string;
  channelId?: string;
  rejectReason?: string;
  timestamp: string;
}

const CHANNEL = "gameverse:registrations";
const QUEUE_KEY = "gameverse:registrations:queue";

export async function publishRegistrationEvent(event: RegistrationEvent): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const payload = JSON.stringify(event);
    await Promise.all([
      redis.publish(CHANNEL, payload).catch(() => 0),
      redis.rpush(QUEUE_KEY, payload),
    ]);
    logger.info(`Published registration event: ${event.type}`, { registrationId: event.registrationId });
    return true;
  } catch (error) {
    logger.error(`Failed to publish registration event: ${event.type}`, { error: String(error), registrationId: event.registrationId });
    return false;
  }
}

export function subscribeToRegistrationEvents(
  handler: (event: RegistrationEvent) => void
): () => void {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn("Cannot subscribe: Redis not configured");
    return () => {};
  }

  let isPolling = true;

  const pollInterval = setInterval(async () => {
    if (!isPolling) return;
    try {
      const payload = await redis.lpop<string>(QUEUE_KEY);
      if (payload) {
        const rawString = typeof payload === "string" ? payload : JSON.stringify(payload);
        const event = JSON.parse(rawString) as RegistrationEvent;
        logger.info(`Received queued registration event: ${event.type}`, { registrationId: event.registrationId });
        handler(event);
      }
    } catch (parseError) {
      logger.error("Failed to parse queued registration event", { error: String(parseError) });
    }
  }, 1000);

  logger.info("Subscribed to registration events queue");

  return () => {
    isPolling = false;
    clearInterval(pollInterval);
  };
}
