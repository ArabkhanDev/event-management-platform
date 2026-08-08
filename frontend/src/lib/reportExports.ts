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

export function exportFullSessionReport(
  sessionLabel: string,
  questions: QuestionDto[],
  polls: PollDto[],
  surveyResultsList: SurveyResults[]
) {
  const rows: (string | number)[][] = [];

  rows.push(["SESSION REPORT", sessionLabel]);
  rows.push(["Generated", new Date().toLocaleString()]);
  rows.push([]);

  rows.push(["QUESTIONS", `${questions.length} total`]);
  rows.push(["Author", "Question", "Status", "Submitted at"]);
  for (const q of questions) {
    rows.push([q.authorName || "Anonymous", q.body, q.status, new Date(q.createdAt).toLocaleString()]);
  }
  rows.push([]);

  for (const poll of polls) {
    const total = poll.options.reduce((sum, o) => sum + o.votes, 0);
    rows.push(["POLL", poll.prompt, `${total} votes`, poll.status]);
    rows.push(["Option", "Votes", "Percentage"]);
    rows.push(...pollRows(poll));
    rows.push([]);
  }

  for (const results of surveyResultsList) {
    rows.push(["SURVEY", results.title, `${results.responseCount} responses`]);
    rows.push(["Question", "Type", "Answer / Option", "Count"]);
    rows.push(...surveyRows(results));
    rows.push([]);
  }

  downloadCsv(`session-report-${safeName(sessionLabel)}.csv`, rows);
}
