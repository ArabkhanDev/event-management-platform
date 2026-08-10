import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";
import QrFullscreen from "./QrFullscreen";

/**
 * Renders a QR code for the event's own /join/:code link — generated
 * entirely client-side (no network round trip, no third-party QR API) so it
 * works the instant the join code exists and never leaks the code to an
 * external service.
 */
export default function EventQrCode({
  joinUrl,
  joinCode,
  eventName,
}: {
  joinUrl: string;
  joinCode: string;
  eventName: string;
}) {
  const { t } = useTranslation();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 720px, not the 160px it's displayed at: the same image is projected
    // full-viewport on click, and an upscaled 160px source would blur badly
    // on a large screen or a printed poster.
    QRCode.toDataURL(joinUrl, { width: 720, margin: 2 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  if (!dataUrl) return null;

  return (
    <div className="event-qr">
      <button
        type="button"
        className="event-qr-trigger"
        onClick={() => setFullscreen(true)}
        aria-label={t("dashboard.eventDetail.qrFullscreenOpen")}
      >
        <img src={dataUrl} alt={t("dashboard.eventDetail.qrAlt")} className="event-qr-image" width={160} height={160} />
      </button>
      <a
        href={dataUrl}
        download={`${eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}-qr.png`}
        className="btn btn-sm btn-ghost text-on-dark"
      >
        {t("dashboard.eventDetail.qrDownload")}
      </a>

      {fullscreen && (
        <QrFullscreen dataUrl={dataUrl} eventName={eventName} joinCode={joinCode} onClose={() => setFullscreen(false)} />
      )}
    </div>
  );
}
