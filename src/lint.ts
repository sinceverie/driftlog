import { DriftEntry } from './differ';

export type LintRule = 'no-empty-values' | 'no-numeric-strings' | 'no-duplicate-keys' | 'require-uppercase-keys';

export interface LintViolation {
  key: string;
  rule: LintRule;
  message: string;
  value?: string;
}

export function lintConfig(
  config: Record<string, string>,
  rules: LintRule[] = ['no-empty-values', 'no-numeric-strings', 'require-uppercase-keys']
): LintViolation[] {
  const violations: LintViolation[] = [];
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(config)) {
    if (rules.includes('no-empty-values') && value.trim() === '') {
      violations.push({ key, rule: 'no-empty-values', message: `Key "${key}" has an empty value.`, value });
    }

    if (rules.includes('no-numeric-strings') && /^\d+(\.\d+)?$/.test(value)) {
      violations.push({ key, rule: 'no-numeric-strings', message: `Key "${key}" has a numeric string value "${value}".`, value });
    }

    if (rules.includes('require-uppercase-keys') && key !== key.toUpperCase()) {
      violations.push({ key, rule: 'require-uppercase-keys', message: `Key "${key}" should be uppercase.` });
    }

    if (rules.includes('no-duplicate-keys')) {
      if (seen.has(key)) {
        violations.push({ key, rule: 'no-duplicate-keys', message: `Key "${key}" appears more than once.` });
      }
      seen.add(key);
    }
  }

  return violations;
}

export function lintDriftKeys(
  entries: DriftEntry[],
  rules: LintRule[] = ['no-empty-values', 'require-uppercase-keys']
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const entry of entries) {
    const values = [entry.baseValue, entry.compareValue].filter((v): v is string => v !== undefined);
    for (const value of values) {
      if (rules.includes('no-empty-values') && value.trim() === '') {
        violations.push({ key: entry.key, rule: 'no-empty-values', message: `Drifted key "${entry.key}" has an empty value.`, value });
        break;
      }
    }
    if (rules.includes('require-uppercase-keys') && entry.key !== entry.key.toUpperCase()) {
      violations.push({ key: entry.key, rule: 'require-uppercase-keys', message: `Drifted key "${entry.key}" should be uppercase.` });
    }
  }

  return violations;
}

export function formatLintReport(violations: LintViolation[]): string {
  if (violations.length === 0) return 'No lint violations found.\n';
  const lines = [`Lint violations (${violations.length}):`];
  for (const v of violations) {
    lines.push(`  [${v.rule}] ${v.message}`);
  }
  return lines.join('\n') + '\n';
}

export function parseLintRules(args: string[]): LintRule[] {
  const flag = args.find(a => a.startsWith('--lint-rules='));
  if (!flag) return ['no-empty-values', 'no-numeric-strings', 'require-uppercase-keys'];
  return flag.replace('--lint-rules=', '').split(',') as LintRule[];
}
