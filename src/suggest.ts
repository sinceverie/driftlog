import { DriftEntry } from './differ';

export interface Suggestion {
  key: string;
  kind: 'missing' | 'extra' | 'changed';
  message: string;
  fix?: string;
}

/**
 * Generate human-readable suggestions for each drift entry.
 */
export function suggestFixes(drift: DriftEntry[]): Suggestion[] {
  return drift.map((entry) => {
    const { key, kind, fromValue, toValue } = entry;

    switch (kind) {
      case 'missing':
        return {
          key,
          kind,
          message: `Key "${key}" is present in the source but missing in the target.`,
          fix: `Add "${key}=${String(fromValue)}" to the target config.`,
        };

      case 'extra':
        return {
          key,
          kind,
          message: `Key "${key}" exists in the target but not in the source.`,
          fix: `Remove "${key}" from the target config, or add it to the source if intentional.`,
        };

      case 'changed':
        return {
          key,
          kind,
          message: `Key "${key}" has different values: source="${String(fromValue)}", target="${String(toValue)}".`,
          fix: `Update "${key}" in the target to "${String(fromValue)}" to match the source.`,
        };

      default:
        return {
          key,
          kind: 'changed' as const,
          message: `Key "${key}" has an unknown drift type.`,
        };
    }
  });
}

/**
 * Format suggestions as a plain-text block.
 */
export function formatSuggestions(suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return 'No suggestions — configs are in sync.\n';
  }

  const lines: string[] = ['Suggestions:', ''];
  for (const s of suggestions) {
    lines.push(`  [${s.kind.toUpperCase()}] ${s.message}`);
    if (s.fix) {
      lines.push(`    → ${s.fix}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
