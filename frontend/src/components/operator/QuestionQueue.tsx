import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { exportQuestionsCsv } from "../../lib/reportExports";
import DownloadIcon from "../shared/DownloadIcon";
import type { QuestionDto, QuestionStatus } from "../../types/api";

const TAB_KEYS: (QuestionStatus | "ALL")[] = ["PENDING", "APPROVED", "ON_SCREEN", "REJECTED", "ALL"];

const STATUS_BADGE_CLASS: Record<QuestionStatus, string> = {
  PENDING: "badge-warn",
  APPROVED: "badge-ok",
  ON_SCREEN: "badge-live",
  REJECTED: "",
};

export default function QuestionQueue({
  sessionId,
  liveQuestions,
}: {
  sessionId: string;
  liveQuestions: Map<string, QuestionDto>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<QuestionStatus | "ALL">("PENDING");

  const { data, isLoading } = useQuery({
    queryKey: ["questions", sessionId],
    queryFn: () => api.get<QuestionDto[]>(`/sessions/${sessionId}/questions`),
  });

  // Merge the initial REST fetch with anything that has arrived over the
  // socket since — the socket map always wins for ids it knows about.
  const merged = useMemo(() => {
    const map = new Map<string, QuestionDto>();
    (data ?? []).forEach((q) => map.set(q.id, q));
    liveQuestions.forEach((q, id) => map.set(id, q));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [data, liveQuestions]);

  const filtered = tab === "ALL" ? merged : merged.filter((q) => q.status === tab);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuestionStatus }) =>
      api.patch<QuestionDto>(`/questions/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
    },
  });

  return (
    <div className="op-panel">
      <div className="op-panel-head">
        <h4 style={{ margin: 0 }}>{t("operator.questionQueue.heading")}</h4>
        <div className="op-panel-head-meta">
          <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
            {t("operator.questionQueue.total", { count: merged.length })}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => exportQuestionsCsv(sessionId, merged)}
            disabled={merged.length === 0}
          >
            <DownloadIcon />
            {t("common.exportCsv")}
          </button>
        </div>
      </div>
      <div className="q-tabs" role="group" aria-label={t("operator.questionQueue.filterAriaLabel")}>
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            className={`q-tab${tab === key ? " active" : ""}`}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            type="button"
          >
            {key === "ALL" ? t("operator.questionQueue.tabAll") : t(`common.questionStatus.${key}`)}
          </button>
        ))}
      </div>
      <div className="op-panel-body" aria-live="polite" aria-busy={isLoading}>
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div className="q-item" key={i}>
              <div className="skeleton skeleton-line" style={{ width: "50%" }} />
              <div className="skeleton skeleton-line" style={{ width: "85%" }} />
            </div>
          ))}
        {!isLoading && filtered.length === 0 && (
          <div className="empty-state">
            <p>{t("operator.questionQueue.empty")}</p>
          </div>
        )}
        {filtered.map((q) => (
          <div className={`q-item${q.status === "ON_SCREEN" ? " onscreen" : ""}`} key={q.id}>
            <div className="q-item-meta">
              <span>{q.authorName || t("common.anonymous")}</span>
              <span className={`badge ${STATUS_BADGE_CLASS[q.status]}`}>{t(`common.questionStatus.${q.status}`)}</span>
            </div>
            <p className="q-item-body">{q.body}</p>
            <div className="q-item-actions">
              {q.status !== "APPROVED" && (
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: q.id, status: "APPROVED" })}
                >
                  {t("operator.questionQueue.approve")}
                </button>
              )}
              {q.status !== "ON_SCREEN" && (
                <button
                  className="btn btn-sm btn-primary"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: q.id, status: "ON_SCREEN" })}
                >
                  {t("operator.questionQueue.sendToScreen")}
                </button>
              )}
              {q.status !== "REJECTED" && (
                <button
                  className="btn btn-sm btn-danger"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: q.id, status: "REJECTED" })}
                >
                  {t("operator.questionQueue.reject")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
