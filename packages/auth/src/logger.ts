const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL as LogLevel];
}

function formatMessage(level: string, msg: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${msg}${metaStr}`;
}

export const logger = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", msg, meta));
    }
  },
  info(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) {
      console.info(formatMessage("info", msg, meta));
    }
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", msg, meta));
    }
  },
  error(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog("error")) {
      console.error(formatMessage("error", msg, meta));
    }
  },
  fatal(msg: string, meta?: Record<string, unknown>) {
    console.error(formatMessage("fatal", msg, meta));
  },
};