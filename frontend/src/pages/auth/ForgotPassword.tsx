import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/auth.css";
import { useAuth } from "../../lib/auth";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [searchParams] = useSearchParams();
  // Carried over from the login form so someone who already typed their email
  // there isn't asked to type it again — see the field itself for the case
  // where they navigated here directly with nothing typed yet.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [submitting, setSubmitting] = useState(false);
  // No error branch here on purpose: forgotPassword never reveals whether the
  // email matched an account, so success is the only outcome to show.
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
    } finally {
      setSubmitting(false);
      setSent(true);
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

        {sent ? (
          <div className="auth-form">
            <div className="auth-form-header">
              <p className="eyebrow">{t("auth.forgotPassword.eyebrow")}</p>
              <h2>{t("auth.forgotPassword.sent.heading")}</h2>
            </div>
            <p>{t("auth.forgotPassword.sent.body", { email })}</p>
            <p className="auth-switch">
              <Link to="/login">{t("auth.forgotPassword.backToLogin")}</Link>
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-form-header">
              <p className="eyebrow">{t("auth.forgotPassword.eyebrow")}</p>
              <h2>{t("auth.forgotPassword.heading")}</h2>
              <p style={{ marginTop: "var(--space-3)" }}>{t("auth.forgotPassword.body")}</p>
            </div>

            <div className="field">
              <label htmlFor="email">{t("auth.forgotPassword.email")}</label>
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

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
            </button>

            <p className="auth-switch">
              <Link to="/login">{t("auth.forgotPassword.backToLogin")}</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
