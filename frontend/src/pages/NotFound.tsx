import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container section" style={{ textAlign: "center" }}>
      <p className="eyebrow">{t("notFound.eyebrow")}</p>
      <h1>{t("notFound.heading")}</h1>
      <p className="lede" style={{ margin: "0 auto var(--space-6)" }}>
        {t("notFound.lede")}
      </p>
      <Link to="/" className="btn btn-primary">
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
