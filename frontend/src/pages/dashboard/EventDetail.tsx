import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import DashboardNav from "../../components/layout/DashboardNav";
import EventQrCode from "../../components/dashboard/EventQrCode";
import { api, ApiError } from "../../lib/api";
import type { EventDto, EventStatus, SessionDto, SessionStatus } from "../../types/api";

function CopyCodeButton({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard permission denied — fail silently, code is already on screen
    }
  }
  return (
    <button type="button" className="btn btn-sm btn-ghost text-on-dark" onClick={onCopy}>
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
      {copied ? t("dashboard.eventDetail.copied") : t("dashboard.eventDetail.copyCode")}
    </button>
  );
}

const STATUS_OPTIONS: EventStatus[] = ["DRAFT", "LIVE", "ENDED"];
const SESSION_STATUS_OPTIONS: SessionStatus[] = ["SCHEDULED", "LIVE", "ENDED"];

/** Reuses the event toggle's colour classes: scheduled reads as draft. */
const SESSION_STATUS_CLASS: Record<SessionStatus, string> = {
  SCHEDULED: "status-draft",
  LIVE: "status-live",
  ENDED: "status-ended",
};

export default function EventDetail() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.get<EventDto>(`/events/${eventId}`),
    enabled: !!eventId,
  });

  const updateStatus = useMutation({
    mutationFn: (status: EventStatus) => api.patch<EventDto>(`/events/${eventId}`, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["event", eventId], updated);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Attendee access is gated on this, so it is the control that actually opens
  // a talk up rather than a cosmetic label.
  const updateSessionStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) =>
      api.patch<SessionDto>(`/sessions/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const [title, setTitle] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [hallName, setHallName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createSession = useMutation({
    mutationFn: () =>
      api.post<SessionDto>(`/events/${eventId}/sessions`, {
        title,
        speakerName,
        hallName,
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      }),
    onSuccess: () => {
      setTitle("");
      setSpeakerName("");
      setHallName("");
      setStartTime("");
      setEndTime("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("dashboard.eventDetail.addSessionError"));
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createSession.mutate();
  }

  if (isLoading) {
    return (
      <>
        <DashboardNav />
        <main className="container section-tight" aria-busy="true" aria-label={t("dashboard.eventDetail.loadingLabel")}>
          <div className="skeleton skeleton-line" style={{ width: "40%", height: "2.5rem", marginBottom: "var(--space-6)" }} />
          <div className="skeleton skeleton-block" style={{ marginBottom: "var(--space-8)" }} />
          <div className="skeleton skeleton-line" style={{ width: "100%" }} />
          <div className="skeleton skeleton-line" style={{ width: "90%" }} />
          <div className="skeleton skeleton-line" style={{ width: "75%" }} />
        </main>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <DashboardNav />
        <main className="container section-tight">
          <p className="form-error" role="alert">
            {t("dashboard.eventDetail.loadError")}
          </p>
          <Link to="/dashboard" className="btn btn-ghost">
            {t("dashboard.eventDetail.backToDashboard")}
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNav />
      <main className="container section-tight">
        <div className="dash-header">
          <div>
            <p className="eyebrow">
              <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
                {t("dashboard.eventDetail.backToDashboardShort")}
              </Link>
            </p>
            <h2>{event.name}</h2>
            <p style={{ maxWidth: "60ch" }}>{event.description}</p>
          </div>
          <div className="status-toggle" role="group" aria-label="Event status">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`status-toggle-btn status-${s.toLowerCase()}${event.status === s ? " active" : ""}`}
                aria-pressed={event.status === s}
                disabled={updateStatus.isPending || event.status === s}
                onClick={() => updateStatus.mutate(s)}
              >
                {t(`common.eventStatus.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="join-code-display" style={{ marginBottom: "var(--space-8)" }}>
          <p className="eyebrow">{t("dashboard.eventDetail.joinCodeEyebrow")}</p>
          <div className="code">{event.joinCode}</div>
          <p className="hint mono">{t("dashboard.eventDetail.joinCodeHint")}</p>
          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
            <CopyCodeButton code={event.joinCode} />
            <Link className="btn btn-sm btn-ghost text-on-dark" to={`/dashboard/events/${event.id}/campaigns`}>
              {t("dashboard.eventDetail.emailCampaigns")}
            </Link>
          </div>
          <EventQrCode
            joinUrl={`${window.location.origin}/join/${event.joinCode}`}
            joinCode={event.joinCode}
            eventName={event.name}
          />
        </div>

        <div className="two-col">
          <section>
            <h3 style={{ marginBottom: "var(--space-5)" }}>{t("dashboard.eventDetail.sessionsHeading")}</h3>
            {event.sessions.length === 0 && (
              <div className="card empty-state">
                <p>{t("dashboard.eventDetail.sessionsEmpty")}</p>
              </div>
            )}
            {event.sessions.length > 0 && (
              <div className="card" style={{ padding: 0 }}>
                {event.sessions.map((s, i) => (
                  <div key={s.id}>
                    {i > 0 && <hr className="rule" />}
                    <div className="session-row">
                      <Link to={`/operator/${s.id}`} className="session-row-main">
                        <strong style={{ display: "block" }}>{s.title}</strong>
                        <span className="session-row-meta">
                          {s.speakerName} · {s.hallName}
                        </span>
                      </Link>
                      <div className="status-toggle" role="group" aria-label={t("dashboard.eventDetail.sessionStatusLabel")}>
                        {SESSION_STATUS_OPTIONS.map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={`status-toggle-btn ${SESSION_STATUS_CLASS[st]}${s.status === st ? " active" : ""}`}
                            aria-pressed={s.status === st}
                            disabled={updateSessionStatus.isPending || s.status === st}
                            onClick={() => updateSessionStatus.mutate({ id: s.id, status: st })}
                          >
                            {t(`common.sessionStatus.${st}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card card-raised">
            <h3 style={{ marginBottom: "var(--space-5)" }}>{t("dashboard.eventDetail.addSessionHeading")}</h3>
            <form onSubmit={onSubmit}>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="field">
                <label htmlFor="s-title">{t("dashboard.eventDetail.title")}</label>
                <input
                  id="s-title"
                  className="input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="inline-form cols-2">
                <div className="field">
                  <label htmlFor="s-speaker">{t("dashboard.eventDetail.speaker")}</label>
                  <input
                    id="s-speaker"
                    className="input"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="s-hall">{t("dashboard.eventDetail.hall")}</label>
                  <input
                    id="s-hall"
                    className="input"
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                  />
                </div>
              </div>
              <div className="inline-form cols-2">
                <div className="field">
                  <label htmlFor="s-start">{t("dashboard.eventDetail.startTime")}</label>
                  <input
                    id="s-start"
                    type="datetime-local"
                    className="input"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="s-end">{t("dashboard.eventDetail.endTime")}</label>
                  <input
                    id="s-end"
                    type="datetime-local"
                    className="input"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={createSession.isPending}>
                {createSession.isPending ? t("dashboard.eventDetail.adding") : t("dashboard.eventDetail.addSession")}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
