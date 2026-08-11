import { useTranslation } from "react-i18next";

/**
 * Page numbers to render, with `null` standing for a gap.
 *
 * Always shows the first and last page plus a window around the current one, so
 * the control keeps a fixed width however many pages exist — the alternative,
 * listing every page, makes the row reflow as the table grows.
 */
function pageItems(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const window = new Set<number>([0, total - 1, current]);
  if (current - 1 > 0) window.add(current - 1);
  if (current + 1 < total - 1) window.add(current + 1);
  // Keep the row a steady length near the ends, where the window is clipped.
  if (current <= 2) [1, 2, 3].forEach((p) => window.add(p));
  if (current >= total - 3) [total - 4, total - 3, total - 2].forEach((p) => window.add(p));

  const sorted = Array.from(window)
    .filter((p) => p >= 0 && p < total)
    .sort((a, b) => a - b);

  const items: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(null);
    items.push(p);
  });
  return items;
}

/**
 * @param page zero-based, matching the API
 * @param summary already-translated count line ("42 users"). Passed in rather
 *        than built here from a count and a noun: languages disagree on both
 *        word order and how the noun agrees with the number, so only the caller
 *        can pick the right plural form for what it is counting.
 */
export default function Pagination({
  page,
  totalPages,
  summary,
  onChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  summary: string;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  // One page of results needs no navigation, but the count is still worth
  // stating — it answers "is that everything?" without making them count rows.
  if (totalPages <= 1) {
    return (
      <div className="pagination">
        <p className="pagination-summary">{summary}</p>
      </div>
    );
  }

  return (
    <nav className="pagination" aria-label={t("common.pagination.ariaLabel")}>
      <p className="pagination-summary">{summary}</p>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          disabled={disabled || page <= 0}
          onClick={() => onChange(page - 1)}
        >
          {t("common.pagination.previous")}
        </button>

        <ul className="pagination-pages">
          {pageItems(page, totalPages).map((p, i) =>
            p === null ? (
              <li key={`gap-${i}`} className="pagination-gap" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  className={`pagination-page${p === page ? " is-current" : ""}`}
                  aria-current={p === page ? "page" : undefined}
                  aria-label={t("common.pagination.goToPage", { page: p + 1 })}
                  disabled={disabled}
                  onClick={() => onChange(p)}
                >
                  {p + 1}
                </button>
              </li>
            )
          )}
        </ul>

        <button
          type="button"
          className="btn btn-sm btn-ghost"
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          {t("common.pagination.next")}
        </button>
      </div>
    </nav>
  );
}
