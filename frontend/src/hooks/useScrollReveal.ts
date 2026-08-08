import { useEffect } from "react";

/**
 * Observes every `.reveal` element currently in the document and adds
 * `.is-visible` the first time it enters the viewport. One observer for the
 * whole page keeps this cheap regardless of how many sections use it.
 * `prefers-reduced-motion` is handled entirely in CSS (transition duration
 * collapses to ~0), so no JS branch is needed here.
 */
export function useScrollReveal() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
