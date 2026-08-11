import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/auth.css";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";

export default function Register() {
  const { t } = useTranslation();
  const { register, resendVerification } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Set once registration succeeds — switches the form for a "check your
  // email" panel rather than navigating anywhere, since there is no session
  // to enter yet until the link is clicked.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password);
      setRegisteredEmail(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.register.fallbackError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (!registeredEmail) return;
    setResendState("sending");
    try {
      await resendVerification(registeredEmail);
    } finally {
      // Always shown as sent — resendVerification never reveals whether the
      // email was actually found, so there is nothing else to branch on.
      setResendState("sent");
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <Link to="/" className="nav-logo text-on-dark">
          <span className="nav-logo-mark" aria-hidden="true" />
          meet2be
        </Link>
        <blockquote>{t("auth.register.quote")}</blockquote>
        <p className="mono auth-side-foot">{t("auth.register.sideFoot")}</p>
      </aside>
      <div className="auth-main">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-4)" }}>
          <LanguageSwitcher />
        </div>

        {registeredEmail ? (
          <div className="auth-form">
            <div className="auth-form-header">
              <p className="eyebrow">{t("auth.register.checkEmail.eyebrow")}</p>
              <h2>{t("auth.register.checkEmail.heading")}</h2>
            </div>
            <p>{t("auth.register.checkEmail.body", { email: registeredEmail })}</p>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              disabled={resendState === "sending"}
              onClick={onResend}
            >
              {resendState === "sent" ? t("auth.register.checkEmail.resent") : t("auth.register.checkEmail.resend")}
            </button>
            <p className="auth-switch">
              <Link to="/login">{t("auth.register.checkEmail.backToLogin")}</Link>
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-form-header">
              <p className="eyebrow">{t("auth.register.eyebrow")}</p>
              <h2>{t("auth.register.heading")}</h2>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="field">
              <label htmlFor="name">{t("auth.register.name")}</label>
              <input
                id="name"
                type="text"
                className="input"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="email">{t("auth.register.email")}</label>
              <input
                id="email"
                type="email"
                className="input"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">{t("auth.register.password")}</label>
              <input
                id="password"
                type="password"
                className="input"
                required
                minLength={8}
                autoComplete="new-password"
                aria-describedby="password-hint"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p id="password-hint" className="helper-text">
                {t("auth.register.passwordHint")}
              </p>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? t("auth.register.submitting") : t("auth.register.submit")}
            </button>

            <p className="auth-switch">
              {t("auth.register.switchPrompt")} <Link to="/login">{t("auth.register.switchLink")}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
