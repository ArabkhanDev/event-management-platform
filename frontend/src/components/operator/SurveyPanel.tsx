import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../../lib/api";
import { exportSurveyCsv } from "../../lib/reportExports";
import ChevronIcon from "../shared/ChevronIcon";
import DownloadIcon from "../shared/DownloadIcon";
import type { SurveyDto, SurveyQuestionType, SurveyResults, SurveyStatus } from "../../types/api";

function surveyBadgeClass(status: SurveyStatus): string {
  if (status === "ACTIVE") return "badge badge-live";
  if (status === "DRAFT") return "badge badge-warn";
  return "badge";
}

interface DraftQuestion {
  prompt: string;
  type: SurveyQuestionType;
  options: string[];
}

const TYPE_KEYS: SurveyQuestionType[] = ["RATING", "TEXT", "SINGLE_CHOICE", "DROPDOWN"];

function emptyQuestion(): DraftQuestion {
  return { prompt: "", type: "RATING", options: [] };
}

export default function SurveyPanel({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const [surveys, setSurveys] = useState<Pick<SurveyDto, "id" | "title" | "status">[]>([]);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);

  const { data: initialSurveys } = useQuery({
    queryKey: ["surveys", sessionId],
    queryFn: () => api.get<SurveyDto[]>(`/sessions/${sessionId}/surveys`),
  });

  useEffect(() => {
    if (!initialSurveys) return;
    setSurveys((prev) => {
      const known = new Set(prev.map((s) => s.id));
      const merged = [...prev, ...initialSurveys.filter((s) => !known.has(s.id)).map((s) => ({ id: s.id, title: s.title, status: s.status }))];
      return merged;
    });
    setActiveSurveyId((prev) => prev ?? initialSurveys[0]?.id ?? null);
  }, [initialSurveys]);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [formError, setFormError] = useState<string | null>(null);

  const createSurvey = useMutation({
    mutationFn: () =>
      api.post<SurveyDto>(`/sessions/${sessionId}/surveys`, {
        title,
        questions: questions.map((q) => ({
          prompt: q.prompt,
          type: q.type,
          options: q.type === "SINGLE_CHOICE" || q.type === "DROPDOWN" ? q.options.filter(Boolean) : undefined,
        })),
      }),
    onSuccess: (survey) => {
      setSurveys((prev) => [{ id: survey.id, title: survey.title, status: survey.status }, ...prev]);
      setActiveSurveyId(survey.id);
      setTitle("");
      setQuestions([emptyQuestion()]);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("operator.surveyPanel.createError"));
    },
  });

  const setSurveyStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SurveyStatus }) =>
      api.patch<SurveyDto>(`/surveys/${id}`, { status }),
    onSuccess: (survey) => {
      setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...s, status: survey.status } : s)));
    },
  });

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId) || null;

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [pickerOpen]);

  const { data: results, isFetching: resultsLoading } = useQuery({
    queryKey: ["survey-results", activeSurveyId],
    queryFn: () => api.get<SurveyResults>(`/surveys/${activeSurveyId}/results`),
    enabled: !!activeSurveyId,
    refetchInterval: activeSurvey?.status === "ACTIVE" ? 5000 : false,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || questions.some((q) => !q.prompt.trim())) {
      setFormError(t("operator.surveyPanel.formError"));
      return;
    }
    createSurvey.mutate();
  }

  function updateQuestion(i: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  return (
    <div className="op-panel">
      <div className="op-panel-head">
        <h4 style={{ margin: 0 }}>{t("operator.surveyPanel.heading")}</h4>
        <span className="mono op-panel-head-meta" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
          {t("operator.surveyPanel.created", { count: surveys.length })}
        </span>
      </div>
      <div className="op-panel-body">
        <form onSubmit={onSubmit}>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="field">
            <label htmlFor="survey-title">{t("operator.surveyPanel.title")}</label>
            <input id="survey-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {questions.map((q, i) => (
            <div key={i} className="card" style={{ marginBottom: "var(--space-3)" }}>
              <div className="field">
                <label>{t("operator.surveyPanel.questionLabel", { n: i + 1 })}</label>
                <input
                  className="input"
                  value={q.prompt}
                  onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                  placeholder={t("home.featureDeepDive.surveyPreviewPrompt")}
                />
              </div>
              <div className="field">
                <label>{t("operator.surveyPanel.typeLabel")}</label>
                <select
                  className="input"
                  value={q.type}
                  onChange={(e) => updateQuestion(i, { type: e.target.value as SurveyQuestionType })}
                >
                  {TYPE_KEYS.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {t(`operator.surveyPanel.types.${typeKey}`)}
                    </option>
                  ))}
                </select>
              </div>
              {(q.type === "SINGLE_CHOICE" || q.type === "DROPDOWN") && (
                <div className="field">
                  <label>{t("operator.surveyPanel.optionsLabel")}</label>
                  <input
                    className="input"
                    value={q.options.join(", ")}
                    onChange={(e) => updateQuestion(i, { options: e.target.value.split(",").map((o) => o.trim()) })}
                    placeholder={t("operator.surveyPanel.optionsPlaceholder")}
                  />
                </div>
              )}
              {questions.length > 1 && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeQuestion(i)}>
                  {t("operator.surveyPanel.removeQuestion")}
                </button>
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={addQuestion}>
              {t("operator.surveyPanel.addQuestion")}
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={createSurvey.isPending}>
            {createSurvey.isPending ? t("operator.surveyPanel.creating") : t("operator.surveyPanel.create")}
          </button>
        </form>

        <hr className="rule" />

        {surveys.length === 0 && (
          <div className="empty-state">
            <p>{t("operator.surveyPanel.empty")}</p>
          </div>
        )}

        {surveys.length > 0 && (
          <div className="field" style={{ marginBottom: "var(--space-2)" }}>
            <span className="survey-picker-label" id="survey-picker-label">
              {t("operator.surveyPanel.viewingResultsFor")}
            </span>
            <div className="survey-picker" ref={pickerRef}>
              <button
                type="button"
                className="survey-picker-trigger"
                aria-haspopup="listbox"
                aria-expanded={pickerOpen}
                aria-labelledby="survey-picker-label"
                onClick={() => setPickerOpen((v) => !v)}
              >
                <span className="survey-picker-trigger-title">{activeSurvey?.title ?? t("operator.surveyPanel.selectSurvey")}</span>
                {activeSurvey && <span className={surveyBadgeClass(activeSurvey.status)}>{t(`common.activityStatus.${activeSurvey.status}`)}</span>}
                <ChevronIcon className={`survey-picker-chevron${pickerOpen ? " open" : ""}`} />
              </button>
              {pickerOpen && (
                <ul className="survey-picker-list" role="listbox" aria-labelledby="survey-picker-label">
                  {surveys.map((s) => (
                    <li key={s.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={s.id === activeSurveyId}
                        className={`survey-picker-option${s.id === activeSurveyId ? " active" : ""}`}
                        onClick={() => {
                          setActiveSurveyId(s.id);
                          setPickerOpen(false);
                        }}
                      >
                        <span className="survey-picker-option-title">{s.title}</span>
                        <span className={surveyBadgeClass(s.status)}>{t(`common.activityStatus.${s.status}`)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeSurvey && (
          <div className="status-select-row" style={{ marginBottom: "var(--space-4)" }}>
            <span
              className={`badge${activeSurvey.status === "ACTIVE" ? " badge-live" : activeSurvey.status === "CLOSED" ? "" : " badge-warn"}`}
            >
              {t(`common.activityStatus.${activeSurvey.status}`)}
            </span>
            {activeSurvey.status === "DRAFT" && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setSurveyStatus.mutate({ id: activeSurvey.id, status: "ACTIVE" })}
                disabled={setSurveyStatus.isPending}
              >
                {t("common.activate")}
              </button>
            )}
            {activeSurvey.status === "ACTIVE" && (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => setSurveyStatus.mutate({ id: activeSurvey.id, status: "CLOSED" })}
                disabled={setSurveyStatus.isPending}
              >
                {t("operator.surveyPanel.close")}
              </button>
            )}
          </div>
        )}

        {activeSurveyId && resultsLoading && !results && (
          <div aria-busy="true" aria-label={t("operator.surveyPanel.loadingResultsLabel")}>
            <div className="skeleton skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton skeleton-block" />
          </div>
        )}

        {results && (
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                rowGap: "var(--space-3)",
                columnGap: "var(--space-4)",
                marginBottom: "var(--space-4)",
              }}
            >
              <p className="mono" style={{ color: "var(--color-ink-faint)", margin: 0, whiteSpace: "nowrap" }}>
                {t("common.count.responses", { count: results.responseCount })}
              </p>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => exportSurveyCsv(results)}
                disabled={results.responseCount === 0}
              >
                <DownloadIcon />
                {t("common.exportCsv")}
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
        )}
      </div>
    </div>
  );
}
