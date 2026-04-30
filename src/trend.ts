import { DriftEntry } from './differ';
import { loadHistory, HistoryEntry } from './history';

export interface TrendPoint {
  timestamp: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export interface TrendReport {
  label: string;
  points: TrendPoint[];
  direction: 'improving' | 'worsening' | 'stable';
  delta: number;
}

export function buildTrendPoint(entry: HistoryEntry): TrendPoint {
  const counts = { added: 0, removed: 0, changed: 0 };
  for (const d of entry.drift) {
    if (d.kind === 'added') counts.added++;
    else if (d.kind === 'removed') counts.removed++;
    else if (d.kind === 'changed') counts.changed++;
  }
  return {
    timestamp: entry.timestamp,
    added: counts.added,
    removed: counts.removed,
    changed: counts.changed,
    total: entry.drift.length,
  };
}

export function analyzeTrend(points: TrendPoint[]): { direction: 'improving' | 'worsening' | 'stable'; delta: number } {
  if (points.length < 2) return { direction: 'stable', delta: 0 };
  const first = points[0].total;
  const last = points[points.length - 1].total;
  const delta = last - first;
  if (delta < 0) return { direction: 'improving', delta };
  if (delta > 0) return { direction: 'worsening', delta };
  return { direction: 'stable', delta: 0 };
}

export function buildTrendReport(label: string, historyDir?: string): TrendReport {
  const entries = loadHistory(label, historyDir);
  const points = entries.map(buildTrendPoint);
  const { direction, delta } = analyzeTrend(points);
  return { label, points, direction, delta };
}

export function formatTrendReport(report: TrendReport): string {
  const lines: string[] = [];
  lines.push(`Trend Report: ${report.label}`);
  lines.push(`Direction : ${report.direction} (delta: ${report.delta > 0 ? '+' : ''}${report.delta})`);
  lines.push(`Snapshots : ${report.points.length}`);
  lines.push('');
  lines.push('Timestamp                 | Added | Removed | Changed | Total');
  lines.push('--------------------------|-------|---------|---------|------');
  for (const p of report.points) {
    const ts = p.timestamp.padEnd(25);
    lines.push(`${ts} | ${String(p.added).padStart(5)} | ${String(p.removed).padStart(7)} | ${String(p.changed).padStart(7)} | ${String(p.total).padStart(5)}`);
  }
  return lines.join('\n');
}
