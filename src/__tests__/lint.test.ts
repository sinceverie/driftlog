import { lintConfig, lintDriftKeys, formatLintReport, parseLintRules, LintViolation } from '../lint';
import { DriftEntry } from '../differ';

describe('lintConfig', () => {
  it('detects empty values', () => {
    const violations = lintConfig({ KEY: '' }, ['no-empty-values']);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe('no-empty-values');
    expect(violations[0].key).toBe('KEY');
  });

  it('detects numeric string values', () => {
    const violations = lintConfig({ PORT: '8080' }, ['no-numeric-strings']);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe('no-numeric-strings');
  });

  it('detects lowercase keys', () => {
    const violations = lintConfig({ myKey: 'value' }, ['require-uppercase-keys']);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe('require-uppercase-keys');
  });

  it('passes clean config', () => {
    const violations = lintConfig({ MY_KEY: 'value', OTHER: 'data' });
    expect(violations).toHaveLength(0);
  });

  it('applies multiple rules', () => {
    const violations = lintConfig({ mykey: '' }, ['no-empty-values', 'require-uppercase-keys']);
    expect(violations).toHaveLength(2);
  });
});

describe('lintDriftKeys', () => {
  const entries: DriftEntry[] = [
    { key: 'db_host', kind: 'changed', baseValue: 'localhost', compareValue: '' },
    { key: 'API_KEY', kind: 'added', compareValue: 'abc123' },
  ];

  it('detects empty values in drift entries', () => {
    const violations = lintDriftKeys(entries, ['no-empty-values']);
    expect(violations.some(v => v.key === 'db_host' && v.rule === 'no-empty-values')).toBe(true);
  });

  it('detects non-uppercase keys in drift entries', () => {
    const violations = lintDriftKeys(entries, ['require-uppercase-keys']);
    expect(violations.some(v => v.key === 'db_host')).toBe(true);
    expect(violations.some(v => v.key === 'API_KEY')).toBe(false);
  });
});

describe('formatLintReport', () => {
  it('returns clean message when no violations', () => {
    expect(formatLintReport([])).toContain('No lint violations');
  });

  it('formats violations correctly', () => {
    const violations: LintViolation[] = [
      { key: 'foo', rule: 'no-empty-values', message: 'Key "foo" has an empty value.', value: '' },
    ];
    const report = formatLintReport(violations);
    expect(report).toContain('no-empty-values');
    expect(report).toContain('foo');
    expect(report).toContain('Lint violations (1)');
  });
});

describe('parseLintRules', () => {
  it('returns defaults when no flag provided', () => {
    const rules = parseLintRules(['file.env']);
    expect(rules).toContain('no-empty-values');
  });

  it('parses rules from flag', () => {
    const rules = parseLintRules(['--lint-rules=no-empty-values,no-duplicate-keys']);
    expect(rules).toEqual(['no-empty-values', 'no-duplicate-keys']);
  });
});
