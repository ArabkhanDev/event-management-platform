// Thin fetch wrapper: resolves the base URL, attaches the bearer token when
// present, and throws a typed ApiError carrying the backend's message on
// non-2xx responses.

import { LANGUAGE_STORAGE_KEY } from "../i18n";

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:8080/api";

export const TOKEN_KEY = "auda_token";
export const USER_KEY = "auda_user";

function getLanguage(): string {
  try {
    return (localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en").slice(0, 2);
  } catch {
    return "en";
  }
}

export class ApiError extends Error {
  status: number;
  /**
   * Stable reason code from the backend, present only where the client has to
   * branch rather than just display — e.g. EVENT_NOT_STARTED vs EVENT_ENDED.
   */
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Reasons an attendee can be turned away from a session or event. */
export type AccessErrorCode =
  | "EVENT_NOT_STARTED"
  | "SESSION_NOT_STARTED"
  | "EVENT_ENDED"
  | "SESSION_ENDED"
  | "EVENT_FULL";

export function accessCodeOf(error: unknown): AccessErrorCode | null {
  if (!(error instanceof ApiError) || !error.code) return null;
  const known: AccessErrorCode[] = [
    "EVENT_NOT_STARTED",
    "SESSION_NOT_STARTED",
    "EVENT_ENDED",
    "SESSION_ENDED",
    "EVENT_FULL",
  ];
  return known.includes(error.code as AccessErrorCode) ? (error.code as AccessErrorCode) : null;
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // attach Authorization header when a token exists (default true)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers = {}, auth = true, ...rest } = options;

  const finalHeaders: Record<string, string> = { "Accept-Language": getLanguage(), ...headers };
  const isFormBody = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormBody) {
    finalHeaders["Content-Type"] = "Content-Type" in finalHeaders ? finalHeaders["Content-Type"] : "application/json";
  }

  let hasAuthToken = false;
  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
      hasAuthToken = true;
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormBody ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : null) || res.statusText || `Request failed with status ${res.status}`;
    const code =
      data && typeof data === "object" && "code" in data && typeof (data as { code?: unknown }).code === "string"
        ? (data as { code: string }).code
        : undefined;

    // Checked on every authenticated request, not just login (see
    // JwtAuthFilter): a token stays valid for up to seven days, so someone
    // blocked mid-session would otherwise keep hitting this on whatever
    // they're doing without ever being signed out. A hard redirect (not just
    // clearing storage) is used because this module has no React context to
    // update — AuthProvider's state wouldn't notice a localStorage change on
    // its own. Gated on hasAuthToken so the login request itself (which
    // never attaches a token) doesn't trigger this — otherwise the redirect
    // reloads the page out from under Login.tsx before it can show the
    // blocked-account error message.
    if (code === "ACCOUNT_BLOCKED" && hasAuthToken) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/login";
    }

    throw new ApiError(res.status, message, code);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};
