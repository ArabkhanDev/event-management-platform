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
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
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
    throw new ApiError(res.status, message);
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
