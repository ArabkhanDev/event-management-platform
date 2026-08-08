import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import DashboardNav from "../../components/layout/DashboardNav";
import { api, ApiError } from "../../lib/api";
import type {
  AttendeeDto,
  AttendeeTag,
  CampaignAnalyticsDto,
  EmailCampaignDto,
  EventDto,
} from "../../types/api";

const TAG_OPTIONS: AttendeeTag[] = ["VIP", "SPEAKER", "SPONSOR", "ATTENDEE", "WAITLIST"];

function countForTags(attendees: AttendeeDto[], tags: AttendeeTag[]): number {
  if (!tags || tags.length === 0) return attendees.length;
  return attendees.filter((a) => tags.includes(a.tag)).length;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function CampaignAnalyticsBadges({ campaignId }: { campaignId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["campaign-analytics", campaignId],
    queryFn: () => api.get<CampaignAnalyticsDto>(`/campaigns/${campaignId}/analytics`),
    refetchInterval: 8000,
  });

  if (!data) return null;

  return (
    <div className="campaign-analytics-row">
      <span className="mono campaign-stat">
        {t("dashboard.eventCampaigns.open")} <strong>{pct(data.openRate)}</strong>
      </span>
      <span className="mono campaign-stat">
        {t("dashboard.eventCampaigns.click")} <strong>{pct(data.clickRate)}</strong>
      </span>
      <span className="mono campaign-stat">
        {t("dashboard.eventCampaigns.bounce")} <strong>{pct(data.bounceRate)}</strong>
      </span>
    </div>
  );
}

export default function EventCampaigns() {
  const { t, i18n } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => api.get<EventDto>(`/events/${eventId}`),
    enabled: !!eventId,
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", eventId],
    queryFn: () => api.get<EmailCampaignDto[]>(`/events/${eventId}/campaigns`),
    enabled: !!eventId,
  });

  const { data: attendees } = useQuery({
    queryKey: ["campaign-attendees", eventId],
    queryFn: () => api.get<AttendeeDto[]>(`/events/${eventId}/campaigns/attendees`),
    enabled: !!eventId,
  });

  const attendeeList = attendees ?? [];
  const totalAudienceSize = attendeeList.length;

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<AttendeeTag[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["campaigns", eventId] });
  }

  function resetForm() {
    setSubject("");
    setBody("");
    setSelectedTags([]);
    setEditingId(null);
    setFormError(null);
  }

  function toggleTag(tag: AttendeeTag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const createCampaign = useMutation({
    mutationFn: () =>
      api.post<EmailCampaignDto>(`/events/${eventId}/campaigns`, { subject, body, targetTags: selectedTags }),
    onSuccess: () => {
      resetForm();
      invalidate();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : t("dashboard.eventCampaigns.saveDraftError")),
  });

  const updateCampaign = useMutation({
    mutationFn: (id: string) => api.patch<EmailCampaignDto>(`/campaigns/${id}`, { subject, body }),
    onSuccess: () => {
      resetForm();
      invalidate();
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : t("dashboard.eventCampaigns.saveDraftError")),
  });

  const sendCampaign = useMutation({
    mutationFn: (id: string) => api.patch<EmailCampaignDto>(`/campaigns/${id}`, { status: "SENT" }),
    onSuccess: () => {
      setConfirmSendId(null);
      setSendError(null);
      invalidate();
    },
    onError: (err) =>
      setSendError(err instanceof ApiError ? err.message : t("dashboard.eventCampaigns.sendError")),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/campaigns/${id}`),
    onSuccess: () => {
      setConfirmDeleteId(null);
      invalidate();
    },
  });

  const updateAttendeeTag = useMutation({
    mutationFn: ({ attendeeId, tag }: { attendeeId: string; tag: AttendeeTag }) =>
      api.patch<AttendeeDto>(`/events/${eventId}/attendees/${attendeeId}`, { tag }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-attendees", eventId] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setFormError(t("dashboard.eventCampaigns.requiredError"));
      return;
    }
    setFormError(null);
    if (editingId) {
      updateCampaign.mutate(editingId);
    } else {
      createCampaign.mutate();
    }
  }

  function startEdit(campaign: EmailCampaignDto) {
    setEditingId(campaign.id);
    setSubject(campaign.subject);
    setBody(campaign.body);
    setFormError(null);
  }

  const saving = createCampaign.isPending || updateCampaign.isPending;
  const segmentAudienceSize = countForTags(attendeeList, selectedTags);
  const locale = i18n.resolvedLanguage || i18n.language || "en";

  return (
    <>
      <DashboardNav />
      <main className="container section-tight">
        <div className="dash-header">
          <div>
            <p className="eyebrow">
              <Link to={event ? `/dashboard/events/${event.id}` : "/dashboard"} style={{ textDecoration: "none", color: "inherit" }}>
                ← {event ? event.name : t("dashboard.eventCampaigns.backFallback")}
              </Link>
            </p>
            <h2>{t("dashboard.eventCampaigns.heading")}</h2>
          </div>
          <span className="badge">{t("dashboard.eventCampaigns.audienceCaptured", { count: totalAudienceSize })}</span>
        </div>

        <div className="notice">
          <p style={{ margin: 0 }}>
            <strong>{t("dashboard.eventCampaigns.noticeBold")}</strong> {t("dashboard.eventCampaigns.noticeRest")}
          </p>
        </div>

        <div className="two-col">
          <section>
            <h3 style={{ marginBottom: "var(--space-5)" }}>{t("dashboard.eventCampaigns.sentDrafted")}</h3>
            {isLoading && (
              <div className="card">
                <div className="skeleton skeleton-line" style={{ width: "60%" }} />
                <div className="skeleton skeleton-line" style={{ width: "90%" }} />
              </div>
            )}
            {!isLoading && (campaigns?.length ?? 0) === 0 && (
              <div className="card empty-state">
                <p>{t("dashboard.eventCampaigns.empty")}</p>
              </div>
            )}
            {(campaigns ?? []).map((c) => {
              const campaignAudience = countForTags(attendeeList, c.targetTags);
              return (
                <div className="card campaign-item" key={c.id}>
                  <div className="campaign-item-head">
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{c.subject}</p>
                      <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
                        {c.status === "SENT"
                          ? t("dashboard.eventCampaigns.sentSummary", {
                              date: new Date(c.sentAt as string).toLocaleString(locale),
                              count: c.recipientCount ?? 0,
                            })
                          : t("dashboard.eventCampaigns.draftSummary", { date: new Date(c.createdAt).toLocaleString(locale) })}
                      </span>
                      <div>
                        <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
                          {c.targetTags.length === 0
                            ? t("dashboard.eventCampaigns.targetsEveryone")
                            : t("dashboard.eventCampaigns.targets", {
                                tags: c.targetTags.map((tag) => t(`common.attendeeTag.${tag}`)).join(", "),
                              })}
                        </span>
                      </div>
                    </div>
                    <span className={`badge${c.status === "SENT" ? " badge-ok" : " badge-warn"}`}>
                      {t(`common.campaignStatus.${c.status}`)}
                    </span>
                  </div>
                  <p className="campaign-item-body">{c.body}</p>
                  {c.status === "SENT" && <CampaignAnalyticsBadges campaignId={c.id} />}
                  {c.status === "DRAFT" && (
                    <div className="campaign-item-actions">
                      {confirmDeleteId === c.id ? (
                        <>
                          <span className="mono" style={{ fontSize: "var(--fs-mono)", color: "var(--color-ink-faint)" }}>
                            {t("dashboard.eventCampaigns.deleteConfirm")}
                          </span>
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={deleteCampaign.isPending}
                            onClick={() => deleteCampaign.mutate(c.id)}
                          >
                            {t("dashboard.eventCampaigns.yesDelete")}
                          </button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(null)}>
                            {t("dashboard.eventCampaigns.cancel")}
                          </button>
                        </>
                      ) : confirmSendId === c.id ? (
                        <>
                          <span className="mono" style={{ fontSize: "var(--fs-mono)", color: "var(--color-ink-faint)" }}>
                            {t("dashboard.eventCampaigns.sendConfirm", { count: campaignAudience })}
                          </span>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={sendCampaign.isPending}
                            onClick={() => sendCampaign.mutate(c.id)}
                          >
                            {sendCampaign.isPending ? t("dashboard.eventCampaigns.sending") : t("dashboard.eventCampaigns.confirmSend")}
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => {
                              setConfirmSendId(null);
                              setSendError(null);
                            }}
                          >
                            {t("dashboard.eventCampaigns.cancel")}
                          </button>
                          {sendError && (
                            <p className="form-error" role="alert" style={{ width: "100%", marginTop: "var(--space-2)" }}>
                              {sendError}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <button className="btn btn-sm btn-ghost" onClick={() => startEdit(c)}>
                            {t("dashboard.eventCampaigns.edit")}
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setConfirmSendId(c.id);
                              setSendError(null);
                            }}
                          >
                            {t("dashboard.eventCampaigns.sendButton")}
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteId(c.id)}>
                            {t("dashboard.eventCampaigns.delete")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <section className="card card-raised">
            <h3 style={{ marginBottom: "var(--space-5)" }}>
              {editingId ? t("dashboard.eventCampaigns.editDraftHeading") : t("dashboard.eventCampaigns.composeHeading")}
            </h3>
            <form onSubmit={onSubmit}>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="field">
                <label htmlFor="c-subject">{t("dashboard.eventCampaigns.subject")}</label>
                <input
                  id="c-subject"
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("dashboard.eventCampaigns.subjectPlaceholder")}
                />
              </div>
              <div className="field">
                <label htmlFor="c-body">{t("dashboard.eventCampaigns.message")}</label>
                <textarea
                  id="c-body"
                  className="input"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("dashboard.eventCampaigns.messagePlaceholder")}
                />
              </div>
              {!editingId && (
                <div className="field">
                  <label>{t("dashboard.eventCampaigns.audience")}</label>
                  <div className="chip-toggle-group">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`chip-toggle${selectedTags.includes(tag) ? " active" : ""}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {t(`common.attendeeTag.${tag}`)}
                      </button>
                    ))}
                  </div>
                  <p className="mono" style={{ fontSize: "var(--fs-mono)", color: "var(--color-ink-faint)", marginTop: "var(--space-2)" }}>
                    {selectedTags.length === 0
                      ? t("dashboard.eventCampaigns.noSegments", { count: totalAudienceSize })
                      : t("dashboard.eventCampaigns.segmentMatch", { count: segmentAudienceSize })}
                  </p>
                </div>
              )}
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                  {saving
                    ? t("common.saving")
                    : editingId
                      ? t("dashboard.eventCampaigns.saveChanges")
                      : t("dashboard.eventCampaigns.saveDraft")}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-ghost" onClick={resetForm}>
                    {t("dashboard.eventCampaigns.cancel")}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        <section style={{ marginTop: "var(--space-8)" }}>
          <h3 style={{ marginBottom: "var(--space-5)" }}>{t("dashboard.eventCampaigns.segmentsHeading")}</h3>
          <div className="card">
            {attendeeList.length === 0 && (
              <div className="empty-state">
                <p>{t("dashboard.eventCampaigns.segmentsEmpty")}</p>
              </div>
            )}
            {attendeeList.map((a) => (
              <div key={a.id} className="attendee-row">
                <span className="mono attendee-email">{a.email}</span>
                <div className="chip-toggle-group sm">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`chip-toggle sm${a.tag === tag ? " active" : ""}`}
                      disabled={updateAttendeeTag.isPending}
                      onClick={() => updateAttendeeTag.mutate({ attendeeId: a.id, tag })}
                    >
                      {t(`common.attendeeTag.${tag}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
