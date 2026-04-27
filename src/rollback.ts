import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshot, listSnapshots, getSnapshotPath } from './snapshot';
import { loadBaseline, listBaselines, getBaselinePath } from './baseline';
import { DriftEntry } from './differ';

export type RollbackSource = 'snapshot' | 'baseline';

export interface RollbackTarget {
  source: RollbackSource;
  name: string;
  label: string;
  timestamp: string;
  keys: string[];
}

export function listRollbackTargets(source: RollbackSource, dir?: string): RollbackTarget[] {
  if (source === 'snapshot') {
    const snaps = listSnapshots(dir);
    return snaps.map((s) => ({
      source,
      name: s.name,
      label: s.label,
      timestamp: s.timestamp,
      keys: Object.keys(s.data),
    }));
  } else {
    const bases = listBaselines(dir);
    return bases.map((b) => ({
      source,
      name: b.name,
      label: b.label,
      timestamp: b.savedAt,
      keys: Object.keys(b.config),
    }));
  }
}

export function resolveRollbackData(
  source: RollbackSource,
  name: string,
  label: string,
  dir?: string
): Record<string, string> | null {
  if (source === 'snapshot') {
    const snap = loadSnapshot(name, label, dir);
    return snap ? snap.data : null;
  } else {
    const base = loadBaseline(name, dir);
    return base ? base.config : null;
  }
}

export function generateRollbackPatch(
  current: Record<string, string>,
  target: Record<string, string>
): DriftEntry[] {
  const entries: DriftEntry[] = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(target)]);
  for (const key of allKeys) {
    const cur = current[key];
    const tgt = target[key];
    if (cur === undefined) {
      entries.push({ key, kind: 'added', leftVal: undefined, rightVal: tgt });
    } else if (tgt === undefined) {
      entries.push({ key, kind: 'removed', leftVal: cur, rightVal: undefined });
    } else if (cur !== tgt) {
      entries.push({ key, kind: 'changed', leftVal: cur, rightVal: tgt });
    }
  }
  return entries;
}

export function formatRollbackReport(patch: DriftEntry[], targetName: string): string {
  if (patch.length === 0) return `No changes needed to roll back to "${targetName}".\n`;
  const lines: string[] = [`Rollback patch to "${targetName}" (${patch.length} change(s)):\n`];
  for (const e of patch) {
    if (e.kind === 'changed') lines.push(`  ~ ${e.key}: "${e.leftVal}" → "${e.rightVal}"`);
    else if (e.kind === 'added') lines.push(`  + ${e.key}: "${e.rightVal}"`);
    else lines.push(`  - ${e.key}`);
  }
  return lines.join('\n') + '\n';
}
