import * as fs from 'fs';
import * as path from 'path';
import { DriftResult } from './differ';
import { formatTextReport } from './reporter';
import { formatMarkdownReport } from './formatter';
import { formatJsonReport } from './reporter';

export type ExportFormat = 'text' | 'json' | 'markdown';

export interface ExportOptions {
  outputPath: string;
  format: ExportFormat;
  label?: string;
}

export function resolveExportFormat(filePath: string): ExportFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  return 'text';
}

export function renderExport(
  drift: DriftResult[],
  format: ExportFormat,
  labels: [string, string]
): string {
  switch (format) {
    case 'json':
      return formatJsonReport(drift, labels);
    case 'markdown':
      return formatMarkdownReport(drift, labels);
    case 'text':
    default:
      return formatTextReport(drift, labels);
  }
}

export function exportReport(
  drift: DriftResult[],
  labels: [string, string],
  options: ExportOptions
): void {
  const format = options.format ?? resolveExportFormat(options.outputPath);
  const content = renderExport(drift, format, labels);
  const dir = path.dirname(options.outputPath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(options.outputPath, content, 'utf-8');
}
