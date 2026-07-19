import "server-only";

const API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
}

/**
 * Every backend call from the public site goes through here — one place to
 * parse errors into a typed ApiError and keep the backend's base URL out of
 * every call site. Unlike the staff portals, this app never carries an
 * access token — every call here hits the unauthenticated /public/* surface.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson && payload && typeof payload === "object" && "message" in payload ? String((payload as { message: unknown }).message) : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, isJson ? (payload as { details?: unknown }).details : undefined);
  }

  return payload as T;
}
