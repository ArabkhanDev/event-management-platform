import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import DashboardNav from "../../components/layout/DashboardNav";
import { api, ApiError } from "../../lib/api";
import type { AccountUsageDto, EventDto, EventStatus } from "../../types/api";

export default function EventsList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.get<EventDto[]>("/events"),
  });
  // No plan purchase flow exists yet — every account is FREE until support
  // upgrades it manually — so this is informational, not a paywall.
  const { data: usage } = useQuery({
    queryKey: ["account-usage"],
    queryFn: () => api.get<AccountUsageDto>("/account/usage"),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createEvent = useMutation({
    mutationFn: () =>
      api.post<EventDto>("/events", {
        name,
        description,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // A new event is the exact action the usage chip is meant to reflect —
      // leaving it stale here would be wrong on the one action that matters most.
      queryClient.invalidateQueries({ queryKey: ["account-usage"] });
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("dashboard.eventsList.createError"));
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createEvent.mutate();
  }

  const statusBadgeText = (s: EventStatus) => t(`common.eventStatus.${s}`);

  return (
    <>
      <DashboardNav />
      <main className="container section-tight">
        <div className="dash-header">
          <div>
            <p className="eyebrow">{t("dashboard.eventsList.eyebrow")}</p>
            <h2>{t("dashboard.eventsList.heading")}</h2>
          </div>
          {usage && (
            <div className="usage-chip">
              <span className="usage-chip-plan">{t(`dashboard.plan.${usage.plan}`)}</span>
              <span className="usage-chip-detail">
                {usage.eventsPerYear === null
                  ? t("dashboard.usage.eventsUnlimited")
                  : t("dashboard.usage.eventsOf", { used: usage.eventsUsedThisYear, total: usage.eventsPerYear })}
              </span>
              <Link to="/plans" className="usage-chip-link">
                {t("dashboard.usage.upgrade")}
              </Link>
            </div>
          )}
        </div>

        <div className="two-col">
          <section>
            {isLoading && (
              <div className="grid event-list-grid" aria-busy="true" aria-label={t("dashboard.eventsList.loadingLabel")}>
                {[0, 1].map((i) => (
                  <div className="event-cell" key={i} style={{ pointerEvents: "none" }}>
                    <div className="skeleton skeleton-line" style={{ width: "60%", height: "1.5rem" }} />
                    <div className="skeleton skeleton-line" style={{ width: "90%" }} />
                    <div className="skeleton skeleton-line" style={{ width: "40%" }} />
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="form-error" role="alert">
                {t("dashboard.eventsList.loadError")}
              </p>
            )}
            {events && events.length === 0 && (
              <div className="card empty-state">
                <p>{t("dashboard.eventsList.empty")}</p>
              </div>
            )}
            {events && events.length > 0 && (
              <div className="grid event-list-grid">
                {events.map((ev) => (
                  <Link to={`/dashboard/events/${ev.id}`} className="event-cell" key={ev.id}>
                    <div className="event-cell-top">
                      <h4>{ev.name}</h4>
                      <span className={`badge${ev.status === "LIVE" ? " badge-live" : ev.status === "ENDED" ? "" : " badge-warn"}`}>
                        {statusBadgeText(ev.status)}
                      </span>
                    </div>
                    <p style={{ margin: 0 }}>{ev.description}</p>
                    <span className="join-code">{t("dashboard.eventsList.joinCodeLabel", { code: ev.joinCode })}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card card-raised">
            <h3 style={{ marginBottom: "var(--space-5)" }}>{t("dashboard.eventsList.createHeading")}</h3>
            <form onSubmit={onSubmit}>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="field">
                <label htmlFor="ev-name">{t("dashboard.eventsList.name")}</label>
                <input
                  id="ev-name"
                  className="input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ev-desc">{t("dashboard.eventsList.description")}</label>
                <textarea
                  id="ev-desc"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="inline-form cols-2">
                <div className="field">
                  <label htmlFor="ev-start">{t("dashboard.eventsList.startDate")}</label>
                  <input
                    id="ev-start"
                    type="date"
                    className="input"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ev-end">{t("dashboard.eventsList.endDate")}</label>
                  <input
                    id="ev-end"
                    type="date"
                    className="input"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={createEvent.isPending}>
                {createEvent.isPending ? t("dashboard.eventsList.creating") : t("dashboard.eventsList.create")}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
