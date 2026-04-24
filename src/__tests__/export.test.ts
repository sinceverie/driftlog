import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportReport, renderExport, resolveExportFormat } from '../export';
import { DriftResult } from '../differ';

const sampleDrift: DriftResult[] = [
  { key: 'DB_HOST', kind: 'changed', baseValue: 'localhost', compareValue: 'prod-db' },
  { key: 'NEW_KEY', kind: 'added', baseValue: undefined, compareValue: 'value1' },
  { key: 'OLD_KEY', kind: 'removed', baseValue: 'old', compareValue: undefined },
];

const labels: [string, string] = ['dev', 'prod'];

describe('resolveExportFormat', () => {
  it('returns json for .json extension', () => {
    expect(resolveExportFormat('report.json')).toBe('json');
  });

  it('returns markdown for .md extension', () => {
    expect(resolveExportFormat('report.md')).toBe('markdown');
  });

  it('returns text for .txt extension', () => {
    expect(resolveExportFormat('report.txt')).toBe('text');
  });

  it('defaults to text for unknown extension', () => {
    expect(resolveExportFormat('report.log')).toBe('text');
  });
});

describe('renderExport', () => {
  it('renders json format', () => {
    const out = renderExport(sampleDrift, 'json', labels);
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty('drift');
    expect(Array.isArray(parsed.drift)).toBe(true);
  });

  it('renders markdown format', () => {
    const out = renderExport(sampleDrift, 'markdown', labels);
    expect(out).toContain('#');
    expect(out).toContain('DB_HOST');
  });

  it('renders text format', () => {
    const out = renderExport(sampleDrift, 'text', labels);
    expect(out).toContain('DB_HOST');
  });
});

describe('exportReport', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a json file to disk', () => {
    const outPath = path.join(tmpDir, 'report.json');
    exportReport(sampleDrift, labels, { outputPath: outPath, format: 'json' });
    expect(fs.existsSync(outPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(content).toHaveProperty('drift');
  });

  it('creates nested directories if needed', () => {
    const outPath = path.join(tmpDir, 'nested', 'dir', 'report.md');
    exportReport(sampleDrift, labels, { outputPath: outPath, format: 'markdown' });
    expect(fs.existsSync(outPath)).toBe(true);
  });

  it('writes text report', () => {
    const outPath = path.join(tmpDir, 'report.txt');
    exportReport(sampleDrift, labels, { outputPath: outPath, format: 'text' });
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('DB_HOST');
  });
});
