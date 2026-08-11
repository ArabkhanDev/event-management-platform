import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/auth.css";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Set only when the login rejection is specifically EMAIL_NOT_VERIFIED —
  // swaps the generic error message for a resend action instead.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendState("idle");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(email);
      } else {
        setError(err instanceof ApiError ? err.message : t("auth.login.fallbackError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (!unverifiedEmail) return;
    setResendState("sending");
    try {
      await resendVerification(unverifiedEmail);
    } finally {
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
        <blockquote>{t("auth.login.quote")}</blockquote>
        <p className="mono auth-side-foot">{t("auth.login.sideFoot")}</p>
      </aside>
      <div className="auth-main">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-4)" }}>
          <LanguageSwitcher />
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-form-header">
            <p className="eyebrow">{t("auth.login.eyebrow")}</p>
            <h2>{t("auth.login.heading")}</h2>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {unverifiedEmail && (
            <div className="form-error" role="alert">
              <p style={{ margin: 0 }}>{t("auth.login.emailNotVerified.body", { email: unverifiedEmail })}</p>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                style={{ marginTop: "var(--space-2)" }}
                disabled={resendState === "sending"}
                onClick={onResend}
              >
                {resendState === "sent"
                  ? t("auth.login.emailNotVerified.resent")
                  : t("auth.login.emailNotVerified.resend")}
              </button>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">{t("auth.login.email")}</label>
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
            <label htmlFor="password">{t("auth.login.password")}</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Link
              to={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : "/forgot-password"}
              className="auth-inline-link auth-forgot-link"
            >
              {t("auth.login.forgotPasswordLink")}
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>

          <p className="auth-switch">
            {t("auth.login.switchPrompt")} <Link to="/register">{t("auth.login.switchLink")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
