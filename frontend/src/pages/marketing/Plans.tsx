import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/marketing.css";
import "../../styles/pricing.css";
import Header from "../../components/marketing/Header";
import Footer from "../../components/marketing/Footer";
import ArrowIcon from "../../components/shared/ArrowIcon";
import CheckIcon from "../../components/shared/CheckIcon";
import LayersIcon from "../../components/shared/LayersIcon";
import CalendarIcon from "../../components/shared/CalendarIcon";
import { useScrollReveal } from "../../hooks/useScrollReveal";

// AZN, billed once for a year of access — no daily rate. Each tier includes
// a yearly event quota (Enterprise is uncapped); extra events beyond the
// quota are paid per-event without needing to upgrade.
const TIER_KEYS = ["Core", "Growth", "Congress", "Enterprise"] as const;
const TIER_META = [
  { price: 149, popular: false, eventsPerYear: 3 },
  { price: 349, popular: true, eventsPerYear: 8 },
  { price: 799, popular: false, eventsPerYear: 20 },
  { price: null, popular: false, eventsPerYear: null },
] as const;

// Grouped by the tier that first unlocks them — mirrors a 4 / 6 / 7 / 8
// cumulative module count across the four tiers.
const MODULE_KEYS = [
  { name: "Live Q&A", minTier: 0 },
  { name: "Screen Management", minTier: 0 },
  { name: "Presentation", minTier: 0 },
  { name: "Analytics & Reporting", minTier: 0 },
  { name: "Survey", minTier: 1 },
  { name: "Email Campaigns", minTier: 1 },
  { name: "Keypad Voting", minTier: 2 },
  { name: "Score Game", minTier: 3 },
] as const;

function moduleCountFor(tierIndex: number) {
  return MODULE_KEYS.filter((m) => m.minTier <= tierIndex).length;
}

function newModulesForTier(tierIndex: number) {
  return MODULE_KEYS.filter((m) => m.minTier === tierIndex);
}

interface StepItem {
  title: string;
  copy: string;
}

interface FaqItem {
  q: string;
  a: string;
}

export default function Plans() {
  useScrollReveal();
  const { t } = useTranslation();

  const steps = t("plans.steps", { returnObjects: true }) as StepItem[];
  const faqs = t("plans.faqs", { returnObjects: true }) as FaqItem[];

  return (
    <>
      <Header />
      <main>
        <div className="container plan-hero">
          <p className="eyebrow">{t("plans.eyebrow")}</p>
          <h1>{t("plans.heading")}</h1>
          <p className="lede">{t("plans.lede")}</p>
          <div className="trust-chips">
            <span className="trust-chip">
              <CheckIcon />
              {t("plans.trustGdpr")}
            </span>
            <span className="trust-chip">
              <CheckIcon />
              {t("plans.trustFast")}
            </span>
            <span className="trust-chip">
              <CheckIcon />
              {t("plans.trustNoApp")}
            </span>
          </div>
        </div>

        <section className="container section-tight">
          <div className="section-head">
            <p className="eyebrow">{t("plans.includedEyebrow")}</p>
            <h2>{t("plans.includedHeading")}</h2>
            <p className="lede">{t("plans.includedLede")}</p>
          </div>
          <div className="compare-scroll reveal">
            <table className="compare-table">
              <caption className="visually-hidden">{t("plans.tableCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">{t("plans.moduleColumn")}</span>
                  </th>
                  {TIER_KEYS.map((tierKey) => (
                    <th scope="col" key={tierKey}>
                      {tierKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_KEYS.map((m) => (
                  <tr key={m.name}>
                    <th scope="row">{t(`plans.modules.${m.name}`)}</th>
                    {TIER_KEYS.map((tierKey, i) => (
                      <td key={tierKey}>
                        {m.minTier <= i ? (
                          <>
                            <CheckIcon className="icon check" />
                            <span className="visually-hidden">{t("plans.includedInTier", { tier: tierKey })}</span>
                          </>
                        ) : (
                          <>
                            <span className="dash" aria-hidden="true">
                              —
                            </span>
                            <span className="visually-hidden">{t("plans.notIncludedInTier", { tier: tierKey })}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="container section">
          <div className="section-head">
            <p className="eyebrow">{t("plans.howEyebrow")}</p>
            <h2>{t("plans.howHeading")}</h2>
          </div>
          <div className="grid how-grid">
            {steps.map((s, i) => (
              <div className="how-cell reveal" key={s.title} style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container section-tight" id="tiers">
          <div className="section-head">
            <p className="eyebrow">{t("plans.tiersEyebrow")}</p>
            <h2>{t("plans.tiersHeading")}</h2>
            <p className="lede">{t("plans.tiersLede")}</p>
          </div>
          <div className="plan-cards">
            {TIER_KEYS.map((tierKey, i) => {
              const meta = TIER_META[i];
              return (
                <div
                  className={`plan-card reveal${meta.popular ? " popular" : ""}`}
                  key={tierKey}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {meta.popular && <span className="plan-card-badge">{t("plans.mostPopular")}</span>}
                  <h3 className="plan-card-name">{tierKey}</h3>
                  <p className="plan-card-tagline">{t(`plans.tiers.${tierKey}.tagline`)}</p>
                  <p className="plan-card-blurb">{t(`plans.tiers.${tierKey}.blurb`)}</p>
                  <div className="plan-price">
                    {meta.price ? (
                      <>
                        <span className="amount">₼{meta.price}</span>
                        <span className="unit">{t("plans.perYear")}</span>
                      </>
                    ) : (
                      <span className="unit" style={{ fontSize: "var(--fs-body)" }}>
                        {t("plans.tailored")}
                      </span>
                    )}
                  </div>
                  <div className="plan-included-row">
                    <LayersIcon />
                    <span>{t("plans.corePlatformIncluded")}</span>
                  </div>
                  <div className="plan-credit-row">
                    <CalendarIcon />
                    <span>
                      {meta.eventsPerYear ? t("plans.eventsPerYear", { count: meta.eventsPerYear }) : t("plans.unlimitedEvents")}
                    </span>
                  </div>

                  <hr className="plan-rule" />

                  <div className="plan-modules-head">
                    <span className="label">{t("plans.includedLabel")}</span>
                    <span className="plan-modules-count">{t("common.count.modules", { count: moduleCountFor(i) })}</span>
                  </div>

                  {i > 0 && (
                    <div className="plan-inherit-row">
                      <LayersIcon />
                      <span>{t("plans.everythingIn", { tier: TIER_KEYS[i - 1] })}</span>
                    </div>
                  )}

                  <ul className="plan-module-list">
                    {newModulesForTier(i).map((m) => (
                      <li key={m.name}>
                        <CheckIcon />
                        <span>{t(`plans.modules.${m.name}`)}</span>
                      </li>
                    ))}
                  </ul>

                  {meta.price ? (
                    <Link to="/register" className={`btn btn-block${meta.popular ? " btn-primary" : ""}`}>
                      {t("common.getStarted")}
                    </Link>
                  ) : (
                    <a href="mailto:hello@meet2be.example" className="btn btn-block">
                      {t("plans.requestQuote")}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <p className="plan-discount-note">{t("plans.discountNote")}</p>
        </section>

        <section className="container section">
          <div style={{ textAlign: "center", marginBottom: "var(--space-7)" }}>
            <p className="eyebrow">{t("plans.faqEyebrow")}</p>
            <h2>{t("plans.faqHeading")}</h2>
          </div>
          <div className="faq-list">
            {faqs.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  {item.q}
                  <svg className="icon chevron" viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div className="container" style={{ textAlign: "center" }}>
            <p className="eyebrow">{t("plans.ctaEyebrow")}</p>
            <h2 style={{ maxWidth: "20ch", margin: "0 auto var(--space-5)" }}>{t("plans.ctaHeading")}</h2>
            <p className="lede" style={{ margin: "0 auto var(--space-6)", textAlign: "center", maxWidth: "50ch" }}>
              {t("plans.ctaLede")}
            </p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <Link to="/register" className="btn btn-primary">
                {t("common.getStarted")}
              </Link>
              <a href="mailto:hello@meet2be.example" className="btn">
                {t("plans.requestDemo")}
                <ArrowIcon />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
