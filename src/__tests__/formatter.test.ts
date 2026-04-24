import { formatMarkdownReport, renderOutput } from '../formatter';
import { DriftReport } from '../differ';

const baseReport: DriftReport = {
  from: 'staging',
  to: 'production',
  hasDrift: false,
  entries: [],
};

const driftReport: DriftReport = {
  from: 'staging',
  to: 'production',
  hasDrift: true,
  entries: [
    { key: 'API_URL', kind: 'changed', fromValue: 'https://staging.api.com', toValue: 'https://api.com' },
    { key: 'DEBUG', kind: 'removed', fromValue: 'true', toValue: undefined },
    { key: 'NEW_RELIC_KEY', kind: 'added', fromValue: undefined, toValue: 'abc123' },
  ],
};

describe('formatMarkdownReport', () => {
  it('returns no-drift message when environments are in sync', () => {
    const output = formatMarkdownReport(baseReport);
    expect(output).toContain('No drift detected');
    expect(output).toContain('# Config Drift Report');
  });

  it('includes drift warning when drift exists', () => {
    const output = formatMarkdownReport(driftReport);
    expect(output).toContain('⚠️ Drift detected');
    expect(output).toContain('3');
  });

  it('renders added keys section', () => {
    const output = formatMarkdownReport(driftReport);
    expect(output).toContain('## ➕ Added Keys');
    expect(output).toContain('NEW_RELIC_KEY');
    expect(output).toContain('abc123');
  });

  it('renders removed keys section', () => {
    const output = formatMarkdownReport(driftReport);
    expect(output).toContain('## ➖ Removed Keys');
    expect(output).toContain('DEBUG');
    expect(output).toContain('true');
  });

  it('renders changed keys section', () => {
    const output = formatMarkdownReport(driftReport);
    expect(output).toContain('## 🔄 Changed Keys');
    expect(output).toContain('API_URL');
    expect(output).toContain('https://staging.api.com');
    expect(output).toContain('https://api.com');
  });

  it('includes environment names in headers', () => {
    const output = formatMarkdownReport(driftReport);
    expect(output).toContain('staging');
    expect(output).toContain('production');
  });
});

describe('renderOutput', () => {
  it('returns JSON string for json format', () => {
    const output = renderOutput(driftReport, 'json');
    const parsed = JSON.parse(output);
    expect(parsed.from).toBe('staging');
    expect(parsed.entries).toHaveLength(3);
  });

  it('returns markdown for markdown format', () => {
    const output = renderOutput(driftReport, 'markdown');
    expect(output).toContain('# Config Drift Report');
  });
});
