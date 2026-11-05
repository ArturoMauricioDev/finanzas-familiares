import { errorDetailKeys, errorStatusKeys } from "./generated/error-keys";

export interface ErrorDescriptor {
  status: number;
  key: string | null;
  fallback: string;
}

export class ConfigurationError extends Error {
  messageKey: string;
  fallbackDetail: string;

  constructor(messageKey: string, fallbackDetail = "") {
    super(fallbackDetail || messageKey);
    this.name = "ConfigurationError";
    this.messageKey = messageKey;
    this.fallbackDetail = fallbackDetail;
  }
}

export class ApiError extends Error {
  status: number;
  messageKey: string | null;
  fallbackDetail: string;

  constructor(status: number, messageKey?: string | null, fallbackDetail?: string);
  constructor(message: string, status: number);
  constructor(
    first: number | string,
    second?: number | string | null,
    third?: string,
  ) {
    if (typeof first === "number") {
      const status = first;
      const messageKey = typeof second === "string" ? second : null;
      const fallbackDetail = third ?? "";
      super(fallbackDetail || messageKey || `Error ${status}`);
      this.name = "ApiError";
      this.status = status;
      this.messageKey = messageKey;
      this.fallbackDetail = fallbackDetail;
      return;
    }

    const status = typeof second === "number" ? second : 0;
    super(first);
    this.name = "ApiError";
    this.status = status;
    this.messageKey = null;
    this.fallbackDetail = first;
  }
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return null;
}

export function resolveError(status: number, detail?: unknown): ErrorDescriptor {
  const detailValue = detailMessage(detail);
  const detailKey = detailValue ? errorDetailKeys[detailValue as keyof typeof errorDetailKeys] : null;
  const statusKey = errorStatusKeys[String(status) as keyof typeof errorStatusKeys] ?? null;

  return {
    status,
    key: detailKey ?? statusKey,
    fallback: detailValue ?? "",
  };
}

export function errorText(
  error: unknown,
  translate: (key: string) => string,
  fallback: string,
): string {
  if (error instanceof ApiError) {
    if (error.messageKey) return translate(error.messageKey);
    if (error.fallbackDetail) return error.fallbackDetail;
    const key = errorStatusKeys[String(error.status) as keyof typeof errorStatusKeys];
    if (key) return translate(key);
  }
  if (error instanceof ConfigurationError && error.messageKey) {
    return translate(error.messageKey);
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function translateApiError(status: number, detail?: unknown): string {
  const descriptor = resolveError(status, detail);
  return descriptor.key ?? descriptor.fallback;
}
