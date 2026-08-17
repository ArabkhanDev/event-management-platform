import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth";
import LanguageSwitcher from "../shared/LanguageSwitcher";

export default function DashboardNav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="dash-nav">
      <div className="container dash-nav-inner">
        <Link to="/dashboard" className="nav-logo">
          <span className="nav-logo-mark" aria-hidden="true" />
          auda
        </Link>
        <div className="dash-nav-user">
          <LanguageSwitcher />
          {/* Cached from login, so a just-promoted admin sees this after their
              next sign-in; /admin itself works immediately either way. */}
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="dash-nav-admin-link">
              {t("admin.navLink")}
            </Link>
          )}
          <span>{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            {t("dashboard.nav.logOut")}
          </button>
        </div>
      </div>
    </header>
  );
}
