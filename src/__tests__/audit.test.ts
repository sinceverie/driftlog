import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  appendAuditEntry,
  loadAuditLog,
  clearAuditLog,
  buildAuditEntry,
  getAuditPath,
} from '../audit';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-audit-'));
}

describe('audit', () => {
  let originalHome: string | undefined;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    originalHome = process.env.HOME;
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('buildAuditEntry creates a valid entry', () => {
    const entry = buildAuditEntry('diff', ['a.env', 'b.env'], true, 3);
    expect(entry.command).toBe('diff');
    expect(entry.files).toEqual(['a.env', 'b.env']);
    expect(entry.driftDetected).toBe(true);
    expect(entry.keysChanged).toBe(3);
    expect(entry.timestamp).toBeTruthy();
  });

  test('appendAuditEntry and loadAuditLog round-trip', () => {
    const entry = buildAuditEntry('diff', ['x.env'], false, 0);
    appendAuditEntry(entry);
    const log = loadAuditLog();
    expect(log).toHaveLength(1);
    expect(log[0].command).toBe('diff');
    expect(log[0].driftDetected).toBe(false);
  });

  test('loadAuditLog returns empty array when no file', () => {
    const log = loadAuditLog();
    expect(log).toEqual([]);
  });

  test('clearAuditLog empties the log', () => {
    appendAuditEntry(buildAuditEntry('diff', ['a.env'], true, 2));
    clearAuditLog();
    const log = loadAuditLog();
    expect(log).toEqual([]);
  });

  test('multiple entries are preserved in order', () => {
    appendAuditEntry(buildAuditEntry('diff', ['a.env'], true, 1));
    appendAuditEntry(buildAuditEntry('diff', ['b.env'], false, 0));
    const log = loadAuditLog();
    expect(log).toHaveLength(2);
    expect(log[0].files).toEqual(['a.env']);
    expect(log[1].files).toEqual(['b.env']);
  });
});
