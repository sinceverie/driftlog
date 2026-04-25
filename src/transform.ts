import { DriftEntry } from './differ';

export type TransformFn = (entry: DriftEntry) => DriftEntry | null;

export interface TransformRule {
  key: string | RegExp;
  fn: TransformFn;
}

/**
 * Redact sensitive values by replacing them with a placeholder.
 */
export function redactValue(entry: DriftEntry, placeholder = '***'): DriftEntry {
  return {
    ...entry,
    baseValue: entry.baseValue != null ? placeholder : undefined,
    compareValue: entry.compareValue != null ? placeholder : undefined,
  };
}

/**
 * Normalize values to lowercase strings for comparison.
 */
export function normalizeValue(entry: DriftEntry): DriftEntry {
  const norm = (v: unknown) =>
    typeof v === 'string' ? v.toLowerCase().trim() : v;
  return {
    ...entry,
    baseValue: norm(entry.baseValue),
    compareValue: norm(entry.compareValue),
  };
}

/**
 * Apply a list of transform rules to a set of drift entries.
 * Rules are matched by key (string exact match or RegExp).
 * If a transform returns null, the entry is excluded from output.
 */
export function applyTransforms(
  entries: DriftEntry[],
  rules: TransformRule[]
): DriftEntry[] {
  return entries.reduce<DriftEntry[]>((acc, entry) => {
    let current: DriftEntry | null = entry;
    for (const rule of rules) {
      if (current === null) break;
      const matches =
        typeof rule.key === 'string'
          ? rule.key === current.key
          : rule.key.test(current.key);
      if (matches) {
        current = rule.fn(current);
      }
    }
    if (current !== null) acc.push(current);
    return acc;
  }, []);
}

/**
 * Parse transform flags from CLI args.
 * Supports: --redact <pattern>, --normalize
 */
export function parseTransformArgs(args: string[]): TransformRule[] {
  const rules: TransformRule[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--redact' && args[i + 1]) {
      const pattern = args[++i];
      const key = pattern.startsWith('/') ? new RegExp(pattern.slice(1, -1)) : pattern;
      rules.push({ key, fn: (e) => redactValue(e) });
    } else if (args[i] === '--normalize') {
      rules.push({ key: /.*/, fn: normalizeValue });
    }
  }
  return rules;
}
