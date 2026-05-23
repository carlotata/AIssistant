/**
 * AIssistant REST API Client
 */

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Extracts a cookie value by name from document.cookie.
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

/**
 * Custom fetch wrapper for interacting with the AIssistant Fastify backend.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  // Always include session cookies in cross-origin requests
  options.credentials = "include";

  // Enforce header structure
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Auto-inject CSRF token for unsafe methods (POST, PUT, PATCH, DELETE)
  const method = (options.method || "GET").toUpperCase();
  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (unsafeMethods.includes(method)) {
    const csrfToken = getCookie("aissistant_csrf");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  options.headers = headers;

  const response = await fetch(url, options);

  if (response.status === 204) {
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new ApiError(response.status, "SERVER_ERROR", "An unexpected server error occurred");
    }
    return {} as T;
  }

  if (!response.ok) {
    const errorCode = data?.error?.code || "UNKNOWN_ERROR";
    const errorMessage = data?.error?.message || "An unexpected error occurred";
    throw new ApiError(response.status, errorCode, errorMessage);
  }

  return data as T;
}
