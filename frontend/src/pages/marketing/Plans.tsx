import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/marketing.css";
import "../../styles/pricing.css";
import Header from "../../components/marketing/Header";
import Footer from "../../components/marketing/Footer";
import ArrowIcon from "../../components/shared/ArrowIcon";
import CheckIcon from "../../components/shared/CheckIcon";
import CalendarIcon from "../../components/shared/CalendarIcon";
import UsersIcon from "../../components/shared/UsersIcon";
import { useScrollReveal } from "../../hooks/useScrollReveal";

// AZN, billed once for a year of access — no daily rate. Every tier gets the
// full product: all 8 modules, every time. Tiers differ only in scale
// (events per year, attendees per event), which mirrors what actually costs
// more to run and what an organiser is actually paying for as they grow —
// unlike gating features, which made the entry tier unable to demonstrate
// the product's own headline promise (keypad voting was locked to tier 3).
const TIER_KEYS = ["Free", "Starter", "Professional", "Enterprise"] as const;
const TIER_META = [
  { price: 0, popular: false, eventsPerYear: 1, attendeesPerEvent: 50, overagePrice: null },
  { price: 199, popular: false, eventsPerYear: 4, attendeesPerEvent: 300, overagePrice: 59 },
  { price: 549, popular: true, eventsPerYear: 15, attendeesPerEvent: 1500, overagePrice: 49 },
  { price: null, popular: false, eventsPerYear: null, attendeesPerEvent: null, overagePrice: null },
] as const;

// Every module ships on every tier — see the note above TIER_META.
const MODULE_NAMES = [
  "Live Q&A",
  "Keypad Voting",
  "Score Game",
  "Survey",
  "Presentation",
  "Screen Management",
  "Analytics & Reporting",
  "Email Campaigns",
] as const;

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
          <div className="trust-bar">
            <span className="trust-bar-item">
              <CheckIcon />
              {t("plans.trustFast")}
            </span>
            <span className="trust-bar-item">
              <CheckIcon />
              {t("plans.trustNoApp")}
            </span>
            <span className="trust-bar-item">
              <CheckIcon />
              {t("plans.trustLanguages")}
            </span>
          </div>
        </div>

        <section className="container section-tight">
          <div className="section-head">
            <p className="eyebrow">{t("plans.includedEyebrow")}</p>
            <h2>{t("plans.includedHeading")}</h2>
            <p className="lede">{t("plans.includedLede")}</p>
          </div>
          <ul className="included-modules-grid reveal">
            {MODULE_NAMES.map((name) => (
              <li key={name}>
                <CheckIcon />
                <span>{t(`plans.modules.${name}`)}</span>
              </li>
            ))}
          </ul>
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
                  <h3 className="plan-card-name">{t(`plans.tiers.${tierKey}.name`)}</h3>
                  <p className="plan-card-tagline">{t(`plans.tiers.${tierKey}.tagline`)}</p>
                  <p className="plan-card-blurb">{t(`plans.tiers.${tierKey}.blurb`)}</p>
                  <div className="plan-price">
                    {meta.price !== null ? (
                      meta.price === 0 ? (
                        <span className="amount">{t("plans.free")}</span>
                      ) : (
                        <>
                          <span className="amount">₼{meta.price}</span>
                          <span className="unit">{t("plans.perYear")}</span>
                        </>
                      )
                    ) : (
                      <span className="unit" style={{ fontSize: "var(--fs-body)" }}>
                        {t("plans.tailored")}
                      </span>
                    )}
                  </div>

                  <div className="plan-included-row">
                    <CheckIcon />
                    <span>{t("plans.allModulesIncluded")}</span>
                  </div>
                  <div className="plan-credit-row">
                    <CalendarIcon />
                    <span>
                      {meta.eventsPerYear
                        ? t("plans.eventsPerYear", { count: meta.eventsPerYear })
                        : t("plans.unlimitedEvents")}
                    </span>
                  </div>
                  <div className="plan-credit-row">
                    <UsersIcon />
                    <span>
                      {meta.attendeesPerEvent
                        ? t("plans.attendeesPerEvent", { count: meta.attendeesPerEvent })
                        : t("plans.unlimitedAttendees")}
                    </span>
                  </div>

                  {meta.overagePrice !== null && (
                    <p className="plan-card-blurb" style={{ marginTop: "var(--space-2)", marginBottom: 0, flex: 1 }}>
                      {t("plans.extraEventPrice", { price: meta.overagePrice })}
                    </p>
                  )}

                  <hr className="plan-rule" style={{ marginTop: "var(--space-5)" }} />

                  {meta.price !== null ? (
                    <Link to="/register" className={`btn btn-block${meta.popular ? " btn-primary" : ""}`}>
                      {meta.price === 0 ? t("plans.startFree") : t("common.getStarted")}
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
