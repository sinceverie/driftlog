import { summarizeDrift, formatSummaryReport, DriftSummary } from '../summarize';
import { DriftEntry } from '../differ';

function makeEntry(
  key: string,
  kind: 'added' | 'removed' | 'changed',
  env = 'staging'
): DriftEntry {
  return { key, kind, env, base: 'x', target: 'y' } as any;
}

describe('summarizeDrift', () => {
  it('returns zero counts for empty input', () => {
    const result = summarizeDrift([]);
    expect(result.total).toBe(0);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(0);
    expect(result.topKeys).toEqual([]);
    expect(result.mostDriftedEnv).toBeNull();
  });

  it('counts kinds correctly', () => {
    const entries: DriftEntry[] = [
      makeEntry('A', 'added'),
      makeEntry('B', 'removed'),
      makeEntry('C', 'changed'),
      makeEntry('D', 'changed'),
    ];
    const result = summarizeDrift(entries);
    expect(result.total).toBe(4);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.changed).toBe(2);
  });

  it('identifies top drifted keys', () => {
    const entries: DriftEntry[] = [
      makeEntry('DB_HOST', 'changed', 'prod'),
      makeEntry('DB_HOST', 'changed', 'staging'),
      makeEntry('API_KEY', 'added', 'prod'),
    ];
    const result = summarizeDrift(entries);
    expect(result.topKeys[0]).toBe('DB_HOST');
  });

  it('identifies most drifted env', () => {
    const entries: DriftEntry[] = [
      makeEntry('X', 'changed', 'prod'),
      makeEntry('Y', 'changed', 'prod'),
      makeEntry('Z', 'added', 'staging'),
    ];
    const result = summarizeDrift(entries);
    expect(result.mostDriftedEnv).toBe('prod');
    expect(result.envCounts['prod']).toBe(2);
    expect(result.envCounts['staging']).toBe(1);
  });
});

describe('formatSummaryReport', () => {
  it('renders a readable summary string', () => {
    const summary: DriftSummary = {
      total: 3,
      added: 1,
      removed: 1,
      changed: 1,
      topKeys: ['DB_HOST'],
      mostDriftedEnv: 'prod',
      envCounts: { prod: 2, staging: 1 },
    };
    const output = formatSummaryReport(summary);
    expect(output).toContain('Drift Summary');
    expect(output).toContain('Total entries : 3');
    expect(output).toContain('Added       : 1');
    expect(output).toContain('Top drifted keys: DB_HOST');
    expect(output).toContain('Most drifted env: prod');
    expect(output).toContain('prod: 2');
  });
});
