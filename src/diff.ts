import { DriftEntry } from './differ';

export interface DiffStat {
  key: string;
  kind: 'added' | 'removed' | 'changed' | 'equal';
  leftValue: string | undefined;
  rightValue: string | undefined;
  similarity?: number;
}

export interface DiffSummary {
  total: number;
  added: number;
  removed: number;
  changed: number;
  equal: number;
  changeRate: number;
}

/**
 * Compute a similarity ratio between two string values (0–1).
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

/**
 * Build a flat list of DiffStat entries from two config maps.
 */
export function buildDiffStats(
  left: Record<string, string>,
  right: Record<string, string>
): DiffStat[] {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const stats: DiffStat[] = [];

  for (const key of Array.from(keys).sort()) {
    const lv = left[key];
    const rv = right[key];
    if (lv === undefined) {
      stats.push({ key, kind: 'added', leftValue: undefined, rightValue: rv });
    } else if (rv === undefined) {
      stats.push({ key, kind: 'removed', leftValue: lv, rightValue: undefined });
    } else if (lv !== rv) {
      stats.push({
        key,
        kind: 'changed',
        leftValue: lv,
        rightValue: rv,
        similarity: stringSimilarity(lv, rv),
      });
    } else {
      stats.push({ key, kind: 'equal', leftValue: lv, rightValue: rv });
    }
  }

  return stats;
}

/**
 * Summarize DiffStat list into counts and change rate.
 */
export function summarizeDiffStats(stats: DiffStat[]): DiffSummary {
  const summary: DiffSummary = { total: stats.length, added: 0, removed: 0, changed: 0, equal: 0, changeRate: 0 };
  for (const s of stats) {
    summary[s.kind]++;
  }
  summary.changeRate = summary.total > 0
    ? parseFloat(((summary.added + summary.removed + summary.changed) / summary.total).toFixed(4))
    : 0;
  return summary;
}

/**
 * Format a human-readable diff stats report.
 */
export function formatDiffStatsReport(stats: DiffStat[], summary: DiffSummary): string {
  const lines: string[] = ['=== Diff Stats ===', ''];
  for (const s of stats) {
    if (s.kind === 'added')   lines.push(`  + ${s.key}: ${s.rightValue}`);
    if (s.kind === 'removed') lines.push(`  - ${s.key}: ${s.leftValue}`);
    if (s.kind === 'changed') lines.push(`  ~ ${s.key}: ${s.leftValue} → ${s.rightValue} (sim: ${(s.similarity ?? 0).toFixed(2)})`);
  }
  lines.push('');
  lines.push(`Total: ${summary.total}  Added: ${summary.added}  Removed: ${summary.removed}  Changed: ${summary.changed}  Equal: ${summary.equal}`);
  lines.push(`Change rate: ${(summary.changeRate * 100).toFixed(1)}%`);
  return lines.join('\n');
}
