import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/attendee.css";
import { api, ApiError, accessCodeOf, type AccessErrorCode } from "../../lib/api";
import { getVoterToken } from "../../lib/voterToken";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";
import type { JoinEventResponse } from "../../types/api";

export default function JoinEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Present when the QR code's own link (/join/:code) was scanned, rather than
  // typed in by hand at the bare /join form.
  const { code: codeParam } = useParams<{ code?: string }>();
  const [code, setCode] = useState(codeParam ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<AccessErrorCode | null>(null);
  const [result, setResult] = useState<JoinEventResponse | null>(null);

  async function attemptJoin(codeValue: string) {
    if (!codeValue.trim()) return;
    setLoading(true);
    setError(null);
    setBlocked(null);
    try {
      // Sent on every join, not just when an email is given: this is what lets
      // the backend count distinct attendees against the organiser's plan cap,
      // and what makes a re-join (same browser, same event) never re-count.
      const voterToken = getVoterToken();
      const res = await api.get<JoinEventResponse>(
        `/public/join/${encodeURIComponent(codeValue.trim())}?voterToken=${encodeURIComponent(voterToken)}`,
        { auth: false },
      );
      if (email.trim()) {
        // Fire-and-forget: never block joining on this, it's purely optional.
        api
          .post(`/public/events/${res.event.id}/attendees`, { voterToken, email: email.trim() }, { auth: false })
          .catch(() => {});
      }
      if (res.sessions.length === 1) {
        navigate(`/event/${res.sessions[0].id}`);
        return;
      }
      setResult(res);
    } catch (err) {
      // A code for an event that has not opened yet is not a typo — say so
      // plainly instead of showing it as a lookup failure.
      const accessCode = accessCodeOf(err);
      if (accessCode) {
        setBlocked(accessCode);
      } else {
        setError(err instanceof ApiError ? err.message : t("attendee.join.fallbackError"));
      }
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    attemptJoin(code);
  }

  // Auto-join once when arriving via a scanned QR link — the code is already
  // known, so making someone re-type or re-tap it would defeat the point of
  // scanning. Guarded with a ref (not just the codeParam dep) so React 18's
  // dev-mode double-invoke of effects can't fire the lookup twice.
  const autoJoined = useRef(false);
  useEffect(() => {
    if (codeParam && !autoJoined.current) {
      autoJoined.current = true;
      attemptJoin(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  // Scanned a QR code and the lookup is still in flight: skip straight past
  // the empty form (which would otherwise flash the code field then the
  // email field before anyone can read either) to a plain loading state.
  const autoJoining = Boolean(codeParam) && loading && !blocked;

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
        {blocked && (
          <div className="join-hero">
            <h2>{t(`attendee.access.${blocked}.heading`)}</h2>
            <p>{t(`attendee.access.${blocked}.body`)}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setBlocked(null)}>
              {t("attendee.access.tryAnotherCode")}
            </button>
          </div>
        )}

        {autoJoining && (
          <div className="join-hero">
            <p className="eyebrow">{t("attendee.join.eyebrow")}</p>
            <h2>{t("attendee.join.autoJoining")}</h2>
          </div>
        )}

        {!result && !blocked && !autoJoining && (
          <>
            <div className="join-hero">
              <p className="eyebrow">{t("attendee.join.eyebrow")}</p>
              <h2>{t("attendee.join.heading")}</h2>
              <p>{t("attendee.join.sub")}</p>
            </div>
            <form onSubmit={onSubmit}>
              {error && (
                <p className="form-error" role="alert" style={{ textAlign: "center" }}>
                  {error}
                </p>
              )}
              <div className="field">
                <label htmlFor="join-code" className="visually-hidden">
                  {t("attendee.join.codeLabel")}
                </label>
                <input
                  id="join-code"
                  className="input join-code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("attendee.join.codePlaceholder")}
                  autoComplete="off"
                  autoCapitalize="characters"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="join-email">{t("attendee.join.emailLabel")}</label>
                <input
                  id="join-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("attendee.join.emailPlaceholder")}
                  autoComplete="email"
                />
                <p className="helper-text">{t("attendee.join.emailHelper")}</p>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? t("attendee.join.lookingUp") : t("attendee.join.continue")}
              </button>
            </form>
          </>
        )}

        {result && (
          <>
            <div className="join-hero">
              <p className="eyebrow">{result.event.name}</p>
              <h2>{t("attendee.join.pickSession")}</h2>
              <p>{result.event.description}</p>
            </div>
            <div className="session-pick">
              {result.sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="session-pick-item"
                  onClick={() => navigate(`/event/${s.id}`)}
                >
                  {s.title}
                  <span className="hall">
                    {s.speakerName} · {s.hallName}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
