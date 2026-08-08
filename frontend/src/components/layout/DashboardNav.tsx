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
          meet2be
        </Link>
        <div className="dash-nav-user">
          <LanguageSwitcher />
          <span>{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            {t("dashboard.nav.logOut")}
          </button>
        </div>
      </div>
    </header>
  );
}
