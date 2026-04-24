export type DriftKind = 'added' | 'removed' | 'changed';

export interface DriftResult {
  key: string;
  kind: DriftKind;
  baseValue?: string;
  targetValue?: string;
}

export function kindFromDiff(baseHas: boolean, targetHas: boolean): DriftKind {
  if (!baseHas && targetHas) return 'added';
  if (baseHas && !targetHas) return 'removed';
  return 'changed';
}

export function computeDrift(
  base: Record<string, string>,
  target: Record<string, string>
): DriftResult[] {
  const results: DriftResult[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(target)]);

  for (const key of allKeys) {
    const inBase = key in base;
    const inTarget = key in target;

    if (inBase && inTarget) {
      if (base[key] !== target[key]) {
        results.push({ key, kind: 'changed', baseValue: base[key], targetValue: target[key] });
      }
    } else if (!inBase && inTarget) {
      results.push({ key, kind: 'added', targetValue: target[key] });
    } else {
      results.push({ key, kind: 'removed', baseValue: base[key] });
    }
  }

  return results.sort((a, b) => a.key.localeCompare(b.key));
}

export function hasDrift(drifts: DriftResult[]): boolean {
  return drifts.length > 0;
}
