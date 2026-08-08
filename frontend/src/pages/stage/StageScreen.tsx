import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/stage.css";
import { api } from "../../lib/api";
import { useSessionSocket } from "../../lib/ws";
import type { StageState } from "../../types/api";

export default function StageScreen() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [state, setState] = useState<StageState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api
      .get<StageState>(`/public/sessions/${sessionId}/stage-state`)
      .then((res) => {
        if (!cancelled) setState(res);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useSessionSocket(
    sessionId,
    ["stage"],
    useCallback((_topic, type, payload) => {
      if (type === "STAGE_STATE") {
        setState(payload as StageState);
      }
    }, [])
  );

  const mode = state?.stageMode ?? "IDLE";

  return (
    <div className="stage-root">
      <div className="stage-topbar">
        <span>{t("stage.topbar")}</span>
        {mode !== "IDLE" && mode !== "BREAK" && <span className="stage-live-dot">{t("stage.live")}</span>}
      </div>
      <div className="stage-body" aria-live="polite">
        {!loaded && (
          <p className="mono" style={{ color: "var(--color-ink-faint-on-dark)" }}>
            {t("stage.connecting")}
          </p>
        )}

        {loaded && mode === "QUESTION" && state?.question && (
          <div className="stage-question">
            <p>"{state.question.body}"</p>
            <span className="author">— {state.question.authorName || t("common.anonymous")}</span>
          </div>
        )}

        {loaded && mode === "POLL" && state?.poll && <PollDisplay poll={state.poll} />}

        {loaded && mode === "GAME" && state?.leaderboard && state.leaderboard.entries.length > 0 && (
          <LeaderboardDisplay leaderboard={state.leaderboard} />
        )}

        {loaded && mode === "BREAK" && (
          <div className="stage-idle">
            <h2>{t("stage.breakHeading")}</h2>
            <p>{t("stage.breakBody")}</p>
          </div>
        )}

        {loaded &&
          (mode === "IDLE" ||
            (mode === "QUESTION" && !state?.question) ||
            (mode === "POLL" && !state?.poll) ||
            (mode === "GAME" && !state?.leaderboard?.entries.length)) && (
            <div className="stage-idle">
              <h2>{t("stage.idleHeading")}</h2>
              <p>{t("stage.idleBody")}</p>
            </div>
          )}
      </div>
    </div>
  );
}

function LeaderboardDisplay({ leaderboard }: { leaderboard: NonNullable<StageState["leaderboard"]> }) {
  const { t } = useTranslation();
  const top = leaderboard.entries.slice(0, 8);
  return (
    <div className="stage-leaderboard">
      <h2>{t("common.leaderboard")}</h2>
      <ol className="stage-leaderboard-list">
        {top.map((entry, i) => (
          <li key={entry.playerId} className={`stage-leaderboard-row${i < 3 ? " top" : ""}`}>
            <span className="rank">{i + 1}</span>
            <span className="name">{entry.playerName}</span>
            <span className="points mono">{entry.totalPoints}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PollDisplay({ poll }: { poll: NonNullable<StageState["poll"]> }) {
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
  return (
    <div className="stage-poll">
      <h2>{poll.prompt}</h2>
      {poll.options.map((opt) => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        return (
          <div className="stage-poll-row" key={opt.id}>
            <div className="stage-poll-row-label">
              <span>{opt.label}</span>
              <span>{pct}%</span>
            </div>
            <div className="stage-poll-track">
              <div className="stage-poll-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
