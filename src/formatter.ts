import { DriftReport } from './differ';

export type OutputFormat = 'text' | 'json' | 'markdown';

export function formatMarkdownReport(report: DriftReport): string {
  const lines: string[] = [];

  lines.push('# Config Drift Report');
  lines.push('');
  lines.push(`**Environments compared:** \`${report.from}\` → \`${report.to}\``);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  if (!report.hasDrift) {
    lines.push('> ✅ No drift detected. Environments are in sync.');
    return lines.join('\n');
  }

  lines.push(`> ⚠️ Drift detected across **${report.entries.length}** key(s).`);
  lines.push('');

  const added = report.entries.filter(e => e.kind === 'added');
  const removed = report.entries.filter(e => e.kind === 'removed');
  const changed = report.entries.filter(e => e.kind === 'changed');

  if (added.length > 0) {
    lines.push('## ➕ Added Keys');
    lines.push('');
    lines.push('| Key | Value in `' + report.to + '` |');
    lines.push('|-----|-------|');
    for (const entry of added) {
      lines.push(`| \`${entry.key}\` | \`${entry.toValue ?? ''}\` |`);
    }
    lines.push('');
  }

  if (removed.length > 0) {
    lines.push('## ➖ Removed Keys');
    lines.push('');
    lines.push('| Key | Value in `' + report.from + '` |');
    lines.push('|-----|-------|');
    for (const entry of removed) {
      lines.push(`| \`${entry.key}\` | \`${entry.fromValue ?? ''}\` |`);
    }
    lines.push('');
  }

  if (changed.length > 0) {
    lines.push('## 🔄 Changed Keys');
    lines.push('');
    lines.push(`| Key | \`${report.from}\` | \`${report.to}\` |`);
    lines.push('|-----|-------|-------|');
    for (const entry of changed) {
      lines.push(`| \`${entry.key}\` | \`${entry.fromValue ?? ''}\` | \`${entry.toValue ?? ''}\` |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function renderOutput(report: DriftReport, format: OutputFormat): string {
  switch (format) {
    case 'markdown':
      return formatMarkdownReport(report);
    case 'json':
      return JSON.stringify(report, null, 2);
    case 'text':
    default: {
      const { formatTextReport } = require('./reporter');
      return formatTextReport(report);
    }
  }
}
