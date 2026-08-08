import { useTranslation } from "react-i18next";

interface StepItem {
  title: string;
  copy: string;
}

export default function HowItWorks() {
  const { t } = useTranslation();
  const steps = t("home.howItWorks.steps", { returnObjects: true }) as StepItem[];

  return (
    <section id="how-it-works" className="container section">
      <div className="section-head">
        <p className="eyebrow">{t("home.howItWorks.eyebrow")}</p>
        <h2>{t("home.howItWorks.heading")}</h2>
      </div>
      <div className="grid how-grid">
        {steps.map((s, i) => (
          <div className="how-cell reveal" key={s.title} style={{ transitionDelay: `${i * 80}ms` }}>
            <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
            <h3>{s.title}</h3>
            <p>{s.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
