import { buildFullReport, writeFullReport, FullReport } from '../report';
import { DriftEntry } from '../differ';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'report-test-'));
}

const entries: DriftEntry[] = [
  { key: 'DB_HOST', kind: 'changed', valueA: 'localhost', valueB: 'prod.db' },
  { key: 'NEW_KEY', kind: 'added', valueA: undefined, valueB: 'value' },
  { key: 'OLD_KEY', kind: 'removed', valueA: 'old', valueB: undefined },
];

describe('buildFullReport', () => {
  it('builds a text report', () => {
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'text',
      includeSuggestions: false,
      includeScore: false,
    });
    expect(r.format).toBe('text');
    expect(r.body).toContain('DB_HOST');
    expect(r.score).toBeUndefined();
    expect(r.suggestions).toBeUndefined();
  });

  it('builds a markdown report', () => {
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'markdown',
      includeSuggestions: false,
      includeScore: false,
    });
    expect(r.body).toContain('#');
  });

  it('builds a json report', () => {
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'json',
      includeSuggestions: false,
      includeScore: false,
    });
    const parsed = JSON.parse(r.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
  });

  it('includes score when requested', () => {
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'text',
      includeSuggestions: false,
      includeScore: true,
    });
    expect(r.score).toBeDefined();
    expect(typeof r.score!.score).toBe('number');
  });

  it('includes suggestions when requested', () => {
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'text',
      includeSuggestions: true,
      includeScore: false,
    });
    expect(r.suggestions).toBeDefined();
  });
});

describe('writeFullReport', () => {
  it('writes text report to file', () => {
    const dir = makeTmpDir();
    const out = path.join(dir, 'sub', 'report.txt');
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'text',
      includeSuggestions: false,
      includeScore: true,
    });
    writeFullReport(r, out);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('DB_HOST');
    expect(content).toContain('Generated:');
  });

  it('writes json report to file', () => {
    const dir = makeTmpDir();
    const out = path.join(dir, 'report.json');
    const r = buildFullReport(entries, ['dev', 'prod'], {
      format: 'json',
      includeSuggestions: false,
      includeScore: false,
    });
    writeFullReport(r, out);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(parsed.format).toBe('json');
  });
});
