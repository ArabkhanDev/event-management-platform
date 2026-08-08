import "../../styles/marketing.css";
import Header from "../../components/marketing/Header";
import Hero from "../../components/marketing/Hero";
import ModuleGrid from "../../components/marketing/ModuleGrid";
import FormatCards from "../../components/marketing/FormatCards";
import FeatureDeepDive from "../../components/marketing/FeatureDeepDive";
import HowItWorks from "../../components/marketing/HowItWorks";
import ClosingCTA from "../../components/marketing/ClosingCTA";
import Footer from "../../components/marketing/Footer";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function Home() {
  useScrollReveal();
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <hr className="rule" />
        <ModuleGrid />
        <hr className="rule" />
        <FormatCards />
        <hr className="rule" />
        <FeatureDeepDive />
        <hr className="rule" />
        <HowItWorks />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
