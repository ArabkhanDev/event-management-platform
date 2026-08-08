import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ArrowIcon from "../shared/ArrowIcon";

export default function ClosingCTA() {
  const { t } = useTranslation();
  return (
    <section className="cta-band">
      <div className="container" style={{ textAlign: "center" }}>
        <p className="eyebrow">{t("home.closingCTA.eyebrow")}</p>
        <h2 style={{ maxWidth: "20ch", margin: "0 auto var(--space-5)" }}>{t("home.closingCTA.heading")}</h2>
        <p className="lede" style={{ margin: "0 auto var(--space-6)", textAlign: "center", maxWidth: "50ch" }}>
          {t("home.closingCTA.lede")}
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link to="/register" className="btn btn-primary">
            {t("common.bookDemo")}
          </Link>
          <Link to="/join" className="btn">
            {t("home.closingCTA.tryAttendeeView")}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
