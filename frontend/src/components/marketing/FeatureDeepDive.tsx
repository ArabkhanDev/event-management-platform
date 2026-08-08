import { useTranslation } from "react-i18next";

interface FeatureItem {
  eyebrow: string;
  title: string;
  copy: string;
}

function QAPreview({ lines }: { lines: string[] }) {
  const votes = [42, 27, 11];
  return (
    <div className="mock-qa" aria-hidden="true">
      {lines.map((line, i) => (
        <div className={`mock-qa-item${i === 0 ? " onscreen" : ""}`} key={line}>
          <span>{line}</span>
          <span className="mock-qa-votes">▲ {votes[i]}</span>
        </div>
      ))}
    </div>
  );
}

function PollPreview({ labels }: { labels: string[] }) {
  const pcts = [54, 31, 15];
  return (
    <div className="mock-poll" aria-hidden="true">
      {labels.map((label, i) => (
        <div className="mock-poll-row" key={label}>
          <span>{label}</span>
          <div className="mock-poll-track">
            <div className="mock-poll-fill" style={{ width: `${pcts[i]}%` }} />
          </div>
          <span>{pcts[i]}%</span>
        </div>
      ))}
    </div>
  );
}

function SurveyPreview({ prompt }: { prompt: string }) {
  return (
    <div className="mock-survey" aria-hidden="true">
      <div>
        <p className="mono" style={{ color: "var(--color-ink-faint)", marginBottom: "var(--space-2)" }}>
          {prompt}
        </p>
        <div className="mock-survey-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`mock-survey-star${n <= 4 ? " filled" : ""}`}>
              {n}
            </span>
          ))}
        </div>
      </div>
      <div className="mock-poll-row" style={{ gridTemplateColumns: "1fr 48px" }}>
        <div className="mock-poll-track">
          <div className="mock-poll-fill" style={{ width: "78%" }} />
        </div>
        <span>78%</span>
      </div>
    </div>
  );
}

function ScreenPreview({ badge, text }: { badge: string; text: string }) {
  return (
    <div className="mock-screen" aria-hidden="true">
      <span className="mock-screen-badge">{badge}</span>
      <p className="mock-screen-text">{text}</p>
    </div>
  );
}

export default function FeatureDeepDive() {
  const { t } = useTranslation();
  const items = t("home.featureDeepDive.items", { returnObjects: true }) as FeatureItem[];
  const qaLines = t("home.featureDeepDive.qaPreview", { returnObjects: true }) as string[];
  const pollLabels = t("home.featureDeepDive.pollPreview", { returnObjects: true }) as string[];
  const surveyPrompt = t("home.featureDeepDive.surveyPreviewPrompt");
  const screenBadge = t("home.featureDeepDive.screenPreviewBadge");
  const screenText = t("home.featureDeepDive.screenPreviewText");

  const visuals = [
    <QAPreview lines={qaLines} />,
    <PollPreview labels={pollLabels} />,
    <SurveyPreview prompt={surveyPrompt} />,
    <ScreenPreview badge={screenBadge} text={screenText} />,
  ];

  return (
    <section className="container section">
      <div className="section-head">
        <p className="eyebrow">{t("home.featureDeepDive.eyebrow")}</p>
        <h2>{t("home.featureDeepDive.heading")}</h2>
      </div>
      {items.map((f, i) => (
        <div className={`deep-dive reveal${i % 2 === 1 ? " reverse" : ""}`} key={f.title}>
          <div className="deep-dive-copy">
            <p className="eyebrow">{f.eyebrow}</p>
            <h3>{f.title}</h3>
            <p>{f.copy}</p>
          </div>
          <div className="deep-dive-visual">{visuals[i]}</div>
        </div>
      ))}
    </section>
  );
}
