import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../i18n";
import GlobeIcon from "./GlobeIcon";

const LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  az: "AZ",
  ru: "RU",
};

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2) as SupportedLanguage;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function select(lang: SupportedLanguage) {
    i18n.changeLanguage(lang);
    setOpen(false);
  }

  return (
    <div className={`lang-switcher ${className}`} ref={ref}>
      <button
        type="button"
        className="lang-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
        {LABELS[SUPPORTED_LANGUAGES.includes(current) ? current : "en"]}
      </button>
      {open && (
        <ul className="lang-switcher-list" role="listbox">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={lang === current}
                className={`lang-switcher-option${lang === current ? " active" : ""}`}
                onClick={() => select(lang)}
              >
                {LABELS[lang]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
