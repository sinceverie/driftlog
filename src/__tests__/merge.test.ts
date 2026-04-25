import { mergeConfigs, formatMergeReport } from '../merge';

const base = {
  label: 'base',
  data: { HOST: 'localhost', PORT: '3000', DEBUG: 'false' },
};

const prod = {
  label: 'prod',
  data: { HOST: 'prod.example.com', PORT: '443', DEBUG: 'false' },
};

const staging = {
  label: 'staging',
  data: { HOST: 'staging.example.com', PORT: '3000', STAGING_ONLY: 'yes' },
};

describe('mergeConfigs', () => {
  it('returns all unique keys across configs', () => {
    const result = mergeConfigs([base, staging]);
    const keys = result.map(r => r.key);
    expect(keys).toContain('HOST');
    expect(keys).toContain('PORT');
    expect(keys).toContain('DEBUG');
    expect(keys).toContain('STAGING_ONLY');
  });

  it('detects conflicts when values differ', () => {
    const result = mergeConfigs([base, prod]);
    const host = result.find(r => r.key === 'HOST')!;
    expect(host.conflict).toBe(true);
    const debug = result.find(r => r.key === 'DEBUG')!;
    expect(debug.conflict).toBe(false);
  });

  it('resolves to first source by default', () => {
    const result = mergeConfigs([base, prod]);
    const host = result.find(r => r.key === 'HOST')!;
    expect(host.resolvedValue).toBe('localhost');
    expect(host.source).toBe('base');
  });

  it('resolves to preferred source when specified', () => {
    const result = mergeConfigs([base, prod], 'prod');
    const host = result.find(r => r.key === 'HOST')!;
    expect(host.resolvedValue).toBe('prod.example.com');
    expect(host.source).toBe('prod');
  });

  it('falls back to first source if preferred is not present for that key', () => {
    const result = mergeConfigs([base, staging], 'staging');
    const debug = result.find(r => r.key === 'DEBUG')!;
    // DEBUG only in base, staging not present
    expect(debug.source).toBe('base');
  });

  it('returns results sorted by key', () => {
    const result = mergeConfigs([base, staging]);
    const keys = result.map(r => r.key);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('formatMergeReport', () => {
  it('includes summary counts', () => {
    const result = mergeConfigs([base, prod]);
    const report = formatMergeReport(result);
    expect(report).toContain('Total keys:');
    expect(report).toContain('Conflicts:');
    expect(report).toContain('Clean:');
  });

  it('lists conflicting keys with candidates', () => {
    const result = mergeConfigs([base, prod]);
    const report = formatMergeReport(result);
    expect(report).toContain('HOST');
    expect(report).toContain('localhost');
    expect(report).toContain('prod.example.com');
  });

  it('marks resolved source with asterisk', () => {
    const result = mergeConfigs([base, prod], 'prod');
    const report = formatMergeReport(result);
    const lines = report.split('\n');
    const prodLine = lines.find(l => l.includes('prod:') && l.includes('prod.example.com'));
    expect(prodLine).toBeDefined();
    expect(prodLine).toMatch(/\*/);
  });

  it('shows resolved values section', () => {
    const result = mergeConfigs([base]);
    const report = formatMergeReport(result);
    expect(report).toContain('Resolved Values');
    expect(report).toContain('HOST=localhost');
  });
});
