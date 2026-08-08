import { useEffect, useState } from "react";
import { API_BASE, TOKEN_KEY } from "../lib/api";

/**
 * Loads an image through fetch so the bearer token can be attached, and hands
 * back an object URL to put in `src`.
 *
 * `<img src>` cannot send an Authorization header, but the slide route is
 * gated on session state — and an organiser has to preview a deck while the
 * session is still SCHEDULED, when that route is closed to everyone but the
 * owner. Attendees keep using a plain `<img>`: by the time they see slides the
 * session is live and the route is public.
 *
 * Pass null to load nothing.
 */
export function useAuthedImage(path: string | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setObjectUrl(null);
      return;
    }

    let cancelled = false;
    let created: string | null = null;

    const headers: Record<string, string> = {};
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // Storage blocked (private mode, embedded webview): fall through to an
      // unauthenticated request, which still succeeds once the session is live.
    }

    fetch(`${API_BASE}${path}`, { headers })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(String(res.status)))))
      .then((blob) => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      })
      .catch(() => {
        if (!cancelled) setObjectUrl(null);
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [path]);

  return objectUrl;
}
