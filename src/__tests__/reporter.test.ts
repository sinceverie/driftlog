import { generateReport, formatTextReport, formatJsonReport } from '../reporter';
import { DriftResult } from '../differ';

const sampleDrifts: DriftResult[] = [
  { key: 'API_URL', kind: 'changed', baseValue: 'http://dev.api', targetValue: 'http://prod.api' },
  { key: 'NEW_FLAG', kind: 'added', targetValue: 'true' },
  { key: 'OLD_SECRET', kind: 'removed', baseValue: 'abc123' },
];

describe('formatTextReport', () => {
  it('reports no drift when empty', () => {
    const out = formatTextReport([], 'dev', 'prod');
    expect(out).toContain('No drift detected');
    expect(out).toContain('dev');
    expect(out).toContain('prod');
  });

  it('lists all drift entries', () => {
    const out = formatTextReport(sampleDrifts, 'dev', 'prod');
    expect(out).toContain('CHANGED');
    expect(out).toContain('ADDED');
    expect(out).toContain('REMOVED');
    expect(out).toContain('API_URL');
    expect(out).toContain('NEW_FLAG');
    expect(out).toContain('OLD_SECRET');
  });

  it('includes values in verbose mode', () => {
    const out = formatTextReport(sampleDrifts, 'dev', 'prod', true);
    expect(out).toContain('http://dev.api');
    expect(out).toContain('http://prod.api');
    expect(out).toContain('true');
    expect(out).toContain('abc123');
  });

  it('shows correct count in header', () => {
    const out = formatTextReport(sampleDrifts, 'dev', 'prod');
    expect(out).toContain('3 changes');
  });
});

describe('formatJsonReport', () => {
  it('returns valid JSON', () => {
    const out = formatJsonReport(sampleDrifts, 'dev', 'prod');
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it('includes metadata fields', () => {
    const parsed = JSON.parse(formatJsonReport(sampleDrifts, 'dev', 'prod'));
    expect(parsed.base).toBe('dev');
    expect(parsed.target).toBe('prod');
    expect(parsed.driftCount).toBe(3);
    expect(parsed.hasDrift).toBe(true);
    expect(Array.isArray(parsed.drifts)).toBe(true);
  });

  it('hasDrift is false when no drifts', () => {
    const parsed = JSON.parse(formatJsonReport([], 'dev', 'prod'));
    expect(parsed.hasDrift).toBe(false);
    expect(parsed.driftCount).toBe(0);
  });
});

describe('generateReport', () => {
  it('delegates to text format by default', () => {
    const out = generateReport(sampleDrifts, 'dev', 'prod', { format: 'text' });
    expect(out).toContain('CHANGED');
  });

  it('delegates to json format', () => {
    const out = generateReport(sampleDrifts, 'dev', 'prod', { format: 'json' });
    const parsed = JSON.parse(out);
    expect(parsed.driftCount).toBe(3);
  });
});
