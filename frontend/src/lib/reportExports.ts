import type ExcelJS from "exceljs";
import { downloadCsv } from "./exportCsv";
import type { PollDto, QuestionDto, SurveyResults } from "../types/api";

function safeName(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

export function exportQuestionsCsv(sessionId: string, questions: QuestionDto[]) {
  const rows: (string | number)[][] = [["Author", "Question", "Status", "Submitted at"]];
  for (const q of questions) {
    rows.push([q.authorName || "Anonymous", q.body, q.status, new Date(q.createdAt).toLocaleString()]);
  }
  downloadCsv(`questions-session-${sessionId}.csv`, rows);
}

export function pollRows(poll: PollDto): (string | number)[][] {
  const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
  return poll.options.map((opt) => [
    opt.label,
    opt.votes,
    `${total > 0 ? Math.round((opt.votes / total) * 100) : 0}%`,
  ]);
}

export function exportPollCsv(poll: PollDto) {
  const rows: (string | number)[][] = [["Option", "Votes", "Percentage"], ...pollRows(poll)];
  downloadCsv(`poll-${safeName(poll.prompt) || poll.id}.csv`, rows);
}

export function surveyRows(results: SurveyResults): (string | number)[][] {
  const rows: (string | number)[][] = [];
  for (const q of results.questions) {
    if (q.type === "TEXT") {
      (q.aggregate as string[]).forEach((answer) => rows.push([q.prompt, q.type, answer, 1]));
    } else {
      (q.aggregate as { option: string; count: number }[]).forEach((a) =>
        rows.push([q.prompt, q.type, a.option, a.count])
      );
    }
  }
  return rows;
}

export function exportSurveyCsv(results: SurveyResults) {
  const rows: (string | number)[][] = [["Question", "Type", "Answer / Option", "Count"], ...surveyRows(results)];
  downloadCsv(`survey-${safeName(results.title) || results.surveyId}.csv`, rows);
}

// ---------- Full session report (.xlsx) ----------
//
// This used to be one flat CSV with every section's rows stacked on top of
// each other — questions, then each poll, then each survey — sharing the same
// four columns despite having completely different shapes. Opened in Excel it
// reads as a wall of misaligned cells. A workbook with one sheet per section
// is what "full report" actually looks like when someone opens it: real
// columns per table, a bold header row, and a tab per topic instead of one
// undifferentiated blob.
//
// ExcelJS is loaded on demand (not from the top-level import) so its ~1MB
// stays out of the bundle everyone downloads just to load the analytics page;
// it only loads for the person who clicks "Export full report".

const BRAND_FILL = "FF2952E3";
const BRAND_TEXT = "FFFFFFFF";
const HEADER_FILL = "FFF1F5F9";
const HEADER_TEXT = "FF0B1220";
const BORDER_COLOR = "FFD0D5DD";

function styleTitleRow(row: ExcelJS.Row, span: number) {
  row.getCell(1).font = { bold: true, size: 13, color: { argb: BRAND_TEXT } };
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_FILL } };
  row.getCell(1).alignment = { vertical: "middle" };
  row.height = 22;
  for (let col = 2; col <= span; col++) {
    row.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_FILL } };
  }
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.border = { bottom: { style: "thin", color: { argb: BORDER_COLOR } } };
  });
  row.height = 18;
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  sessionLabel: string,
  stats: { label: string; value: number }[]
) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [{ width: 24 }, { width: 14 }];

  const title = sheet.addRow([sessionLabel]);
  sheet.mergeCells(title.number, 1, title.number, 2);
  styleTitleRow(title, 2);

  const generated = sheet.addRow([`Generated ${new Date().toLocaleString()}`]);
  generated.getCell(1).font = { italic: true, color: { argb: "FF667085" } };
  sheet.mergeCells(generated.number, 1, generated.number, 2);
  sheet.addRow([]);

  const header = sheet.addRow(["Metric", "Value"]);
  styleHeaderRow(header);
  stats.forEach((s) => sheet.addRow([s.label, s.value]));
}

function addQuestionsSheet(workbook: ExcelJS.Workbook, questions: QuestionDto[]) {
  const sheet = workbook.addWorksheet("Questions");
  sheet.columns = [
    { header: "Author", key: "author", width: 22 },
    { header: "Question", key: "question", width: 60 },
    { header: "Status", key: "status", width: 14 },
    { header: "Submitted at", key: "submittedAt", width: 20 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  if (questions.length === 0) {
    sheet.addRow(["No questions were submitted in this session."]);
    return;
  }
  for (const q of questions) {
    sheet.addRow({
      author: q.authorName || "Anonymous",
      question: q.body,
      status: q.status,
      submittedAt: new Date(q.createdAt).toLocaleString(),
    });
  }
}

function addPollsSheet(workbook: ExcelJS.Workbook, polls: PollDto[]) {
  const sheet = workbook.addWorksheet("Polls");
  sheet.columns = [{ width: 32 }, { width: 12 }, { width: 12 }];

  if (polls.length === 0) {
    sheet.addRow(["No polls were run in this session."]);
    return;
  }

  for (const poll of polls) {
    const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
    const title = sheet.addRow([`${poll.prompt}  ·  ${total} votes  ·  ${poll.status}`]);
    sheet.mergeCells(title.number, 1, title.number, 3);
    styleTitleRow(title, 3);

    styleHeaderRow(sheet.addRow(["Option", "Votes", "Percentage"]));
    pollRows(poll).forEach((r) => sheet.addRow(r));
    sheet.addRow([]);
  }
}

function addSurveysSheet(workbook: ExcelJS.Workbook, surveyResultsList: SurveyResults[]) {
  const sheet = workbook.addWorksheet("Surveys");
  sheet.columns = [{ width: 32 }, { width: 16 }, { width: 12 }];

  if (surveyResultsList.length === 0) {
    sheet.addRow(["No surveys were run in this session."]);
    return;
  }

  for (const results of surveyResultsList) {
    const title = sheet.addRow([`${results.title}  ·  ${results.responseCount} responses`]);
    sheet.mergeCells(title.number, 1, title.number, 3);
    styleTitleRow(title, 3);

    for (const rq of results.questions) {
      const sub = sheet.addRow([rq.prompt]);
      sub.getCell(1).font = { bold: true };
      sheet.mergeCells(sub.number, 1, sub.number, 3);

      if (rq.type === "TEXT") {
        styleHeaderRow(sheet.addRow(["Answer", "", ""]));
        (rq.aggregate as string[]).forEach((answer) => sheet.addRow([answer]));
      } else {
        styleHeaderRow(sheet.addRow(["Option", "Count", ""]));
        (rq.aggregate as { option: string; count: number }[]).forEach((a) => sheet.addRow([a.option, a.count]));
      }
      sheet.addRow([]);
    }
  }
}

export async function exportFullSessionReport(
  sessionLabel: string,
  questions: QuestionDto[],
  polls: PollDto[],
  surveyResultsList: SurveyResults[]
) {
  const { default: Excel } = await import("exceljs");
  const workbook = new Excel.Workbook();
  workbook.creator = "meet2be";
  workbook.created = new Date();

  const totalVotes = polls.reduce((sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0), 0);
  const onScreen = questions.filter((q) => q.status === "ON_SCREEN").length;
  const totalResponses = surveyResultsList.reduce((sum, r) => sum + r.responseCount, 0);

  addSummarySheet(workbook, sessionLabel, [
    { label: "Questions", value: questions.length },
    { label: "Sent to screen", value: onScreen },
    { label: "Polls", value: polls.length },
    { label: "Votes cast", value: totalVotes },
    { label: "Surveys", value: surveyResultsList.length },
    { label: "Survey responses", value: totalResponses },
  ]);
  addQuestionsSheet(workbook, questions);
  addPollsSheet(workbook, polls);
  addSurveysSheet(workbook, surveyResultsList);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-report-${safeName(sessionLabel)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
