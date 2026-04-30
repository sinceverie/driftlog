import * as fs from 'fs';
import * as path from 'path';
import { DriftEntry } from './differ';

export interface TimelineEntry {
  timestamp: string;
  label: string;
  keys: string[];
  added: number;
  removed: number;
  changed: number;
}

export interface TimelineOptions {
  since?: string;
  until?: string;
  label?: string;
}

export function getTimelineDir(base = process.cwd()): string {
  return path.join(base, '.driftlog', 'timeline');
}

export function getTimelinePath(label: string, base = process.cwd()): string {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getTimelineDir(base), `${safe}.jsonl`);
}

export function appendTimelineEntry(
  label: string,
  entries: DriftEntry[],
  base = process.cwd()
): void {
  const dir = getTimelineDir(base);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const record: TimelineEntry = {
    timestamp: new Date().toISOString(),
    label,
    keys: entries.map((e) => e.key),
    added: entries.filter((e) => e.kind === 'added').length,
    removed: entries.filter((e) => e.kind === 'removed').length,
    changed: entries.filter((e) => e.kind === 'changed').length,
  };
  fs.appendFileSync(getTimelinePath(label, base), JSON.stringify(record) + '\n', 'utf8');
}

export function loadTimeline(label: string, base = process.cwd()): TimelineEntry[] {
  const file = getTimelinePath(label, base);
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as TimelineEntry);
}

export function filterTimeline(entries: TimelineEntry[], opts: TimelineOptions): TimelineEntry[] {
  return entries.filter((e) => {
    if (opts.since && e.timestamp < opts.since) return false;
    if (opts.until && e.timestamp > opts.until) return false;
    if (opts.label && e.label !== opts.label) return false;
    return true;
  });
}

export function formatTimelineReport(entries: TimelineEntry[]): string {
  if (entries.length === 0) return 'No timeline entries found.\n';
  const lines: string[] = ['Timeline:', ''];
  for (const e of entries) {
    lines.push(`  [${e.timestamp}] ${e.label}`);
    lines.push(`    +${e.added} added  -${e.removed} removed  ~${e.changed} changed`);
    if (e.keys.length > 0) lines.push(`    keys: ${e.keys.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}
