import { DriftEntry } from './differ';

export interface DriftScore {
  total: number;
  added: number;
  removed: number;
  changed: number;
  severity: 'none' | 'low' | 'medium' | 'high';
  summary: string;
}

export function scoreDrift(entries: DriftEntry[]): DriftScore {
  const added = entries.filter(e => e.kind === 'added').length;
  const removed = entries.filter(e => e.kind === 'removed').length;
  const changed = entries.filter(e => e.kind === 'changed').length;
  const total = added + removed + changed;

  const severity = computeSeverity(total, removed, changed);
  const summary = buildSummary(total, added, removed, changed, severity);

  return { total, added, removed, changed, severity, summary };
}

function computeSeverity(
  total: number,
  removed: number,
  changed: number
): DriftScore['severity'] {
  if (total === 0) return 'none';
  // Removed and changed keys are more impactful than added
  const weightedScore = changed * 2 + removed * 3 + (total - changed - removed);
  if (weightedScore >= 15) return 'high';
  if (weightedScore >= 6) return 'medium';
  return 'low';
}

function buildSummary(
  total: number,
  added: number,
  removed: number,
  changed: number,
  severity: DriftScore['severity']
): string {
  if (total === 0) return 'No drift detected.';
  const parts: string[] = [];
  if (added) parts.push(`${added} added`);
  if (removed) parts.push(`${removed} removed`);
  if (changed) parts.push(`${changed} changed`);
  return `Drift score: ${severity.toUpperCase()} — ${parts.join(', ')} (${total} total key${total !== 1 ? 's' : ''})`;
}

export function formatScoreReport(score: DriftScore): string {
  const lines: string[] = [
    `Drift Severity : ${score.severity.toUpperCase()}`,
    `Total Keys     : ${score.total}`,
    `  Added        : ${score.added}`,
    `  Removed      : ${score.removed}`,
    `  Changed      : ${score.changed}`,
    `Summary        : ${score.summary}`,
  ];
  return lines.join('\n');
}
