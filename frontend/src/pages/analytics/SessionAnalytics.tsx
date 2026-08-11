import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import "../../styles/operator.css";
import "../../styles/analytics.css";
import DashboardNav from "../../components/layout/DashboardNav";
import DownloadIcon from "../../components/shared/DownloadIcon";
import { api } from "../../lib/api";
import { exportFullSessionReport, exportPollCsv, exportQuestionsCsv, exportSurveyCsv } from "../../lib/reportExports";
import type { PollDto, QuestionDto, QuestionStatus, SessionDto, SurveyDto, SurveyResults } from "../../types/api";

const STATUS_KEYS: QuestionStatus[] = ["PENDING", "APPROVED", "ON_SCREEN", "REJECTED"];

export default function SessionAnalytics() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [exporting, setExporting] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.get<SessionDto>(`/sessions/${sessionId}`),
    enabled: !!sessionId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", sessionId],
    queryFn: () => api.get<QuestionDto[]>(`/sessions/${sessionId}/questions`),
    enabled: !!sessionId,
  });

  const { data: polls, isLoading: pollsLoading } = useQuery({
    queryKey: ["polls", sessionId],
    queryFn: () => api.get<PollDto[]>(`/sessions/${sessionId}/polls`),
    enabled: !!sessionId,
  });

  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ["surveys", sessionId],
    queryFn: () => api.get<SurveyDto[]>(`/sessions/${sessionId}/surveys`),
    enabled: !!sessionId,
  });

  const surveyResultsQueries = useQueries({
    queries: (surveys ?? []).map((s) => ({
      queryKey: ["survey-results", s.id],
      queryFn: () => api.get<SurveyResults>(`/surveys/${s.id}/results`),
      enabled: !!surveys,
    })),
  });

  const surveyResultsList = useMemo(
    () => surveyResultsQueries.map((q) => q.data).filter((r): r is SurveyResults => !!r),
    [surveyResultsQueries]
  );
  const surveyResultsLoading = surveysLoading || surveyResultsQueries.some((q) => q.isLoading);

  const questionsByStatus = useMemo(() => {
    const counts: Record<QuestionStatus, number> = { PENDING: 0, APPROVED: 0, ON_SCREEN: 0, REJECTED: 0 };
    (questions ?? []).forEach((q) => {
      counts[q.status] += 1;
    });
    return counts;
  }, [questions]);

  const totalVotes = useMemo(
    () => (polls ?? []).reduce((sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0), 0),
    [polls]
  );

  const totalResponses = useMemo(
    () => surveyResultsList.reduce((sum, r) => sum + r.responseCount, 0),
    [surveyResultsList]
  );

  const loading = questionsLoading || pollsLoading || surveysLoading;

  return (
    <>
      <DashboardNav />
      <main className="container section-tight">
        <div className="op-header">
          <div>
            <p className="eyebrow">
              {session ? (
                <Link to={`/operator/${sessionId}`} style={{ textDecoration: "none", color: "inherit" }}>
                  {t("analytics.backToOperator")}
                </Link>
              ) : (
                t("analytics.fallbackTitle")
              )}
            </p>
            {session ? (
              <>
                <h2>{session.title}</h2>
                <p className="op-header-meta">
                  {session.speakerName} · {session.hallName}
                </p>
              </>
            ) : (
              <div className="skeleton skeleton-line" style={{ width: "18rem", height: "2rem" }} />
            )}
          </div>
          <div className="op-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={loading || surveyResultsLoading || exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportFullSessionReport(
                    session?.title || sessionId || "session",
                    questions ?? [],
                    polls ?? [],
                    surveyResultsList
                  );
                } finally {
                  setExporting(false);
                }
              }}
            >
              <DownloadIcon />
              {exporting ? t("analytics.exporting") : t("analytics.exportFullReport")}
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-tile">
            <span className="value">{questions?.length ?? "–"}</span>
            <span className="label">{t("analytics.stats.questions")}</span>
          </div>
          <div className="stat-tile">
            <span className="value">{questionsByStatus.ON_SCREEN}</span>
            <span className="label">{t("analytics.stats.sentToScreen")}</span>
          </div>
          <div className="stat-tile">
            <span className="value">{polls?.length ?? "–"}</span>
            <span className="label">{t("analytics.stats.polls")}</span>
          </div>
          <div className="stat-tile">
            <span className="value">{totalVotes}</span>
            <span className="label">{t("analytics.stats.votesCast")}</span>
          </div>
          <div className="stat-tile">
            <span className="value">{surveys?.length ?? "–"}</span>
            <span className="label">{t("analytics.stats.surveys")}</span>
          </div>
          <div className="stat-tile">
            <span className="value">{totalResponses}</span>
            <span className="label">{t("analytics.stats.surveyResponses")}</span>
          </div>
        </div>

        <section className="analytics-section">
          <div className="analytics-section-head">
            <h3 style={{ margin: 0 }}>{t("analytics.qaHeading")}</h3>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={!questions || questions.length === 0}
              onClick={() => exportQuestionsCsv(sessionId || "session", questions ?? [])}
            >
              <DownloadIcon />
              {t("common.exportCsv")}
            </button>
          </div>
          {!loading && (!questions || questions.length === 0) ? (
            <div className="analytics-empty">{t("analytics.qaEmpty")}</div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {STATUS_KEYS.map((status) => (
                <div key={status} style={{ padding: "var(--space-5)", textAlign: "center" }}>
                  <span className="value mono" style={{ fontSize: "var(--fs-display-sm)", display: "block" }}>
                    {questionsByStatus[status]}
                  </span>
                  <span className="label mono" style={{ fontSize: "var(--fs-mono)", color: "var(--color-ink-faint)" }}>
                    {t(`common.questionStatus.${status}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="analytics-section">
          <div className="analytics-section-head">
            <h3 style={{ margin: 0 }}>{t("analytics.pollHeading")}</h3>
          </div>
          {!pollsLoading && (!polls || polls.length === 0) ? (
            <div className="analytics-empty">{t("analytics.pollEmpty")}</div>
          ) : (
            (polls ?? []).map((poll) => {
              const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
              return (
                <div className="poll-card" style={{ marginBottom: "var(--space-4)" }} key={poll.id}>
                  <div className="poll-card-head">
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{poll.prompt}</p>
                      <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
                        {t("common.count.votes", { count: total })} · {t(`common.activityStatus.${poll.status}`)}
                      </span>
                    </div>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => exportPollCsv(poll)}>
                      <DownloadIcon />
                      {t("analytics.export")}
                    </button>
                  </div>
                  {poll.options.map((opt) => {
                    const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                    return (
                      <div className="poll-result-row" key={opt.id}>
                        <span>{opt.label}</span>
                        <div className="poll-result-track">
                          <div className="poll-result-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="mono">{opt.votes}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </section>

        <section className="analytics-section">
          <div className="analytics-section-head">
            <h3 style={{ margin: 0 }}>{t("analytics.surveyHeading")}</h3>
          </div>
          {!surveyResultsLoading && surveyResultsList.length === 0 ? (
            <div className="analytics-empty">{t("analytics.surveyEmpty")}</div>
          ) : (
            surveyResultsList.map((results) => (
              <div key={results.surveyId} style={{ marginBottom: "var(--space-6)" }}>
                <div className="analytics-section-head" style={{ marginBottom: "var(--space-3)" }}>
                  <p className="mono" style={{ margin: 0, color: "var(--color-ink-faint)" }}>
                    {results.title} · {t("common.count.responses", { count: results.responseCount })}
                  </p>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => exportSurveyCsv(results)}>
                    <DownloadIcon />
                    {t("analytics.export")}
                  </button>
                </div>
                {results.questions.map((rq) => (
                  <div className="survey-result-block" key={rq.questionId}>
                    <p style={{ fontWeight: 600, marginBottom: "var(--space-3)" }}>{rq.prompt}</p>
                    {rq.type === "TEXT"
                      ? (rq.aggregate as string[]).map((answer, i) => (
                          <p className="survey-text-answer" key={i}>
                            "{answer}"
                          </p>
                        ))
                      : (rq.aggregate as { option: string; count: number }[]).map((a) => {
                          const max = Math.max(
                            1,
                            ...(rq.aggregate as { option: string; count: number }[]).map((x) => x.count)
                          );
                          const pct = Math.round((a.count / max) * 100);
                          return (
                            <div className="poll-result-row" key={a.option}>
                              <span>{a.option}</span>
                              <div className="poll-result-track">
                                <div className="poll-result-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="mono">{a.count}</span>
                            </div>
                          );
                        })}
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}
