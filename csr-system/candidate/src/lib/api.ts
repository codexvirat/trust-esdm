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
  accessToken?: string | null;
  cache?: RequestCache;
}

/**
 * Every backend call from the manager app goes through here — one place to
 * attach the bearer token, parse errors into a typed ApiError, and keep the
 * backend's base URL out of every call site.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson && payload && typeof payload === "object" && "message" in payload ? String((payload as { message: unknown }).message) : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, isJson ? (payload as { details?: unknown }).details : undefined);
  }

  return payload as T;
}
