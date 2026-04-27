import { DriftEntry } from './differ';
import { scoreDrift } from './score';
import { formatTextReport } from './reporter';
import { formatMarkdownReport } from './formatter';
import { formatSuggestions, suggestFixes } from './suggest';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportOptions {
  format: 'text' | 'markdown' | 'json';
  includeSuggestions: boolean;
  includeScore: boolean;
  outputPath?: string;
}

export interface FullReport {
  generatedAt: string;
  format: string;
  body: string;
  score?: ReturnType<typeof scoreDrift>;
  suggestions?: string;
}

export function buildFullReport(
  entries: DriftEntry[],
  labels: [string, string],
  opts: ReportOptions
): FullReport {
  let body: string;
  if (opts.format === 'markdown') {
    body = formatMarkdownReport(entries, labels[0], labels[1]);
  } else if (opts.format === 'json') {
    body = JSON.stringify(entries, null, 2);
  } else {
    body = formatTextReport(entries, labels[0], labels[1]);
  }

  const report: FullReport = {
    generatedAt: new Date().toISOString(),
    format: opts.format,
    body,
  };

  if (opts.includeScore) {
    report.score = scoreDrift(entries);
  }

  if (opts.includeSuggestions) {
    const suggestions = suggestFixes(entries);
    report.suggestions = formatSuggestions(suggestions);
  }

  return report;
}

export function writeFullReport(report: FullReport, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const content =
    report.format === 'json'
      ? JSON.stringify(report, null, 2)
      : serializeReport(report);
  fs.writeFileSync(outputPath, content, 'utf-8');
}

function serializeReport(report: FullReport): string {
  const lines: string[] = [
    `Generated: ${report.generatedAt}`,
    `Format: ${report.format}`,
    '',
    report.body,
  ];
  if (report.score) {
    lines.push('', `Score: ${report.score.score} (${report.score.severity})`);
  }
  if (report.suggestions) {
    lines.push('', 'Suggestions:', report.suggestions);
  }
  return lines.join('\n');
}
