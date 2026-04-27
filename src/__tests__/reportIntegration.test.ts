import { buildFullReport } from '../report';
import { computeDrift } from '../differ';
import { parseConfigFile } from '../parser';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'report-int-'));
}

describe('report integration', () => {
  let dir: string;

  beforeEach(() => { dir = makeTmpDir(); });

  it('full pipeline: parse -> diff -> report (text)', () => {
    const aPath = path.join(dir, 'a.env');
    const bPath = path.join(dir, 'b.env');
    fs.writeFileSync(aPath, 'DB=localhost\nPORT=3000\nSECRET=abc\n');
    fs.writeFileSync(bPath, 'DB=prod.db\nPORT=3000\nNEW_KEY=xyz\n');

    const a = parseConfigFile(aPath);
    const b = parseConfigFile(bPath);
    const entries = computeDrift(a, b);

    const report = buildFullReport(entries, ['dev', 'prod'], {
      format: 'text',
      includeSuggestions: true,
      includeScore: true,
    });

    expect(report.body).toContain('DB');
    expect(report.score).toBeDefined();
    expect(report.score!.total).toBe(entries.length);
    expect(report.suggestions).toBeDefined();
    expect(report.generatedAt).toBeTruthy();
  });

  it('full pipeline: parse -> diff -> report (markdown)', () => {
    const aPath = path.join(dir, 'a.env');
    const bPath = path.join(dir, 'b.env');
    fs.writeFileSync(aPath, 'A=1\nB=2\n');
    fs.writeFileSync(bPath, 'A=1\nC=3\n');

    const a = parseConfigFile(aPath);
    const b = parseConfigFile(bPath);
    const entries = computeDrift(a, b);

    const report = buildFullReport(entries, ['staging', 'prod'], {
      format: 'markdown',
      includeSuggestions: false,
      includeScore: false,
    });

    expect(report.body).toMatch(/#+/);
    expect(report.format).toBe('markdown');
  });

  it('returns empty body for identical configs', () => {
    const aPath = path.join(dir, 'a.env');
    const bPath = path.join(dir, 'b.env');
    fs.writeFileSync(aPath, 'X=1\nY=2\n');
    fs.writeFileSync(bPath, 'X=1\nY=2\n');

    const a = parseConfigFile(aPath);
    const b = parseConfigFile(bPath);
    const entries = computeDrift(a, b);

    expect(entries).toHaveLength(0);

    const report = buildFullReport(entries, ['a', 'b'], {
      format: 'text',
      includeSuggestions: false,
      includeScore: true,
    });

    expect(report.score!.total).toBe(0);
    expect(report.score!.score).toBe(0);
  });
});
