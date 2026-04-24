import { diff, Diff } from 'deep-diff';
import { ConfigRecord } from './parser';

export type DriftKind = 'added' | 'removed' | 'changed' | 'array-changed';

export interface DriftEntry {
  kind: DriftKind;
  path: string;
  baseValue?: unknown;
  targetValue?: unknown;
}

function kindFromDiff(d: Diff<unknown>): DriftKind {
  switch (d.kind) {
    case 'N': return 'added';
    case 'D': return 'removed';
    case 'E': return 'changed';
    case 'A': return 'array-changed';
    default: return 'changed';
  }
}

export function computeDrift(
  base: ConfigRecord,
  target: ConfigRecord
): DriftEntry[] {
  const diffs = diff(base, target);
  if (!diffs || diffs.length === 0) return [];

  return diffs.map((d): DriftEntry => {
    const keyPath = (d.path ?? []).join('.');
    const kind = kindFromDiff(d);

    if (d.kind === 'E') {
      return { kind, path: keyPath, baseValue: d.lhs, targetValue: d.rhs };
    }
    if (d.kind === 'N') {
      return { kind, path: keyPath, targetValue: d.rhs };
    }
    if (d.kind === 'D') {
      return { kind, path: keyPath, baseValue: d.lhs };
    }
    if (d.kind === 'A') {
      return {
        kind,
        path: `${keyPath}[${d.index}]`,
        baseValue: d.item.kind === 'D' ? (d.item as Diff<unknown> & { lhs: unknown }).lhs : undefined,
        targetValue: d.item.kind === 'N' ? (d.item as Diff<unknown> & { rhs: unknown }).rhs : undefined,
      };
    }
    return { kind, path: keyPath };
  });
}

export function hasDrift(entries: DriftEntry[]): boolean {
  return entries.length > 0;
}
