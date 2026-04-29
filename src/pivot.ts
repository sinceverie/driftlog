import { DriftEntry } from './differ';

export interface PivotRow {
  key: string;
  [env: string]: string;
}

export interface PivotTable {
  envs: string[];
  rows: PivotRow[];
}

/**
 * Build a pivot table where rows are config keys and columns are environment labels.
 * Each cell shows the value for that key in that environment, or '-' if absent.
 */
export function buildPivotTable(
  entries: DriftEntry[],
  envLabels: string[]
): PivotTable {
  const keyMap = new Map<string, Map<string, string>>();

  for (const entry of entries) {
    if (!keyMap.has(entry.key)) {
      keyMap.set(entry.key, new Map());
    }
    const row = keyMap.get(entry.key)!;
    if (entry.baseValue !== undefined) {
      row.set(envLabels[0] ?? 'base', String(entry.baseValue));
    }
    if (entry.compareValue !== undefined) {
      row.set(envLabels[1] ?? 'compare', String(entry.compareValue));
    }
  }

  const rows: PivotRow[] = [];
  for (const [key, envMap] of keyMap.entries()) {
    const row: PivotRow = { key };
    for (const env of envLabels) {
      row[env] = envMap.get(env) ?? '-';
    }
    rows.push(row);
  }

  rows.sort((a, b) => a.key.localeCompare(b.key));

  return { envs: envLabels, rows };
}

/**
 * Format a pivot table as a plain-text aligned table.
 */
export function formatPivotTable(table: PivotTable): string {
  const headers = ['KEY', ...table.envs];
  const allRows = table.rows.map(r => [r.key, ...table.envs.map(e => r[e] ?? '-')]);

  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...allRows.map(r => (r[i] ?? '').length))
  );

  const pad = (s: string, w: number) => s.padEnd(w);
  const divider = colWidths.map(w => '-'.repeat(w)).join('-+-');

  const lines: string[] = [];
  lines.push(headers.map((h, i) => pad(h, colWidths[i])).join(' | '));
  lines.push(divider);
  for (const row of allRows) {
    lines.push(row.map((cell, i) => pad(cell ?? '-', colWidths[i])).join(' | '));
  }

  return lines.join('\n');
}
