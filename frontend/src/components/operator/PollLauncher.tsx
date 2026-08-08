import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../../lib/api";
import { exportPollCsv } from "../../lib/reportExports";
import DownloadIcon from "../shared/DownloadIcon";
import type { PollDto } from "../../types/api";

export default function PollLauncher({
  sessionId,
  polls,
  onUpsert,
}: {
  sessionId: string;
  polls: PollDto[];
  onUpsert: (poll: PollDto) => void;
}) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [formError, setFormError] = useState<string | null>(null);

  const createPoll = useMutation({
    mutationFn: () =>
      api.post<PollDto>(`/sessions/${sessionId}/polls`, {
        prompt,
        options: options.map((o) => o.trim()).filter(Boolean),
      }),
    onSuccess: (poll) => {
      onUpsert(poll);
      setPrompt("");
      setOptions(["", ""]);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : t("operator.pollLauncher.createError"));
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "CLOSED" }) =>
      api.patch<PollDto>(`/polls/${id}`, { status }),
    onSuccess: (poll) => onUpsert(poll),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (!prompt.trim() || clean.length < 2) {
      setFormError(t("operator.pollLauncher.formError"));
      return;
    }
    createPoll.mutate();
  }

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    setOptions((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  const sorted = [...polls].sort((a, b) => (a.status === "ACTIVE" ? -1 : b.status === "ACTIVE" ? 1 : 0));

  return (
    <div className="op-panel">
      <div className="op-panel-head">
        <h4 style={{ margin: 0 }}>{t("operator.pollLauncher.heading")}</h4>
        <span className="mono op-panel-head-meta" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
          {t("common.count.polls", { count: polls.length })}
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
            <label htmlFor="poll-prompt">{t("operator.pollLauncher.prompt")}</label>
            <input
              id="poll-prompt"
              className="input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("operator.pollLauncher.promptPlaceholder")}
            />
          </div>
          <div className="poll-form-options">
            {options.map((o, i) => (
              <div className="poll-option-row" key={i}>
                <input
                  className="input"
                  value={o}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={t("operator.pollLauncher.optionPlaceholder", { n: i + 1 })}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-icon"
                    onClick={() => removeOption(i)}
                    aria-label={t("operator.pollLauncher.removeOption", { n: i + 1 })}
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
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={addOption}>
              {t("operator.pollLauncher.addOption")}
            </button>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={createPoll.isPending}>
            {createPoll.isPending ? t("operator.pollLauncher.launching") : t("operator.pollLauncher.launch")}
          </button>
        </form>

        <hr className="rule" />

        {sorted.length === 0 && (
          <div className="empty-state">
            <p>{t("operator.pollLauncher.empty")}</p>
          </div>
        )}

        {sorted.map((poll) => {
          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
          return (
            <div className={`poll-card${poll.status === "ACTIVE" ? " is-active" : ""}`} key={poll.id}>
              <div className="poll-card-head">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{poll.prompt}</p>
                  <span className="mono" style={{ color: "var(--color-ink-faint)", fontSize: "var(--fs-mono)" }}>
                    {t("common.count.votes", { count: totalVotes })}
                  </span>
                </div>
                <span
                  className={`badge${poll.status === "ACTIVE" ? " badge-live" : poll.status === "CLOSED" ? "" : " badge-warn"}`}
                >
                  {t(`common.activityStatus.${poll.status}`)}
                </span>
              </div>
              {poll.options.map((opt) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
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
              <div className="poll-card-actions">
                {poll.status === "DRAFT" && (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: poll.id, status: "ACTIVE" })}
                  >
                    {t("common.activate")}
                  </button>
                )}
                {poll.status === "ACTIVE" && (
                  <button
                    className="btn btn-sm btn-danger"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: poll.id, status: "CLOSED" })}
                  >
                    {t("operator.pollLauncher.close")}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => exportPollCsv(poll)}
                  disabled={totalVotes === 0}
                >
                  <DownloadIcon />
                  {t("common.exportCsv")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
