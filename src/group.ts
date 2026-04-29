import { DriftEntry } from './differ';

export type GroupBy = 'kind' | 'key' | 'prefix';

export interface DriftGroup {
  label: string;
  entries: DriftEntry[];
}

export function groupDrift(entries: DriftEntry[], by: GroupBy): DriftGroup[] {
  const map = new Map<string, DriftEntry[]>();

  for (const entry of entries) {
    let label: string;
    if (by === 'kind') {
      label = entry.kind;
    } else if (by === 'key') {
      label = entry.key;
    } else {
      // prefix: first segment before '_' or '.'
      const match = entry.key.match(/^([^_.]+)[_.]/);
      label = match ? match[1] : entry.key;
    }

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, entries]) => ({ label, entries }));
}

export function formatGroupReport(groups: DriftGroup[], by: GroupBy): string {
  if (groups.length === 0) return 'No drift detected.\n';

  const lines: string[] = [`Drift grouped by ${by}:\n`];

  for (const group of groups) {
    lines.push(`  [${group.label}] (${group.entries.length} item${group.entries.length !== 1 ? 's' : ''})`);
    for (const entry of group.entries) {
      if (entry.kind === 'changed') {
        lines.push(`    ~ ${entry.key}: ${JSON.stringify(entry.base)} → ${JSON.stringify(entry.target)}`);
      } else if (entry.kind === 'added') {
        lines.push(`    + ${entry.key}: ${JSON.stringify(entry.target)}`);
      } else {
        lines.push(`    - ${entry.key}: ${JSON.stringify(entry.base)}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}

export function parseGroupArgs(args: string[]): GroupBy {
  const idx = args.indexOf('--group-by');
  if (idx !== -1 && args[idx + 1]) {
    const val = args[idx + 1];
    if (val === 'kind' || val === 'key' || val === 'prefix') return val;
  }
  return 'kind';
}
