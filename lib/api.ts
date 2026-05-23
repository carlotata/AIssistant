/**
 * AIssistant REST API Client
 */

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
let csrfToken: string | null = null;
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const data = await apiFetch<{ csrfToken: string }>("/auth/csrf");
  csrfToken = data.csrfToken;
  return data.csrfToken;
}

async function parseApiResponse<T>(path: string, response: Response): Promise<T> {
  if (response.status === 204) {
    if (path === "/auth/logout") {
      csrfToken = null;
    }
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch {
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

  if (path === "/auth/csrf" && data?.csrfToken) {
    csrfToken = data.csrfToken;
  }

  return data as T;
}

async function sendApiRequest(path: string, options: RequestInit) {
  const url = `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, options);
}

function createRequestOptions(options: RequestInit = {}) {
  const requestOptions: RequestInit = { ...options, credentials: "include" };
  const headers = new Headers(options.headers || {});

  if (requestOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (requestOptions.method || "GET").toUpperCase();
  if (unsafeMethods.has(method)) {
    const token = csrfToken ?? getCookie("aissistant_csrf");
    if (token) {
      headers.set("X-CSRF-Token", token);
    }
  }

  requestOptions.headers = headers;
  return requestOptions;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const requestOptions = createRequestOptions(options);
  const response = await sendApiRequest(path, requestOptions);
  const method = (requestOptions.method || "GET").toUpperCase();

  if (unsafeMethods.has(method) && response.status === 403) {
    let errorCode = "";
    let errorMessage = "";

    try {
      const errorData = await response.clone().json();
      errorCode = errorData?.error?.code || "";
      errorMessage = errorData?.error?.message || "";
    } catch {
      // Fall through to normal response parsing below.
    }

    if (errorCode === "CSRF_TOKEN_INVALID") {
      csrfToken = null;
      await ensureCsrfToken();
      return parseApiResponse<T>(path, await sendApiRequest(path, createRequestOptions(options)));
    }

    if (errorMessage) {
      throw new ApiError(response.status, errorCode || "UNKNOWN_ERROR", errorMessage);
    }
  }

  return parseApiResponse<T>(path, response);
}

export async function logoutRequest() {
  await ensureCsrfToken();
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
