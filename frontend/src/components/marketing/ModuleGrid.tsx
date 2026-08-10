import { useTranslation } from "react-i18next";

interface ModuleItem {
  title: string;
  copy: string;
}

/** Widest column count the grid uses (see .module-grid breakpoints). */
const MAX_COLUMNS = 4;

export default function ModuleGrid() {
  const { t } = useTranslation();
  const items = t("home.moduleGrid.items", { returnObjects: true }) as ModuleItem[];

  // .grid paints its gaps by showing a line-coloured backdrop between cells, so
  // a row that does not fill leaves the backdrop exposed as a solid block.
  // Padding to a multiple of the widest column count keeps every breakpoint
  // (4, 2 and 1 columns) exactly full.
  const fillerCount = (MAX_COLUMNS - (items.length % MAX_COLUMNS)) % MAX_COLUMNS;

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
        {Array.from({ length: fillerCount }, (_, i) => (
          <div className="module-cell" key={`filler-${i}`} aria-hidden="true" />
        ))}
      </div>
    </section>
  );
}
