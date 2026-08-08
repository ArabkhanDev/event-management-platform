import { useTranslation } from "react-i18next";

interface ModuleItem {
  title: string;
  copy: string;
}

export default function ModuleGrid() {
  const { t } = useTranslation();
  const items = t("home.moduleGrid.items", { returnObjects: true }) as ModuleItem[];

  return (
    <section id="modules" className="container section">
      <div className="section-head">
        <p className="eyebrow">{t("home.moduleGrid.eyebrow")}</p>
        <h2>{t("home.moduleGrid.heading")}</h2>
        <p className="lede">{t("home.moduleGrid.lede")}</p>
      </div>
      <div className="grid module-grid">
        {items.map((m, i) => (
          <div
            className="module-cell reveal"
            key={m.title}
            style={{ transitionDelay: `${Math.min(i * 40, 240)}ms` }}
          >
            <span className="idx">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h4>{m.title}</h4>
              <p>{m.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
