import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/dashboard.css";
import "../../styles/operator.css";
import DashboardNav from "../../components/layout/DashboardNav";
import QuestionQueue from "../../components/operator/QuestionQueue";
import PollLauncher from "../../components/operator/PollLauncher";
import SurveyPanel from "../../components/operator/SurveyPanel";
import GamePanel from "../../components/operator/GamePanel";
import PresentationPanel from "../../components/operator/PresentationPanel";
import ArrowIcon from "../../components/shared/ArrowIcon";
import { api } from "../../lib/api";
import { useSessionSocket } from "../../lib/ws";
import type {
  GameQuestionDto,
  PollDto,
  PresentationDto,
  QuestionDto,
  SessionDto,
  SessionLeaderboardDto,
  StageMode,
  StageState,
} from "../../types/api";

type OperatorModule = "questions" | "polls" | "game" | "survey" | "presentation";

const MODULE_ORDER: { key: OperatorModule; index: string }[] = [
  { key: "questions", index: "01" },
  { key: "polls", index: "02" },
  { key: "game", index: "03" },
  { key: "survey", index: "04" },
  { key: "presentation", index: "05" },
];

export default function OperatorBoard() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.get<SessionDto>(`/sessions/${sessionId}`),
    enabled: !!sessionId,
  });

  const { data: initialPolls } = useQuery({
    queryKey: ["polls", sessionId],
    queryFn: () => api.get<PollDto[]>(`/sessions/${sessionId}/polls`),
    enabled: !!sessionId,
  });

  const { data: initialGameQuestions } = useQuery({
    queryKey: ["games", sessionId],
    queryFn: () => api.get<GameQuestionDto[]>(`/sessions/${sessionId}/games`),
    enabled: !!sessionId,
  });

  const { data: initialLeaderboard } = useQuery({
    queryKey: ["leaderboard", sessionId],
    queryFn: () => api.get<SessionLeaderboardDto>(`/public/sessions/${sessionId}/leaderboard`),
    enabled: !!sessionId,
  });

  const { data: initialStage } = useQuery({
    queryKey: ["stage-state", sessionId],
    queryFn: () => api.get<StageState>(`/public/sessions/${sessionId}/stage-state`),
    enabled: !!sessionId,
  });

  const { data: initialPresentations } = useQuery({
    queryKey: ["presentations", sessionId],
    queryFn: () => api.get<PresentationDto[]>(`/sessions/${sessionId}/presentations`),
    enabled: !!sessionId,
  });

  const [stageState, setStageState] = useState<StageState | null>(null);
  useEffect(() => {
    if (initialStage) setStageState(initialStage);
  }, [initialStage]);

  const [questionsLive, setQuestionsLive] = useState<Map<string, QuestionDto>>(new Map());
  const [pollsLive, setPollsLive] = useState<Map<string, PollDto>>(new Map());
  const [gameQuestionsLive, setGameQuestionsLive] = useState<Map<string, GameQuestionDto>>(new Map());
  const [leaderboard, setLeaderboard] = useState<SessionLeaderboardDto | null>(null);
  const [presentationsLive, setPresentationsLive] = useState<Map<string, PresentationDto>>(new Map());

  useEffect(() => {
    if (!initialPresentations) return;
    setPresentationsLive((prev) => {
      const next = new Map(prev);
      for (const p of initialPresentations) {
        if (!next.has(p.id)) next.set(p.id, p);
      }
      return next;
    });
  }, [initialPresentations]);

  const upsertPresentation = useCallback((presentation: PresentationDto) => {
    setPresentationsLive((prev) => {
      const next = new Map(prev);
      // Activating one deck closes any other, so mirror that locally rather
      // than waiting for a refetch to correct the badges.
      if (presentation.status === "ACTIVE") {
        next.forEach((existing, id) => {
          if (id !== presentation.id && existing.status === "ACTIVE") {
            next.set(id, { ...existing, status: "CLOSED" });
          }
        });
      }
      next.set(presentation.id, presentation);
      return next;
    });
  }, []);

  const removePresentation = useCallback((id: string) => {
    setPresentationsLive((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!initialPolls) return;
    setPollsLive((prev) => {
      const next = new Map(prev);
      for (const poll of initialPolls) {
        if (!next.has(poll.id)) next.set(poll.id, poll);
      }
      return next;
    });
  }, [initialPolls]);

  useEffect(() => {
    if (!initialGameQuestions) return;
    setGameQuestionsLive((prev) => {
      const next = new Map(prev);
      for (const q of initialGameQuestions) {
        if (!next.has(q.id)) next.set(q.id, q);
      }
      return next;
    });
  }, [initialGameQuestions]);

  useEffect(() => {
    if (initialLeaderboard) setLeaderboard(initialLeaderboard);
  }, [initialLeaderboard]);

  const upsertPoll = useCallback((poll: PollDto) => {
    setPollsLive((prev) => {
      const next = new Map(prev);
      next.set(poll.id, poll);
      return next;
    });
  }, []);

  const upsertGameQuestion = useCallback((question: GameQuestionDto) => {
    setGameQuestionsLive((prev) => {
      const next = new Map(prev);
      next.set(question.id, question);
      return next;
    });
  }, []);

  const removeGameQuestion = useCallback(
    (id: string) => {
      setGameQuestionsLive((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      // The fetched list is the other half of this panel's state: the effect
      // above seeds the live map from it and only ever adds. Dropping the
      // question from the map alone leaves it in the cache, which puts the
      // card straight back on the next seed — and again on every remount.
      queryClient.setQueryData<GameQuestionDto[]>(["games", sessionId], (prev) =>
        prev ? prev.filter((q) => q.id !== id) : prev
      );
    },
    [queryClient, sessionId]
  );

  useSessionSocket(
    sessionId,
    ["questions", "polls", "game", "stage", "presentation"],
    useCallback(
      (topic, type, payload) => {
        if (topic === "questions" && (type === "QUESTION_CREATED" || type === "QUESTION_UPDATED")) {
          const q = payload as QuestionDto;
          setQuestionsLive((prev) => {
            const next = new Map(prev);
            next.set(q.id, q);
            return next;
          });
          queryClient.invalidateQueries({ queryKey: ["questions", sessionId] });
        } else if (topic === "polls" && type === "POLL_UPDATED") {
          upsertPoll(payload as PollDto);
        } else if (topic === "game" && type === "GAME_QUESTION_UPDATED") {
          upsertGameQuestion(payload as GameQuestionDto);
        } else if (topic === "game" && type === "GAME_QUESTION_DELETED") {
          removeGameQuestion((payload as { id: string }).id);
        } else if (topic === "game" && type === "LEADERBOARD_UPDATED") {
          setLeaderboard(payload as SessionLeaderboardDto);
        } else if (topic === "stage" && type === "STAGE_STATE") {
          setStageState(payload as StageState);
        } else if (topic === "presentation" && type === "PRESENTATION_UPDATED") {
          upsertPresentation(payload as PresentationDto);
        }
      },
      [queryClient, sessionId, upsertPoll, upsertGameQuestion, removeGameQuestion, upsertPresentation]
    )
  );

  const setStageMode = useMutation({
    mutationFn: (stageMode: StageMode) => api.patch<SessionDto>(`/sessions/${sessionId}`, { stageMode }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["session", sessionId], updated);
    },
  });

  const polls = useMemo(() => Array.from(pollsLive.values()), [pollsLive]);
  const gameQuestions = useMemo(() => Array.from(gameQuestionsLive.values()), [gameQuestionsLive]);
  const presentations = useMemo(() => Array.from(presentationsLive.values()), [presentationsLive]);
  const currentStageMode = stageState?.stageMode ?? session?.stageMode ?? "IDLE";

  const [activeModule, setActiveModule] = useState<OperatorModule>("questions");

  return (
    <>
      <DashboardNav />
      <main className="container section-tight">
        <div className="op-header">
          <div>
            <p className="eyebrow">
              {session ? (
                <Link to={`/dashboard/events/${session.eventId}`} style={{ textDecoration: "none", color: "inherit" }}>
                  {t("operator.board.backToEvent")}
                </Link>
              ) : (
                t("operator.board.fallbackTitle")
              )}
            </p>
            {session ? (
              <>
                <h2>{session.title}</h2>
                <p className="op-header-meta">
                  {session.speakerName} · {session.hallName} · {t(`common.sessionStatus.${session.status}`)}
                </p>
              </>
            ) : (
              <>
                <div className="skeleton skeleton-line" style={{ width: "18rem", height: "2rem" }} />
                <div className="skeleton skeleton-line" style={{ width: "12rem" }} />
              </>
            )}
          </div>
          <div className="op-header-actions">
            <div className="op-stage-control">
              {currentStageMode !== "IDLE" && currentStageMode !== "BREAK" && (
                <span className="badge badge-live">{t(`common.stageMode.${currentStageMode}`)}</span>
              )}
              <div className="status-toggle" role="group" aria-label={t("operator.board.stageControlLabel")}>
                <button
                  type="button"
                  className={`status-toggle-btn${currentStageMode === "IDLE" ? " active status-ended" : ""}`}
                  aria-pressed={currentStageMode === "IDLE"}
                  disabled={setStageMode.isPending || currentStageMode === "IDLE"}
                  onClick={() => setStageMode.mutate("IDLE")}
                >
                  {t("common.stageMode.IDLE")}
                </button>
                <button
                  type="button"
                  className={`status-toggle-btn${currentStageMode === "BREAK" ? " active status-paused" : ""}`}
                  aria-pressed={currentStageMode === "BREAK"}
                  disabled={setStageMode.isPending || currentStageMode === "BREAK"}
                  onClick={() => setStageMode.mutate("BREAK")}
                >
                  {t("common.stageMode.BREAK")}
                </button>
              </div>
            </div>
            <div className="op-header-links">
              <Link className="btn btn-ghost btn-sm" to={`/analytics/${sessionId}`}>
                {t("operator.board.analyticsReport")}
              </Link>
              <a className="btn btn-ghost btn-sm" href={`/stage/${sessionId}`} target="_blank" rel="noreferrer">
                {t("operator.board.openStageScreen")}
                <ArrowIcon />
              </a>
            </div>
          </div>
        </div>

        {sessionId && (
          <>
            <div className="op-module-tabs" role="tablist" aria-label={t("operator.board.tabsAriaLabel")}>
              {MODULE_ORDER.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={activeModule === m.key}
                  className={`op-module-tab${activeModule === m.key ? " active" : ""}`}
                  onClick={() => setActiveModule(m.key)}
                >
                  <span className="op-module-tab-index mono">{m.index}</span>
                  {t(`operator.board.modules.${m.key}`)}
                </button>
              ))}
            </div>

            <div className="op-module-panel" hidden={activeModule !== "questions"}>
              <QuestionQueue sessionId={sessionId} liveQuestions={questionsLive} />
            </div>
            <div className="op-module-panel" hidden={activeModule !== "polls"}>
              <PollLauncher sessionId={sessionId} polls={polls} onUpsert={upsertPoll} />
            </div>
            <div className="op-module-panel" hidden={activeModule !== "game"}>
              <GamePanel
                sessionId={sessionId}
                questions={gameQuestions}
                leaderboard={leaderboard}
                onUpsertQuestion={upsertGameQuestion}
                onRemoveQuestion={removeGameQuestion}
              />
            </div>
            <div className="op-module-panel" hidden={activeModule !== "survey"}>
              <SurveyPanel sessionId={sessionId} />
            </div>
            <div className="op-module-panel" hidden={activeModule !== "presentation"}>
              <PresentationPanel
                sessionId={sessionId}
                presentations={presentations}
                onUpsert={upsertPresentation}
                onRemove={removePresentation}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}
