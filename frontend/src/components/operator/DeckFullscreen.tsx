import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuthedImage } from "../../hooks/useAuthedImage";
import ChevronIcon from "../shared/ChevronIcon";
import type { PresentationDto } from "../../types/api";

/**
 * Full-viewport presenting surface for the active deck.
 *
 * Slide advancing is deliberately NOT handled here: PresentationPanel already
 * owns a document-level arrow-key listener that stays mounted while a deck is
 * live, so binding a second one would move two slides per press.
 */
export default function DeckFullscreen({
  presentation,
  onNavigate,
  onClose,
  isNavigating,
}: {
  presentation: PresentationDto;
  onNavigate: (slide: number) => void;
  onClose: () => void;
  isNavigating: boolean;
}) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const slideUrl = useAuthedImage(
    `/public/presentations/${presentation.id}/slides/${presentation.currentSlide}`,
  );

  // Native fullscreen is best-effort: browsers reject requestFullscreen when it
  // is not tied to a user gesture, and some kiosk setups disable it outright.
  // The overlay covers the viewport on its own, so a rejection is not an error.
  useEffect(() => {
    const node = overlayRef.current;
    node?.focus();
    node?.requestFullscreen?.().catch(() => {});

    // Matters when the fullscreen request is refused: without native
    // fullscreen the page behind stays scrollable under the overlay.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  // Leaving native fullscreen by any route (Esc, F11, browser UI) should also
  // dismiss the overlay, otherwise it lingers as a plain fixed panel.
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) onClose();
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onClose]);

  // Esc still has to work when the fullscreen request was refused, since then
  // the browser has no fullscreen state of its own to exit.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const atStart = presentation.currentSlide <= 1;
  const atEnd = presentation.currentSlide >= presentation.slideCount;

  // Portalled to <body>: .op-panel sets overflow: hidden, and the operator
  // module wrapper animates a transform, either of which would clip or
  // reposition a fixed overlay rendered in place.
  return createPortal(
    <div
      ref={overlayRef}
      className="deck-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label={t("operator.presentationPanel.fullscreenLabel")}
      tabIndex={-1}
    >
      {slideUrl && (
        <img
          className="deck-fullscreen-slide"
          src={slideUrl}
          alt={t("attendee.session.slides.slideAlt", {
            current: presentation.currentSlide,
            total: presentation.slideCount,
          })}
        />
      )}

      <div className="deck-fullscreen-bar">
        <button
          type="button"
          className="btn btn-sm btn-ghost btn-icon deck-fullscreen-btn"
          aria-label={t("operator.presentationPanel.previous")}
          disabled={atStart || isNavigating}
          onClick={() => onNavigate(presentation.currentSlide - 1)}
        >
          <ChevronIcon className="deck-chevron-prev" />
        </button>

        <span className="mono deck-fullscreen-position">
          {t("operator.presentationPanel.slidePosition", {
            current: presentation.currentSlide,
            total: presentation.slideCount,
          })}
        </span>

        <button
          type="button"
          className="btn btn-sm btn-ghost btn-icon deck-fullscreen-btn"
          aria-label={t("operator.presentationPanel.next")}
          disabled={atEnd || isNavigating}
          onClick={() => onNavigate(presentation.currentSlide + 1)}
        >
          <ChevronIcon className="deck-chevron-next" />
        </button>

        <button type="button" className="btn btn-sm btn-ghost deck-fullscreen-btn" onClick={onClose}>
          {t("operator.presentationPanel.exitFullscreen")}
        </button>
      </div>

      <p className="deck-fullscreen-hint">{t("operator.presentationPanel.fullscreenHint")}</p>
    </div>,
    document.body,
  );
}
