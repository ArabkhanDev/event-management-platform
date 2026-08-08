// Client-side CSV export: everything shown in a results panel is already
// loaded in memory (fetched for the view itself), so exporting is just
// serializing that data — no extra request, no server-side report job.

function escapeCell(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
  // Leading BOM so Excel opens UTF-8 CSVs (accented names, non-Latin text) correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
