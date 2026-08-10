import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../../lib/api";
import { useAuthedImage } from "../../hooks/useAuthedImage";
import ChevronIcon from "../shared/ChevronIcon";
import ExpandIcon from "../shared/ExpandIcon";
import UploadIcon from "../shared/UploadIcon";
import DeckFullscreen from "./DeckFullscreen";
import type { PresentationDto } from "../../types/api";

export default function PresentationPanel({
  sessionId,
  presentations,
  onUpsert,
  onRemove,
}: {
  sessionId: string;
  presentations: PresentationDto[];
  onUpsert: (presentation: PresentationDto) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return api.post<PresentationDto>(`/sessions/${sessionId}/presentations`, body);
    },
    onSuccess: (presentation) => {
      onUpsert(presentation);
      setUploadError(null);
    },
    onError: (err) => {
      setUploadError(err instanceof ApiError ? err.message : t("operator.presentationPanel.uploadError"));
    },
  });

  // The newest slide a request has been fired for, and how many of those are
  // still outstanding. Arrow presses arrive faster than the PATCH round-trips,
  // and stepping from the last *confirmed* slide makes quick presses collapse
  // onto the same target, silently dropping slides.
  const pendingSlideRef = useRef<number | null>(null);
  const inFlightSlideRef = useRef(0);

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<PresentationDto, "status" | "currentSlide" | "downloadEnabled">>;
    }) => api.patch<PresentationDto>(`/presentations/${id}`, patch),
    onSuccess: (presentation) => onUpsert(presentation),
    onSettled: (_data, _error, variables) => {
      if (variables.patch.currentSlide === undefined) return;
      inFlightSlideRef.current -= 1;
      // Only once the whole burst has settled does the confirmed slide agree
      // with the last requested one, making it safe to step from props again.
      if (inFlightSlideRef.current <= 0) {
        inFlightSlideRef.current = 0;
        pendingSlideRef.current = null;
      }
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/presentations/${id}`),
    onSuccess: (_data, id) => {
      onRemove(id);
      setConfirmDeleteId(null);
    },
  });

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (upload.isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload.mutate(file);
  }

  function onDragOver(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!upload.isPending) setIsDragging(true);
  }

  const active = presentations.find((p) => p.status === "ACTIVE") ?? null;

  // Stopping or deleting the deck while presenting must not leave the operator
  // stranded on a full-viewport overlay with nothing behind it.
  useEffect(() => {
    if (!active) setIsFullscreen(false);
  }, [active]);

  // A different deck starts at its own position, so any in-flight target from
  // the previous one is meaningless.
  useEffect(() => {
    pendingSlideRef.current = null;
    inFlightSlideRef.current = 0;
  }, [active?.id]);

  // Only the active deck renders a preview, so one loader at component level is
  // enough — and hooks cannot be called from inside the list below.
  const activeSlideUrl = useAuthedImage(
    active ? `/public/presentations/${active.id}/slides/${active.currentSlide}` : null,
  );

  function goToSlide(presentation: PresentationDto, slide: number) {
    if (slide < 1 || slide > presentation.slideCount) return;
    pendingSlideRef.current = slide;
    inFlightSlideRef.current += 1;
    update.mutate({ id: presentation.id, patch: { currentSlide: slide } });
  }

  // Steps relative to the newest requested slide rather than the last confirmed
  // one, so holding down an arrow key does not lose slides.
  function stepSlide(presentation: PresentationDto, delta: number) {
    const from = pendingSlideRef.current ?? presentation.currentSlide;
    goToSlide(presentation, from + delta);
  }

  // Arrow keys drive the deck while one is live — a presenter should not have
  // to aim at a button between slides.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!active) return;
      if (e.key === "ArrowRight") stepSlide(active, 1);
      if (e.key === "ArrowLeft") stepSlide(active, -1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.currentSlide, active?.slideCount]);

  return (
    <div className="op-panel">
      <div className="op-panel-head">
        <h4 style={{ margin: 0 }}>{t("operator.presentationPanel.heading")}</h4>
        <span className="mono op-panel-head-meta" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
          {presentations.length}
        </span>
      </div>
      <div className="op-panel-body">
        <div className="field">
          <label htmlFor="deck-upload">{t("operator.presentationPanel.uploadLabel")}</label>
          <input
            id="deck-upload"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="visually-hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            className={`upload-dropzone${isDragging ? " is-dragging" : ""}`}
            disabled={upload.isPending}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <UploadIcon />
            <span className="upload-dropzone-text">
              {upload.isPending ? (
                t("operator.presentationPanel.uploading")
              ) : (
                <>
                  <strong>{t("operator.presentationPanel.choosePdf")}</strong>{" "}
                  {t("operator.presentationPanel.dragDropHint")}
                </>
              )}
            </span>
            <span className="upload-dropzone-hint">{t("operator.presentationPanel.uploadHint")}</span>
          </button>
        </div>

        {uploadError && (
          <p className="form-error" role="alert">
            {uploadError}
          </p>
        )}

        <hr className="rule" />

        {presentations.length === 0 && (
          <div className="empty-state">
            <p>{t("operator.presentationPanel.empty")}</p>
          </div>
        )}

        {presentations.map((p) => {
          const isActive = p.status === "ACTIVE";
          return (
            <div className={`poll-card${isActive ? " is-active" : ""}`} key={p.id}>
              <div className="poll-card-head">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{p.title}</p>
                  <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
                    {t("operator.presentationPanel.slideCount", { count: p.slideCount })}
                  </span>
                </div>
                <span className={`badge${isActive ? " badge-live" : ""}`}>{t(`common.activityStatus.${p.status}`)}</span>
              </div>

              {isActive && (
                <>
                  <div className="deck-preview">
                    {activeSlideUrl && (
                      <img
                        src={activeSlideUrl}
                        alt={t("attendee.session.slides.slideAlt", { current: p.currentSlide, total: p.slideCount })}
                      />
                    )}
                  </div>
                  <div className="deck-controls">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost btn-icon"
                      aria-label={t("operator.presentationPanel.previous")}
                      disabled={p.currentSlide <= 1 || update.isPending}
                      onClick={() => goToSlide(p, p.currentSlide - 1)}
                    >
                      <ChevronIcon className="deck-chevron-prev" />
                    </button>
                    <span className="mono deck-position">
                      {t("operator.presentationPanel.slidePosition", { current: p.currentSlide, total: p.slideCount })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost btn-icon"
                      aria-label={t("operator.presentationPanel.next")}
                      disabled={p.currentSlide >= p.slideCount || update.isPending}
                      onClick={() => goToSlide(p, p.currentSlide + 1)}
                    >
                      <ChevronIcon className="deck-chevron-next" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost deck-fullscreen-open"
                      onClick={() => setIsFullscreen(true)}
                    >
                      <ExpandIcon />
                      {t("operator.presentationPanel.fullscreen")}
                    </button>
                  </div>
                  <p className="helper-text">{t("operator.presentationPanel.keyboardHint")}</p>
                  <p className="submitted-note">{t("operator.presentationPanel.liveNote")}</p>
                </>
              )}

              {/* Permission, not an action — a checkbox reads as a standing
                  setting where a button would read as "download it now". */}
              <label className="deck-download-toggle">
                <input
                  type="checkbox"
                  checked={p.downloadEnabled}
                  disabled={update.isPending || !p.sourceAvailable}
                  onChange={(e) => update.mutate({ id: p.id, patch: { downloadEnabled: e.target.checked } })}
                />
                <span>{t("operator.presentationPanel.allowDownload")}</span>
              </label>
              {!p.sourceAvailable && (
                <p className="helper-text">{t("operator.presentationPanel.downloadUnavailable")}</p>
              )}

              <div className="poll-card-actions">
                {!isActive && (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: p.id, patch: { status: "ACTIVE" } })}
                  >
                    {t("operator.presentationPanel.activate")}
                  </button>
                )}
                {isActive && (
                  <button
                    className="btn btn-sm btn-danger"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: p.id, patch: { status: "CLOSED" } })}
                  >
                    {t("operator.presentationPanel.stop")}
                  </button>
                )}
                {confirmDeleteId === p.id ? (
                  <>
                    <span className="mono" style={{ fontSize: "var(--fs-mono)", color: "var(--color-ink-faint)" }}>
                      {t("operator.presentationPanel.deleteConfirm")}
                    </span>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(p.id)}
                    >
                      {t("operator.presentationPanel.yesDelete")}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(null)}>
                      {t("operator.presentationPanel.cancel")}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(p.id)}>
                    {t("operator.presentationPanel.delete")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFullscreen && active && (
        <DeckFullscreen
          presentation={active}
          isNavigating={update.isPending}
          onNavigate={(slide) => goToSlide(active, slide)}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}
