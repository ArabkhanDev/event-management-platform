import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../shared/LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const LINKS = [
    { href: "/#modules", label: t("header.modules") },
    { href: "/#formats", label: t("header.formats") },
    { href: "/#how-it-works", label: t("header.howItWorks") },
  ];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark" aria-hidden="true" />
          meet2be
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          <Link to="/plans">{t("header.pricing")}</Link>
          <Link to="/join">{t("header.joinEvent")}</Link>
        </nav>
        <div className="nav-actions">
          <LanguageSwitcher />
          <Link to="/login" className="btn btn-ghost btn-sm nav-desktop-only">
            {t("common.logIn")}
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm nav-desktop-only">
            {t("common.bookDemo")}
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-icon nav-menu-btn"
            aria-label={open ? t("header.closeMenu") : t("header.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link to="/plans" onClick={() => setOpen(false)}>
            {t("header.pricing")}
          </Link>
          <Link to="/join" onClick={() => setOpen(false)}>
            {t("header.joinEvent")}
          </Link>
          <Link to="/login" onClick={() => setOpen(false)}>
            {t("common.logIn")}
          </Link>
          <Link to="/register" className="mobile-nav-cta" onClick={() => setOpen(false)}>
            {t("common.bookDemo")}
          </Link>
        </nav>
      )}
    </header>
  );
}
