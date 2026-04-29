import { DriftEntry } from './differ';

export interface CompareOptions {
  labels: [string, string];
  showEqual?: boolean;
  onlyKeys?: string[];
}

export interface CompareRow {
  key: string;
  left: string | undefined;
  right: string | undefined;
  status: 'added' | 'removed' | 'changed' | 'equal';
}

export function buildCompareTable(
  entries: DriftEntry[],
  leftConfig: Record<string, string>,
  rightConfig: Record<string, string>,
  opts: CompareOptions
): CompareRow[] {
  const keys = new Set<string>([
    ...Object.keys(leftConfig),
    ...Object.keys(rightConfig),
  ]);

  const driftKeys = new Set(entries.map((e) => e.key));

  const rows: CompareRow[] = [];

  for (const key of [...keys].sort()) {
    if (opts.onlyKeys && !opts.onlyKeys.includes(key)) continue;

    const left = leftConfig[key];
    const right = rightConfig[key];

    let status: CompareRow['status'];
    if (!driftKeys.has(key)) {
      status = 'equal';
    } else if (left === undefined) {
      status = 'added';
    } else if (right === undefined) {
      status = 'removed';
    } else {
      status = 'changed';
    }

    if (status === 'equal' && !opts.showEqual) continue;

    rows.push({ key, left, right, status });
  }

  return rows;
}

export function formatCompareTable(
  rows: CompareRow[],
  labels: [string, string]
): string {
  if (rows.length === 0) return 'No differences found.';

  const colKey = Math.max(3, ...rows.map((r) => r.key.length));
  const colLeft = Math.max(labels[0].length, ...rows.map((r) => (r.left ?? '(missing)').length));
  const colRight = Math.max(labels[1].length, ...rows.map((r) => (r.right ?? '(missing)').length));

  const pad = (s: string, n: number) => s.padEnd(n);
  const sep = `+-${'-'.repeat(colKey)}-+-${'-'.repeat(colLeft)}-+-${'-'.repeat(colRight)}-+`;

  const lines: string[] = [
    sep,
    `| ${pad('KEY', colKey)} | ${pad(labels[0], colLeft)} | ${pad(labels[1], colRight)} |`,
    sep,
  ];

  const symbol: Record<CompareRow['status'], string> = {
    added: '+',
    removed: '-',
    changed: '~',
    equal: ' ',
  };

  for (const row of rows) {
    const s = symbol[row.status];
    lines.push(
      `${s} ${pad(row.key, colKey)} | ${pad(row.left ?? '(missing)', colLeft)} | ${pad(row.right ?? '(missing)', colRight)} |`
    );
  }

  lines.push(sep);
  return lines.join('\n');
}
