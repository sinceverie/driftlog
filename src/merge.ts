import { DriftEntry } from './differ';

export interface MergeResult {
  key: string;
  resolvedValue: string;
  source: string;
  conflict: boolean;
  candidates: { label: string; value: string }[];
}

/**
 * Merges multiple config records into a single resolved map.
 * In case of conflict, the value from the preferred source wins.
 * If no preference is given, the first source wins.
 */
export function mergeConfigs(
  configs: { label: string; data: Record<string, string> }[],
  prefer?: string
): MergeResult[] {
  const allKeys = new Set<string>();
  for (const c of configs) {
    Object.keys(c.data).forEach(k => allKeys.add(k));
  }

  const results: MergeResult[] = [];

  for (const key of allKeys) {
    const candidates = configs
      .filter(c => key in c.data)
      .map(c => ({ label: c.label, value: c.data[key] }));

    const uniqueValues = new Set(candidates.map(c => c.value));
    const conflict = uniqueValues.size > 1;

    let resolved = candidates[0];
    if (prefer) {
      const preferred = candidates.find(c => c.label === prefer);
      if (preferred) resolved = preferred;
    }

    results.push({
      key,
      resolvedValue: resolved.value,
      source: resolved.label,
      conflict,
      candidates,
    });
  }

  return results.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Formats a merge result set as a human-readable text summary.
 */
export function formatMergeReport(results: MergeResult[]): string {
  const lines: string[] = ['=== Merge Report ===', ''];
  const conflicts = results.filter(r => r.conflict);
  const clean = results.filter(r => !r.conflict);

  lines.push(`Total keys: ${results.length}`);
  lines.push(`Conflicts:  ${conflicts.length}`);
  lines.push(`Clean:      ${clean.length}`);
  lines.push('');

  if (conflicts.length > 0) {
    lines.push('--- Conflicts ---');
    for (const r of conflicts) {
      lines.push(`  ${r.key}  [resolved from: ${r.source}]`);
      for (const c of r.candidates) {
        const marker = c.label === r.source ? '*' : ' ';
        lines.push(`    ${marker} ${c.label}: ${c.value}`);
      }
    }
    lines.push('');
  }

  lines.push('--- Resolved Values ---');
  for (const r of results) {
    lines.push(`  ${r.key}=${r.resolvedValue}  (${r.source})`);
  }

  return lines.join('\n');
}
