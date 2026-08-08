import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/attendee.css";
import { api, ApiError } from "../../lib/api";
import { getVoterToken } from "../../lib/voterToken";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";
import type { JoinEventResponse } from "../../types/api";

export default function JoinEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JoinEventResponse | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<JoinEventResponse>(`/public/join/${encodeURIComponent(code.trim())}`, {
        auth: false,
      });
      if (email.trim()) {
        // Fire-and-forget: never block joining on this, it's purely optional.
        api
          .post(`/public/events/${res.event.id}/attendees`, { voterToken: getVoterToken(), email: email.trim() }, { auth: false })
          .catch(() => {});
      }
      if (res.sessions.length === 1) {
        navigate(`/event/${res.sessions[0].id}`);
        return;
      }
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("attendee.join.fallbackError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="attendee-shell">
      <div className="attendee-topbar">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark" aria-hidden="true" />
          meet2be
        </Link>
        <LanguageSwitcher />
      </div>
      <main className="attendee-main">
        {!result && (
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
