import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link to="/" className="nav-logo">
              <span className="nav-logo-mark" aria-hidden="true" />
              meet2be
            </Link>
            <p style={{ marginTop: "var(--space-3)", maxWidth: "32ch" }}>{t("footer.tagline")}</p>
          </div>
          <div className="footer-col">
            <h5>{t("footer.product")}</h5>
            <ul>
              <li><a href="/#modules">{t("header.modules")}</a></li>
              <li><a href="/#formats">{t("header.formats")}</a></li>
              <li><a href="/#how-it-works">{t("header.howItWorks")}</a></li>
              <li><Link to="/plans">{t("header.pricing")}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>{t("footer.getStartedHeading")}</h5>
            <ul>
              <li><Link to="/register">{t("common.bookDemo")}</Link></li>
              <li><Link to="/join">{t("header.joinEvent")}</Link></li>
              <li><Link to="/login">{t("common.logIn")}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>{t("footer.company")}</h5>
            <ul>
              <li><a href="mailto:hello@meet2be.example">{t("footer.contact")}</a></li>
              <li><a href="#modules">{t("footer.careers")}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} meet2be</span>
          <span>{t("footer.bottomTagline")}</span>
        </div>
      </div>
    </footer>
  );
}
