// Thin fetch wrapper: resolves the base URL, attaches the bearer token when
// present, and throws a typed ApiError carrying the backend's message on
// non-2xx responses.

import { LANGUAGE_STORAGE_KEY } from "../i18n";

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:8080/api";

export const TOKEN_KEY = "meet2be_token";
export const USER_KEY = "meet2be_user";

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

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
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
