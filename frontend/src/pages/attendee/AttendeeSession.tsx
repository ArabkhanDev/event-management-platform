import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import "../../styles/attendee.css";
import { api, API_BASE, ApiError, accessCodeOf, type AccessErrorCode } from "../../lib/api";
import { getVoterToken } from "../../lib/voterToken";
import { useSessionSocket } from "../../lib/ws";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";
import type {
  GameQuestionDto,
  PollDto,
  PresentationDto,
  QuestionDto,
  SessionLeaderboardDto,
  SessionPlayerDto,
  StageState,
  SurveyDto,
} from "../../types/api";

type Tab = "ask" | "vote" | "game" | "feedback" | "slides";

const VOTED_POLLS_KEY = "auda_voted_polls";
const ANSWERED_GAMES_KEY = "auda_answered_games";
const PLAYER_NAME_KEY = "auda_player_name";

function getIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markId(key: string, id: string) {
  const set = getIdSet(key);
  set.add(id);
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage failures
  }
}

function getVotedPolls(): Set<string> {
  return getIdSet(VOTED_POLLS_KEY);
}

function markPollVoted(pollId: string) {
  markId(VOTED_POLLS_KEY, pollId);
}

function getPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function setPlayerName(name: string) {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    // ignore storage failures
  }
}

/**
 * Reserves a leaderboard name for this device in this session. Names are unique
 * per session, so this is what turns a remembered name into one the attendee
 * actually holds here — and what rejects it when someone else got there first.
 */
function claimPlayerName(sessionId: string, name: string): Promise<SessionPlayerDto> {
  return api.post<SessionPlayerDto>(
    `/public/sessions/${sessionId}/player-name`,
    { name },
    { auth: false, headers: { "X-Voter-Token": getVoterToken() } }
  );
}

export default function AttendeeSession() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();

  // No WS topic announces survey activation, so poll lightly for whichever
  // survey is currently ACTIVE on this session — cheap and good enough for a
  // feedback form that typically opens once near the end of a session.
  const { data: survey } = useQuery({
    queryKey: ["active-survey", sessionId],
    queryFn: async () => (await api.get<SurveyDto | undefined>(`/public/sessions/${sessionId}/active-survey`, { auth: false })) ?? null,
    enabled: !!sessionId,
    refetchInterval: 15000,
  });

  const [stageState, setStageState] = useState<StageState | null>(null);
  const [tab, setTab] = useState<Tab>("ask");
  const [activeGame, setActiveGame] = useState<GameQuestionDto | null>(null);
  const [leaderboard, setLeaderboard] = useState<SessionLeaderboardDto | null>(null);
  const [presentation, setPresentation] = useState<PresentationDto | null>(null);
  const [accessBlock, setAccessBlock] = useState<AccessErrorCode | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api
      .get<StageState>(`/public/sessions/${sessionId}/stage-state`, { auth: false })
      .then((res) => {
        if (cancelled) return;
        setStageState(res);
        setAccessBlock(null);
      })
      // Stage state is the one call every attendee makes, so it stands in for
      // the whole session's availability.
      .catch((err) => {
        if (!cancelled) setAccessBlock(accessCodeOf(err));
      });
    api
      .get<GameQuestionDto | undefined>(`/public/sessions/${sessionId}/active-game`, { auth: false })
      .then((res) => {
        if (!cancelled) setActiveGame(res ?? null);
      })
      .catch(() => {});
    api
      .get<SessionLeaderboardDto>(`/public/sessions/${sessionId}/leaderboard`, { auth: false })
      .then((res) => {
        if (!cancelled) setLeaderboard(res);
      })
      .catch(() => {});
    api
      .get<PresentationDto | undefined>(`/public/sessions/${sessionId}/active-presentation`, { auth: false })
      .then((res) => {
        if (!cancelled) setPresentation(res ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useSessionSocket(
    sessionId,
    ["stage", "game", "presentation"],
    useCallback((topic, type, payload) => {
      if (topic === "stage" && type === "STAGE_STATE") setStageState(payload as StageState);
      if (topic === "game" && type === "GAME_QUESTION_UPDATED") setActiveGame(payload as GameQuestionDto);
      if (topic === "game" && type === "GAME_QUESTION_DELETED") {
        // Only clear if it is the question on screen — deleting an old one
        // should not blank out whatever is running now.
        const deletedId = (payload as { id: string }).id;
        setActiveGame((current) => (current && current.id === deletedId ? null : current));
      }
      if (topic === "game" && type === "LEADERBOARD_UPDATED") setLeaderboard(payload as SessionLeaderboardDto);
      if (topic === "presentation" && type === "PRESENTATION_UPDATED") {
        const next = payload as PresentationDto;
        // A deck that stops presenting should clear the tab, not freeze on its
        // last slide.
        setPresentation(next.status === "ACTIVE" ? next : null);
      }
    }, [])
  );

  const activePoll = stageState?.poll ?? null;

  // The session is over but still viewable: results stay, submissions close.
  // Arrives over the socket too, so a phone already in the room switches to
  // read-only the moment the organiser ends the talk.
  const readOnly = stageState?.accessState === "READ_ONLY";

  if (accessBlock) {
    return (
      <div className="attendee-shell">
        <div className="attendee-topbar">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-mark" aria-hidden="true" />
            auda
          </Link>
          <LanguageSwitcher />
        </div>
        <main className="attendee-main">
          <div className="join-hero">
            <h2>{t(`attendee.access.${accessBlock}.heading`)}</h2>
            <p>{t(`attendee.access.${accessBlock}.body`)}</p>
          </div>
          <Link to="/join" className="btn btn-primary btn-block">
            {t("attendee.access.backToJoin")}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="attendee-shell">
      <div className="attendee-topbar">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark" aria-hidden="true" />
          auda
        </Link>
        <LanguageSwitcher />
      </div>
      <main className="attendee-main">
        {readOnly && (
          <p className="att-readonly-banner" role="status">
            {t("attendee.access.readOnlyNotice")}
          </p>
        )}
        <div className="att-tabs">
          <button className={`att-tab${tab === "ask" ? " active" : ""}`} onClick={() => setTab("ask")}>
            {t("attendee.session.tabAsk")}
          </button>
          <button className={`att-tab${tab === "vote" ? " active" : ""}`} onClick={() => setTab("vote")}>
            {t("attendee.session.tabVote")}
            {activePoll?.status === "ACTIVE" ? " •" : ""}
          </button>
          <button className={`att-tab${tab === "game" ? " active" : ""}`} onClick={() => setTab("game")}>
            {t("attendee.session.tabGame")}
            {activeGame?.status === "ACTIVE" ? " •" : ""}
          </button>
          <button className={`att-tab${tab === "slides" ? " active" : ""}`} onClick={() => setTab("slides")}>
            {t("attendee.session.tabSlides")}
            {presentation ? " •" : ""}
          </button>
          {survey && (
            <button className={`att-tab${tab === "feedback" ? " active" : ""}`} onClick={() => setTab("feedback")}>
              {t("attendee.session.tabFeedback")}
            </button>
          )}
        </div>

        {tab === "ask" && sessionId && <AskTab sessionId={sessionId} readOnly={readOnly} />}
        {tab === "vote" && <VoteTab poll={activePoll} readOnly={readOnly} />}
        {tab === "game" && sessionId && (
          <GameTab sessionId={sessionId} question={activeGame} leaderboard={leaderboard} readOnly={readOnly} />
        )}
        {tab === "slides" && <SlidesTab presentation={presentation} />}
        {tab === "feedback" && survey && <FeedbackTab survey={survey} readOnly={readOnly} />}
      </main>
    </div>
  );
}

function AskTab({ sessionId, readOnly }: { sessionId: string; readOnly: boolean }) {
  const { t } = useTranslation();
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<QuestionDto[]>([]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const q = await api.post<QuestionDto>(
        `/public/sessions/${sessionId}/questions`,
        { authorName: authorName.trim() || undefined, body: body.trim() },
        { auth: false }
      );
      setSent((prev) => [q, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("attendee.session.ask.fallbackError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.ask.eyebrow")}</p>
        <h3>{t("attendee.session.ask.heading")}</h3>
      </div>
      {/* A closed session gets no form at all: a disabled one still reads as
          "type here", and the submission would be rejected anyway. */}
      {readOnly ? (
        <div className="empty-state">
          <p>{t("attendee.access.askClosed")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="field">
            <label htmlFor="author">{t("attendee.session.ask.nameLabel")}</label>
            <input id="author" className="input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="question">{t("attendee.session.ask.questionLabel")}</label>
            <textarea
              id="question"
              className="input"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("attendee.session.ask.questionPlaceholder")}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? t("attendee.session.ask.sending") : t("attendee.session.ask.send")}
          </button>
        </form>
      )}

      {sent.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <p className="mono" style={{ color: "var(--color-ink-faint)", marginBottom: "var(--space-3)" }}>
            {t("attendee.session.ask.sentHeading")}
          </p>
          {sent.map((q) => (
            <div className="card" key={q.id} style={{ marginBottom: "var(--space-3)" }}>
              <p style={{ margin: 0 }}>{q.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VoteTab({ poll, readOnly }: { poll: PollDto | null; readOnly: boolean }) {
  const { t } = useTranslation();
  const [localPoll, setLocalPoll] = useState<PollDto | null>(poll);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    setLocalPoll(poll);
    if (poll) setHasVoted(getVotedPolls().has(poll.id));
  }, [poll]);

  if (!localPoll) {
    return (
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.vote.eyebrow")}</p>
        <h3>{t("attendee.session.vote.emptyHeading")}</h3>
        <p>{t("attendee.session.vote.emptyBody")}</p>
      </div>
    );
  }

  const total = localPoll.options.reduce((sum, o) => sum + o.votes, 0);
  const canVote = localPoll.status === "ACTIVE" && !hasVoted;

  async function vote(optionId: string) {
    if (!localPoll) return;
    setVoting(true);
    setError(null);
    try {
      const updated = await api.post<PollDto>(
        `/public/polls/${localPoll.id}/vote`,
        { optionId },
        { auth: false, headers: { "X-Voter-Token": getVoterToken() } }
      );
      setLocalPoll(updated);
      markPollVoted(localPoll.id);
      setHasVoted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        markPollVoted(localPoll.id);
        setHasVoted(true);
      } else {
        setError(err instanceof ApiError ? err.message : t("attendee.session.vote.fallbackError"));
      }
    } finally {
      setVoting(false);
    }
  }

  return (
    <div>
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.vote.eyebrow")}</p>
        <h3>{localPoll.prompt}</h3>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {hasVoted && <p className="submitted-note">{t("attendee.session.vote.thanks")}</p>}
      {localPoll.status === "CLOSED" && !hasVoted && <p className="info-note">{t("attendee.session.vote.closed")}</p>}

      {canVote
        ? localPoll.options.map((opt) => (
            <button key={opt.id} className="vote-option" disabled={voting || readOnly} onClick={() => vote(opt.id)}>
              {opt.label}
            </button>
          ))
        : localPoll.options.map((opt) => {
            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
            return (
              <div className="vote-result-row" key={opt.id}>
                <div className="vote-result-label">
                  <span>{opt.label}</span>
                  <span>{pct}%</span>
                </div>
                <div className="vote-result-track">
                  <div className="vote-result-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
    </div>
  );
}

function GameTab({
  sessionId,
  question,
  leaderboard,
  readOnly,
}: {
  sessionId: string;
  readOnly: boolean;
  question: GameQuestionDto | null;
  leaderboard: SessionLeaderboardDto | null;
}) {
  const { t } = useTranslation();
  const [localQuestion, setLocalQuestion] = useState<GameQuestionDto | null>(question);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [claimedName, setClaimedName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState(getPlayerName());
  const [claiming, setClaiming] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [restoringName, setRestoringName] = useState(true);

  useEffect(() => {
    setLocalQuestion(question);
    if (question) setHasAnswered(getIdSet(ANSWERED_GAMES_KEY).has(question.id));
  }, [question]);

  // The remembered name is global but names are only unique within a session,
  // so it has to be re-reserved here rather than trusted: whoever the attendee
  // was at last week's event may already be taken in this room. A rejection
  // just leaves claimedName null, which shows the gate.
  useEffect(() => {
    const stored = getPlayerName().trim();
    if (readOnly || !stored) {
      setRestoringName(false);
      return;
    }
    let cancelled = false;
    claimPlayerName(sessionId, stored)
      .then((player) => {
        if (cancelled) return;
        setPlayerName(player.displayName);
        setClaimedName(player.displayName);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setRestoringName(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, readOnly]);

  async function onClaimName(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setClaiming(true);
    setNameError(null);
    try {
      const player = await claimPlayerName(sessionId, trimmed);
      setPlayerName(player.displayName);
      setClaimedName(player.displayName);
      setNameDraft(player.displayName);
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : t("attendee.session.game.name.fallbackError"));
    } finally {
      setClaiming(false);
    }
  }

  async function answer(optionId: string) {
    if (!localQuestion) return;
    setAnswering(true);
    setError(null);
    try {
      const updated = await api.post<GameQuestionDto>(
        `/public/games/${localQuestion.id}/answer`,
        { optionId },
        { auth: false, headers: { "X-Voter-Token": getVoterToken() } }
      );
      setLocalQuestion(updated);
      markId(ANSWERED_GAMES_KEY, localQuestion.id);
      setHasAnswered(true);
    } catch (err) {
      // Checked before the generic 409 below: that branch means "you already
      // answered" and locks the card, which would be the wrong outcome for a
      // question that simply is not live.
      if (err instanceof ApiError && err.code === "GAME_NOT_ACCEPTING_ANSWERS") {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 409) {
        markId(ANSWERED_GAMES_KEY, localQuestion.id);
        setHasAnswered(true);
      } else if (err instanceof ApiError && err.code === "PLAYER_NAME_REQUIRED") {
        // The reservation is gone server-side — send them back through the gate
        // rather than showing an error they cannot act on.
        setClaimedName(null);
      } else {
        setError(err instanceof ApiError ? err.message : t("attendee.session.game.fallbackError"));
      }
    } finally {
      setAnswering(false);
    }
  }

  // Asked before the question rather than beside it: a live question is timed,
  // and whoever still had to type a name would be answering with a handicap.
  if (!readOnly && !claimedName) {
    return (
      <div>
        <div className="att-session-head">
          <p className="eyebrow">{t("attendee.session.game.eyebrow")}</p>
          <h3>{t("attendee.session.game.name.heading")}</h3>
          <p>{t("attendee.session.game.name.body")}</p>
        </div>

        <form onSubmit={onClaimName}>
          <div className="field">
            <label htmlFor="player-name">{t("attendee.session.game.name.label")}</label>
            <input
              id="player-name"
              className="input"
              value={nameDraft}
              maxLength={40}
              autoComplete="nickname"
              disabled={restoringName}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={t("attendee.session.game.name.placeholder")}
            />
          </div>

          {nameError && (
            <p className="form-error" role="alert">
              {nameError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={claiming || restoringName || !nameDraft.trim()}
          >
            {claiming ? t("attendee.session.game.name.submitting") : t("attendee.session.game.name.submit")}
          </button>
        </form>

        <GameLeaderboard leaderboard={leaderboard} />
      </div>
    );
  }

  if (!localQuestion) {
    return (
      <div>
        <div className="att-session-head">
          <p className="eyebrow">{t("attendee.session.game.eyebrow")}</p>
          <h3>{t("attendee.session.game.emptyHeading")}</h3>
          <p>{t("attendee.session.game.emptyBody")}</p>
        </div>
        {claimedName && <PlayingAs name={claimedName} onChange={() => setClaimedName(null)} />}
        <GameLeaderboard leaderboard={leaderboard} />
      </div>
    );
  }

  const total = localQuestion.options.reduce((sum, o) => sum + o.answerCount, 0);
  const canAnswer = localQuestion.status === "ACTIVE" && !hasAnswered;
  const revealed = localQuestion.status === "CLOSED";

  return (
    <div>
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.game.eyebrowWithPoints", { points: localQuestion.points })}</p>
        <h3>{localQuestion.prompt}</h3>
      </div>

      {claimedName && <PlayingAs name={claimedName} onChange={() => setClaimedName(null)} />}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {hasAnswered && !revealed && <p className="info-note">{t("attendee.session.game.answerLocked")}</p>}
      {hasAnswered && revealed && <p className="submitted-note">{t("attendee.session.game.resultsIn")}</p>}
      {!canAnswer && !hasAnswered && localQuestion.status !== "CLOSED" && (
        <p className="info-note">{t("attendee.session.game.notOpen")}</p>
      )}

      {canAnswer
        ? localQuestion.options.map((opt) => (
            <button key={opt.id} className="vote-option" disabled={answering || readOnly} onClick={() => answer(opt.id)}>
              {opt.label}
            </button>
          ))
        : localQuestion.options.map((opt) => {
            const pct = total > 0 ? Math.round((opt.answerCount / total) * 100) : 0;
            const isCorrect = revealed && opt.correct;
            return (
              <div className="vote-result-row" key={opt.id}>
                <div className="vote-result-label">
                  <span style={isCorrect ? { color: "var(--color-success)", fontWeight: 600 } : undefined}>
                    {opt.label}
                    {isCorrect ? " ✓" : ""}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="vote-result-track">
                  <div
                    className="vote-result-fill"
                    style={{ width: `${pct}%`, background: isCorrect ? "var(--color-success)" : undefined }}
                  />
                </div>
              </div>
            );
          })}

      <GameLeaderboard leaderboard={leaderboard} />
    </div>
  );
}

function PlayingAs({ name, onChange }: { name: string; onChange: () => void }) {
  const { t } = useTranslation();
  // Array.from, not [0] — a surrogate pair (or an emoji nickname) would come
  // back as half a character with plain indexing.
  const initial = Array.from(name.trim())[0] ?? "?";

  return (
    <div className="att-identity">
      <span className="att-identity-avatar" aria-hidden="true">
        {initial}
      </span>
      <span className="att-identity-text">
        <span className="att-identity-label">{t("attendee.session.game.name.playingAsLabel")}</span>
        <span className="att-identity-name" title={name}>
          {name}
        </span>
      </span>
      <button type="button" className="att-identity-change" onClick={onChange}>
        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        {t("attendee.session.game.name.change")}
      </button>
    </div>
  );
}

function GameLeaderboard({ leaderboard }: { leaderboard: SessionLeaderboardDto | null }) {
  const { t } = useTranslation();

  if (!leaderboard || leaderboard.entries.length === 0) return null;

  return (
    <>
      <hr className="rule" style={{ margin: "var(--space-6) 0" }} />
      <p className="mono" style={{ color: "var(--color-ink-faint)", marginBottom: "var(--space-3)" }}>
        {t("common.leaderboard")}
      </p>
      <ol className="leaderboard-list">
        {leaderboard.entries.slice(0, 5).map((entry, i) => (
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
  );
}

function SlidesTab({ presentation }: { presentation: PresentationDto | null }) {
  const { t } = useTranslation();

  if (!presentation) {
    return (
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.slides.eyebrow")}</p>
        <h3>{t("attendee.session.slides.emptyHeading")}</h3>
        <p>{t("attendee.session.slides.emptyBody")}</p>
      </div>
    );
  }

  const { id, currentSlide, slideCount } = presentation;
  // Warm the neighbouring slides so a slide change renders from cache instead
  // of a fresh round-trip on conference wifi.
  const prefetch = [currentSlide + 1, currentSlide - 1].filter((n) => n >= 1 && n <= slideCount);

  return (
    <div>
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.slides.eyebrow")}</p>
        <h3>{presentation.title}</h3>
      </div>

      <div className="att-slide">
        <img
          key={currentSlide}
          src={`${API_BASE}/public/presentations/${id}/slides/${currentSlide}`}
          alt={t("attendee.session.slides.slideAlt", { current: currentSlide, total: slideCount })}
        />
      </div>

      <p className="mono att-slide-position">
        {t("attendee.session.slides.position", { current: currentSlide, total: slideCount })}
      </p>

      {/* Only offered when the organiser has shared the deck. A plain link, so
          the browser handles the transfer and the Content-Disposition filename. */}
      {presentation.downloadEnabled && (
        <a
          className="btn btn-ghost btn-block"
          href={`${API_BASE}/public/presentations/${id}/download`}
          download
        >
          {t("attendee.session.slides.download")}
        </a>
      )}

      <div className="visually-hidden" aria-hidden="true">
        {prefetch.map((n) => (
          <img key={n} src={`${API_BASE}/public/presentations/${id}/slides/${n}`} alt="" />
        ))}
      </div>
    </div>
  );
}

function FeedbackTab({ survey, readOnly }: { survey: SurveyDto; readOnly: boolean }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post<{ ok: true }>(
        `/public/surveys/${survey.id}/responses`,
        { answers: survey.questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? "" })) },
        { auth: false, headers: { "X-Voter-Token": getVoterToken() } }
      );
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDone(true);
      } else {
        setError(err instanceof ApiError ? err.message : t("attendee.session.feedback.fallbackError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.feedback.eyebrow")}</p>
        <h3>{t("attendee.session.feedback.thanksHeading")}</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="att-session-head">
        <p className="eyebrow">{t("attendee.session.feedback.eyebrow")}</p>
        <h3>{survey.title}</h3>
      </div>
      <form onSubmit={onSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {survey.questions.map((q) => (
          <div className="field" key={q.id}>
            <label id={`q-${q.id}-label`}>{q.prompt}</label>
            {q.type === "RATING" && (
              <div className="rating-row" role="radiogroup" aria-labelledby={`q-${q.id}-label`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`rating-btn${Number(answers[q.id]) === n ? " selected" : ""}`}
                    role="radio"
                    aria-checked={Number(answers[q.id]) === n}
                    aria-label={`${n} out of 5`}
                    onClick={() => setAnswer(q.id, String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "TEXT" && (
              <textarea className="input" value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
            )}
            {q.type === "SINGLE_CHOICE" &&
              (q.options ?? []).map((opt) => (
                <label key={opt} className="choice-row">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswer(q.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            {q.type === "DROPDOWN" && (
              <select className="input" value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)}>
                <option value="" disabled>
                  {t("attendee.session.feedback.chooseOne")}
                </option>
                {(q.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || readOnly}>
          {submitting ? t("attendee.session.feedback.submitting") : t("attendee.session.feedback.submit")}
        </button>
      </form>
    </div>
  );
}
