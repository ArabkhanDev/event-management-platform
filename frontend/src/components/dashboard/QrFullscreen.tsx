import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

/**
 * Full-viewport QR display for scanning across a room — mirrors
 * DeckFullscreen's approach (native fullscreen best-effort, overlay covers
 * the viewport regardless of whether the browser grants it).
 */
export default function QrFullscreen({
  dataUrl,
  eventName,
  joinCode,
  onClose,
}: {
  dataUrl: string;
  eventName: string;
  joinCode: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = overlayRef.current;
    node?.focus();
    node?.requestFullscreen?.().catch(() => {});

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) onClose();
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={overlayRef}
      className="qr-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label={t("dashboard.eventDetail.qrFullscreenLabel")}
      tabIndex={-1}
      onClick={onClose}
    >
      <button
        type="button"
        className="btn btn-sm btn-ghost qr-fullscreen-close"
        onClick={onClose}
      >
        {t("dashboard.eventDetail.qrFullscreenClose")}
      </button>

      <p className="qr-fullscreen-name">{eventName}</p>
      <img src={dataUrl} alt="" className="qr-fullscreen-image" onClick={(e) => e.stopPropagation()} />
      <p className="mono qr-fullscreen-code">{joinCode}</p>
      <p className="qr-fullscreen-hint">{t("dashboard.eventDetail.qrFullscreenHint")}</p>
    </div>,
    document.body,
  );
}
