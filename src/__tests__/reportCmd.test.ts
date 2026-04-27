import { parseReportArgs, cmdReport } from '../reportCmd';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'reportcmd-test-'));
}

function writeTmp(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('parseReportArgs', () => {
  it('parses files and defaults', () => {
    const args = parseReportArgs(['a.env', 'b.env']);
    expect(args.files).toEqual(['a.env', 'b.env']);
    expect(args.format).toBe('text');
    expect(args.suggestions).toBe(false);
    expect(args.score).toBe(false);
  });

  it('parses format flag', () => {
    const args = parseReportArgs(['a.env', 'b.env', '--format', 'markdown']);
    expect(args.format).toBe('markdown');
  });

  it('parses output flag', () => {
    const args = parseReportArgs(['a.env', 'b.env', '--output', 'out.txt']);
    expect(args.output).toBe('out.txt');
  });

  it('parses --suggestions and --score flags', () => {
    const args = parseReportArgs(['a.env', 'b.env', '--suggestions', '--score']);
    expect(args.suggestions).toBe(true);
    expect(args.score).toBe(true);
  });

  it('parses --no-ignore flag', () => {
    const args = parseReportArgs(['a.env', 'b.env', '--no-ignore']);
    expect(args.ignore).toBe(false);
  });
});

describe('cmdReport', () => {
  let dir: string;
  let log: string[];
  let origLog: typeof console.log;

  beforeEach(() => {
    dir = makeTmpDir();
    log = [];
    origLog = console.log;
    console.log = (...args: unknown[]) => log.push(args.join(' '));
  });

  afterEach(() => {
    console.log = origLog;
  });

  it('prints text report to stdout', async () => {
    const a = writeTmp(dir, 'a.env', 'DB_HOST=localhost\nPORT=3000\n');
    const b = writeTmp(dir, 'b.env', 'DB_HOST=prod.db\nPORT=3000\nNEW=val\n');
    await cmdReport([a, b, '--no-ignore']);
    expect(log.join('\n')).toContain('DB_HOST');
  });

  it('writes report to file', async () => {
    const a = writeTmp(dir, 'a.env', 'X=1\n');
    const b = writeTmp(dir, 'b.env', 'X=2\n');
    const out = path.join(dir, 'report.txt');
    await cmdReport([a, b, '--no-ignore', '--output', out]);
    expect(fs.existsSync(out)).toBe(true);
    expect(fs.readFileSync(out, 'utf-8')).toContain('X');
  });

  it('includes score in output when --score passed', async () => {
    const a = writeTmp(dir, 'a.env', 'X=1\nY=2\n');
    const b = writeTmp(dir, 'b.env', 'X=9\nZ=3\n');
    await cmdReport([a, b, '--no-ignore', '--score']);
    expect(log.join('\n')).toMatch(/Drift Score/);
  });
});
