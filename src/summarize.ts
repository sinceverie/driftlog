import { DriftEntry } from './differ';

export interface DriftSummary {
  total: number;
  added: number;
  removed: number;
  changed: number;
  topKeys: string[];
  mostDriftedEnv: string | null;
  envCounts: Record<string, number>;
}

export function summarizeDrift(entries: DriftEntry[]): DriftSummary {
  let added = 0;
  let removed = 0;
  let changed = 0;
  const keyCounts: Record<string, number> = {};
  const envCounts: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.kind === 'added') added++;
    else if (entry.kind === 'removed') removed++;
    else if (entry.kind === 'changed') changed++;

    keyCounts[entry.key] = (keyCounts[entry.key] ?? 0) + 1;

    const env = entry.env ?? 'unknown';
    envCounts[env] = (envCounts[env] ?? 0) + 1;
  }

  const topKeys = Object.entries(keyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const mostDriftedEnv =
    Object.entries(envCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    total: entries.length,
    added,
    removed,
    changed,
    topKeys,
    mostDriftedEnv,
    envCounts,
  };
}

export function formatSummaryReport(summary: DriftSummary): string {
  const lines: string[] = [
    '=== Drift Summary ===',
    `Total entries : ${summary.total}`,
    `  Added       : ${summary.added}`,
    `  Removed     : ${summary.removed}`,
    `  Changed     : ${summary.changed}`,
  ];

  if (summary.topKeys.length > 0) {
    lines.push(`Top drifted keys: ${summary.topKeys.join(', ')}`);
  }

  if (summary.mostDriftedEnv) {
    lines.push(`Most drifted env: ${summary.mostDriftedEnv} (${summary.envCounts[summary.mostDriftedEnv]} entries)`);
  }

  const envLines = Object.entries(summary.envCounts)
    .map(([env, count]) => `  ${env}: ${count}`)
    .join('\n');
  if (envLines) {
    lines.push('Env breakdown:', envLines);
  }

  return lines.join('\n');
}
