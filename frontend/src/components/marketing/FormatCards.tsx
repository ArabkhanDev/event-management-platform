import { useTranslation } from "react-i18next";

interface FormatItem {
  name: string;
  range: string;
  copy: string;
}

export default function FormatCards() {
  const { t } = useTranslation();
  const items = t("home.formatCards.items", { returnObjects: true }) as FormatItem[];

  return (
    <section id="formats" className="container section">
      <div className="section-head">
        <p className="eyebrow">{t("home.formatCards.eyebrow")}</p>
        <h2>{t("home.formatCards.heading")}</h2>
      </div>
      <div className="grid format-grid">
        {items.map((f, i) => (
          <div
            className="format-cell reveal"
            key={f.name}
            style={{ transitionDelay: `${Math.min(i * 60, 180)}ms` }}
          >
            <span className="range mono">{f.range}</span>
            <h3>{f.name}</h3>
            <p>{f.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
