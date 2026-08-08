import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../../lib/api";
import type { GameQuestionDto, SessionLeaderboardDto } from "../../types/api";

interface DraftOption {
  label: string;
  correct: boolean;
}

function emptyOptions(): DraftOption[] {
  return [
    { label: "", correct: true },
    { label: "", correct: false },
  ];
}

export default function GamePanel({
  sessionId,
  questions,
  leaderboard,
  onUpsertQuestion,
}: {
  sessionId: string;
  questions: GameQuestionDto[];
  leaderboard: SessionLeaderboardDto | null;
  onUpsertQuestion: (question: GameQuestionDto) => void;
}) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [points, setPoints] = useState(100);
  const [options, setOptions] = useState<DraftOption[]>(emptyOptions());
  const [formError, setFormError] = useState<string | null>(null);

  const createQuestion = useMutation({
    mutationFn: () =>
      api.post<GameQuestionDto>(`/sessions/${sessionId}/games`, {
        prompt,
        points,
        options: options.map((o) => ({ label: o.label.trim(), correct: o.correct })).filter((o) => o.label),
      }),
    onSuccess: (question) => {
      onUpsertQuestion(question);
      setPrompt("");
      setPoints(100);
      setOptions(emptyOptions());
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("operator.gamePanel.createError"));
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "CLOSED" }) =>
      api.patch<GameQuestionDto>(`/games/${id}`, { status }),
    onSuccess: (question) => onUpsertQuestion(question),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = options.filter((o) => o.label.trim());
    if (!prompt.trim() || clean.length < 2) {
      setFormError(t("operator.gamePanel.formError"));
      return;
    }
    if (!clean.some((o) => o.correct)) {
      setFormError(t("operator.gamePanel.correctError"));
      return;
    }
    createQuestion.mutate();
  }

  function updateOptionLabel(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, label: value } : o)));
  }

  function setCorrect(i: number) {
    setOptions((prev) => prev.map((o, idx) => ({ ...o, correct: idx === i })));
  }

  function addOption() {
    setOptions((prev) => [...prev, { label: "", correct: false }]);
  }

  function removeOption(i: number) {
    setOptions((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((_, idx) => idx !== i);
      if (!next.some((o) => o.correct)) next[0].correct = true;
      return next;
    });
  }

  const sorted = [...questions].sort((a, b) => (a.status === "ACTIVE" ? -1 : b.status === "ACTIVE" ? 1 : 0));
  const entries = leaderboard?.entries ?? [];

  return (
    <div className="op-panel">
      <div className="op-panel-head">
        <h4 style={{ margin: 0 }}>{t("operator.gamePanel.heading")}</h4>
        <span className="mono op-panel-head-meta" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
          {t("common.count.questions", { count: questions.length })}
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
            <label htmlFor="game-prompt">{t("operator.gamePanel.questionLabel")}</label>
            <input
              id="game-prompt"
              className="input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("operator.gamePanel.questionPlaceholder")}
            />
          </div>
          <div className="field">
            <label htmlFor="game-points">{t("operator.gamePanel.pointsLabel")}</label>
            <input
              id="game-points"
              type="number"
              min={10}
              step={10}
              className="input"
              value={points}
              onChange={(e) => setPoints(Math.max(10, Number(e.target.value) || 0))}
            />
          </div>
          <div className="poll-form-options">
            {options.map((o, i) => (
              <div className={`game-option-row${o.correct ? " is-correct" : ""}`} key={i}>
                <button
                  type="button"
                  className={`game-correct-toggle${o.correct ? " selected" : ""}`}
                  onClick={() => setCorrect(i)}
                  aria-pressed={o.correct}
                  aria-label={o.correct ? t("operator.gamePanel.isCorrect", { n: i + 1 }) : t("operator.gamePanel.markCorrect", { n: i + 1 })}
                >
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <input
                  className="input"
                  value={o.label}
                  onChange={(e) => updateOptionLabel(i, e.target.value)}
                  placeholder={t("operator.gamePanel.optionPlaceholder", { n: i + 1 })}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-icon"
                    onClick={() => removeOption(i)}
                    aria-label={t("operator.gamePanel.removeOption", { n: i + 1 })}
                  >
                    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="helper-text" style={{ marginBottom: "var(--space-4)" }}>
            {t("operator.gamePanel.helperText")}
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={addOption}>
              {t("operator.gamePanel.addOption")}
            </button>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={createQuestion.isPending}>
            {createQuestion.isPending ? t("operator.gamePanel.creating") : t("operator.gamePanel.addQuestion")}
          </button>
        </form>

        <hr className="rule" />

        {sorted.length === 0 && (
          <div className="empty-state">
            <p>{t("operator.gamePanel.empty")}</p>
          </div>
        )}

        {sorted.map((question) => {
          const total = question.options.reduce((sum, o) => sum + o.answerCount, 0);
          const revealed = question.status === "CLOSED";
          return (
            <div className={`poll-card${question.status === "ACTIVE" ? " is-active" : ""}`} key={question.id}>
              <div className="poll-card-head">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{question.prompt}</p>
                  <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
                    {t("common.count.answers", { count: total })} · {question.points} {t("common.points")}
                  </span>
                </div>
                <span
                  className={`badge${question.status === "ACTIVE" ? " badge-live" : question.status === "CLOSED" ? "" : " badge-warn"}`}
                >
                  {t(`common.activityStatus.${question.status}`)}
                </span>
              </div>
              {question.options.map((opt) => {
                const pct = total > 0 ? Math.round((opt.answerCount / total) * 100) : 0;
                return (
                  <div className="poll-result-row" key={opt.id}>
                    <span style={revealed && opt.correct ? { color: "var(--color-success)", fontWeight: 600 } : undefined}>
                      {opt.label}
                      {revealed && opt.correct ? " ✓" : ""}
                    </span>
                    <div className="poll-result-track">
                      <div
                        className="poll-result-fill"
                        style={{
                          width: `${pct}%`,
                          background: revealed && opt.correct ? "var(--color-success)" : undefined,
                        }}
                      />
                    </div>
                    <span className="mono">{opt.answerCount}</span>
                  </div>
                );
              })}
              <div className="poll-card-actions">
                {question.status === "DRAFT" && (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: question.id, status: "ACTIVE" })}
                  >
                    {t("common.activate")}
                  </button>
                )}
                {question.status === "ACTIVE" && (
                  <button
                    className="btn btn-sm btn-danger"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: question.id, status: "CLOSED" })}
                  >
                    {t("operator.gamePanel.closeAndReveal")}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {entries.length > 0 && (
          <>
            <hr className="rule" />
            <p className="mono" style={{ color: "var(--color-ink-faint)", marginBottom: "var(--space-3)" }}>
              {t("common.leaderboard")}
            </p>
            <ol className="leaderboard-list">
              {entries.map((entry, i) => (
                <li key={entry.playerId} className="leaderboard-row">
                  <span className="leaderboard-rank">{i + 1}</span>
                  <span className="leaderboard-name">{entry.playerName}</span>
                  <span className="mono leaderboard-points">
                    {entry.totalPoints} {t("common.points")}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
