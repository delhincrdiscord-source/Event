import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Do NOT use transport.target (e.g. "pino/file") — it spawns worker threads
// whose paths get mangled by webpack, causing MODULE_NOT_FOUND at runtime.
// Write directly to stdout (destination: 1) instead.
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "botToken",
        "clientSecret",
        "token",
        "secret",
      ],
      remove: true,
    },
  },
  pino.destination(1),
);

export function createChildLogger(name: string) {
  return logger.child({ module: name });
}
