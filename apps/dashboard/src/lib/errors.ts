import { AuthError } from "./auth";
import { logger } from "./logger";

const log = logger.child({ module: "server-action" });

interface ActionError {
  success: false;
  error: string;
  code: string;
}

interface ActionSuccess<T> {
  success: true;
  data: T;
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "You must be signed in to perform this action",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "The requested resource was not found",
  VALIDATION_ERROR: "The provided data is invalid",
  CONFLICT: "A conflict occurred with the existing data",
  RATE_LIMITED: "Too many requests. Please try again later",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later",
};

export function createErrorResponse(code: string, message?: string): ActionError {
  return {
    success: false,
    error: message ?? ERROR_MESSAGES[code] ?? "An unexpected error occurred. Please try again later",
    code,
  };
}

export function handleActionError(error: unknown): ActionError {
  if (error instanceof AuthError) {
    return createErrorResponse(error.code, error.message);
  }

  if (error instanceof Error) {
    log.error({ err: error }, error.message);
  } else {
    log.error({ err: error }, "Unknown error");
  }

  return createErrorResponse("INTERNAL_ERROR");
}

export function ok<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}
