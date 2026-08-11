import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/auth.css";
import { useAuth } from "../../lib/auth";
import LanguageSwitcher from "../../components/shared/LanguageSwitcher";

type Status = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  // Guards against React 18 dev-mode's double effect invoke firing the
  // one-time-use verification token twice, which would turn the second call
  // into a spurious "invalid link" error right after a real success.
  const attempted = useRef(false);
  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      })
      .catch(() => setStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onResend(e: FormEvent) {
    e.preventDefault();
    setResendState("sending");
    try {
      await resendVerification(resendEmail);
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

        <div className="auth-form">
          {status === "verifying" && (
            <>
              <div className="auth-form-header">
                <h2>{t("auth.verifyEmail.verifying")}</h2>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="auth-form-header">
                <p className="eyebrow">{t("auth.verifyEmail.success.eyebrow")}</p>
                <h2>{t("auth.verifyEmail.success.heading")}</h2>
              </div>
              <p>{t("auth.verifyEmail.success.body")}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="auth-form-header">
                <p className="eyebrow">{t("auth.verifyEmail.error.eyebrow")}</p>
                <h2>{t("auth.verifyEmail.error.heading")}</h2>
              </div>

              {resendState === "sent" ? (
                <p>{t("auth.verifyEmail.error.resent")}</p>
              ) : (
                <>
                  <p>{t("auth.verifyEmail.error.body")}</p>
                  <form onSubmit={onResend}>
                    <div className="field">
                      <label htmlFor="resend-email">{t("auth.verifyEmail.error.emailLabel")}</label>
                      <input
                        id="resend-email"
                        type="email"
                        className="input"
                        required
                        autoComplete="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={resendState === "sending"}>
                      {t("auth.verifyEmail.error.resend")}
                    </button>
                  </form>
                </>
              )}
              <p className="auth-switch">
                <Link to="/login">{t("auth.forgotPassword.backToLogin")}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
