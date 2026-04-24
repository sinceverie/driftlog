import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { appendAuditEntry, buildAuditEntry, clearAuditLog } from '../audit';
import { cmdAuditList, cmdAuditClear, cmdAuditJson, cmdAuditStats } from '../auditCmd';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-auditcmd-'));
}

describe('auditCmd', () => {
  let originalHome: string | undefined;
  let tmpDir: string;
  let output: string[];

  beforeEach(() => {
    tmpDir = makeTmpDir();
    originalHome = process.env.HOME;
    process.env.HOME = tmpDir;
    output = [];
    jest.spyOn(console, 'log').mockImplementation((msg: string) => output.push(msg));
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('cmdAuditList prints message when empty', () => {
    cmdAuditList([]);
    expect(output[0]).toMatch(/No audit entries/);
  });

  test('cmdAuditList shows entries', () => {
    appendAuditEntry(buildAuditEntry('diff', ['a.env', 'b.env'], true, 4));
    cmdAuditList([]);
    expect(output[0]).toMatch(/diff/);
    expect(output[0]).toMatch(/DRIFT/);
  });

  test('cmdAuditList --last limits output', () => {
    for (let i = 0; i < 5; i++) {
      appendAuditEntry(buildAuditEntry('diff', [`${i}.env`], false, 0));
    }
    cmdAuditList(['--last', '2']);
    expect(output).toHaveLength(2);
  });

  test('cmdAuditClear clears the log', () => {
    appendAuditEntry(buildAuditEntry('diff', ['a.env'], true, 1));
    cmdAuditClear();
    expect(output[0]).toMatch(/cleared/);
  });

  test('cmdAuditJson outputs valid JSON array', () => {
    appendAuditEntry(buildAuditEntry('diff', ['a.env'], false, 0));
    cmdAuditJson();
    const parsed = JSON.parse(output[0]);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].command).toBe('diff');
  });

  test('cmdAuditStats prints summary', () => {
    appendAuditEntry(buildAuditEntry('diff', ['a.env'], true, 3));
    appendAuditEntry(buildAuditEntry('diff', ['b.env'], false, 0));
    cmdAuditStats();
    expect(output.join('\n')).toMatch(/Total runs : 2/);
    expect(output.join('\n')).toMatch(/Drift runs : 1/);
    expect(output.join('\n')).toMatch(/Keys changed \(total\): 3/);
  });
});
