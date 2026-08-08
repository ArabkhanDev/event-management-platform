import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, API_BASE, ApiError } from "../../lib/api";
import ChevronIcon from "../shared/ChevronIcon";
import UploadIcon from "../shared/UploadIcon";
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

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<PresentationDto, "status" | "currentSlide">> }) =>
      api.patch<PresentationDto>(`/presentations/${id}`, patch),
    onSuccess: (presentation) => onUpsert(presentation),
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

  function goToSlide(presentation: PresentationDto, slide: number) {
    if (slide < 1 || slide > presentation.slideCount) return;
    update.mutate({ id: presentation.id, patch: { currentSlide: slide } });
  }

  // Arrow keys drive the deck while one is live — a presenter should not have
  // to aim at a button between slides.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!active) return;
      if (e.key === "ArrowRight") goToSlide(active, active.currentSlide + 1);
      if (e.key === "ArrowLeft") goToSlide(active, active.currentSlide - 1);
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
                    <img
                      src={`${API_BASE}/public/presentations/${p.id}/slides/${p.currentSlide}`}
                      alt={t("attendee.session.slides.slideAlt", { current: p.currentSlide, total: p.slideCount })}
                    />
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
                  </div>
                  <p className="helper-text">{t("operator.presentationPanel.keyboardHint")}</p>
                  <p className="submitted-note">{t("operator.presentationPanel.liveNote")}</p>
                </>
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
    </div>
  );
}
