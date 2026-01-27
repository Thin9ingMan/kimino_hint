export class AppError extends Error {
  public recoveryUrl?: string;
  public cause?: unknown;

  constructor(
    message: string,
    options?: { recoveryUrl?: string; cause?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.recoveryUrl = options?.recoveryUrl;
    this.cause = options?.cause;
  }
}

export type ApiErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "bad_request"
  | "server"
  | "unknown";


export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    message: string,
    args: { kind: ApiErrorKind; status?: number; cause?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = args.kind;
    this.status = args.status;
    this.cause = args.cause;
  }
}

function readStatus(err: unknown): number | undefined {
  const anyErr = err as any;
  return (
    anyErr?.status ??
    anyErr?.response?.status ??
    anyErr?.cause?.status ??
    anyErr?.raw?.status
  );
}

export function isUnauthorized(err: unknown): boolean {
  const status = readStatus(err);
  if (status === 401) return true;
  const msg = String((err as any)?.message ?? "").toLowerCase();
  return (
    msg.includes("401") ||
    msg.includes("unauthorized") ||
    msg.includes("authentication required")
  );
}

export function toApiError(err: unknown): ApiError {
  const status = readStatus(err);

  if (status === 401) {
    return new ApiError("Authentication required", {
      kind: "unauthorized",
      status,
      cause: err,
    });
  }
  if (status === 403) {
    return new ApiError("Forbidden", { kind: "forbidden", status, cause: err });
  }
  if (status === 404) {
    return new ApiError("Not found", { kind: "not_found", status, cause: err });
  }
  if (status && status >= 400 && status < 500) {
    return new ApiError("Bad request", {
      kind: "bad_request",
      status,
      cause: err,
    });
  }
  if (status && status >= 500) {
    return new ApiError("Server error", { kind: "server", status, cause: err });
  }

  // Network / fetch errors are usually TypeError with message like 'Failed to fetch'
  const msg = String((err as any)?.message ?? "Unknown error");
  if (
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("network")
  ) {
    return new ApiError(msg, { kind: "network", cause: err });
  }

  return new ApiError(msg, { kind: "unknown", status, cause: err });
}
