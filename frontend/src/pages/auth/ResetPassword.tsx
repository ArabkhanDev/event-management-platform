import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/auth.css";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";

export default function ResetPassword() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.mismatchError"));
      return;
    }
    if (!token) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.resetPassword.fallbackError"));
    } finally {
      setSubmitting(false);
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

        {!token ? (
          <div className="auth-form">
            <div className="auth-form-header">
              <p className="eyebrow">{t("auth.resetPassword.eyebrow")}</p>
              <h2>{t("auth.resetPassword.invalidLink.heading")}</h2>
            </div>
            <p>{t("auth.resetPassword.invalidLink.body")}</p>
            <Link to="/forgot-password" className="btn btn-primary btn-block">
              {t("auth.resetPassword.invalidLink.cta")}
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-form-header">
              <p className="eyebrow">{t("auth.resetPassword.eyebrow")}</p>
              <h2>{t("auth.resetPassword.heading")}</h2>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="field">
              <label htmlFor="password">{t("auth.resetPassword.newPassword")}</label>
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
                {t("auth.resetPassword.passwordHint")}
              </p>
            </div>

            <div className="field">
              <label htmlFor="confirm-password">{t("auth.resetPassword.confirmPassword")}</label>
              <input
                id="confirm-password"
                type="password"
                className="input"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
