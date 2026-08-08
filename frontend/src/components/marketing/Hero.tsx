import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ArrowIcon from "../shared/ArrowIcon";

export default function Hero() {
  const { t } = useTranslation();
  return (
    <section className="container hero">
      <div>
        <p className="eyebrow">{t("home.hero.eyebrow")}</p>
        <h1 className="hero-heading">
          {t("home.hero.headingLine1")}
          <br />
          {t("home.hero.headingLine2")}
        </h1>
        <p className="lede">{t("home.hero.lede")}</p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">
            {t("common.bookDemo")}
          </Link>
          <Link to="/join" className="btn btn-ghost">
            {t("home.hero.joinWithCode")}
            <ArrowIcon />
          </Link>
        </div>

        <div className="hero-meta">
          <div>
            <span className="num">01</span>
            <span className="label">{t("home.hero.meta1")}</span>
          </div>
          <div>
            <span className="num">02</span>
            <span className="label">{t("home.hero.meta2")}</span>
          </div>
          <div>
            <span className="num">03</span>
            <span className="label">{t("home.hero.meta3")}</span>
          </div>
        </div>
      </div>

      <div className="hero-panel" aria-hidden="true">
        <p className="mono" style={{ color: "var(--color-ink-faint)", marginBottom: "var(--space-3)" }}>
          {t("home.hero.panelTitle")}
        </p>
        <div className="hero-panel-row">
          <span>{t("home.hero.panelQuestion")}</span>
          <span className="badge badge-live">{t("home.hero.panelOnScreen")}</span>
        </div>
        <div className="hero-panel-row">
          <span>{t("home.hero.panelPoll")}</span>
          <span className="badge badge-ok">{t("home.hero.panelActive")}</span>
        </div>
        <div className="hero-panel-row">
          <span>{t("home.hero.panelSurvey")}</span>
          <span className="badge">{t("home.hero.panelResponses")}</span>
        </div>
      </div>
    </section>
  );
}
