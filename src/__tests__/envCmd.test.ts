import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addEnvGroup, loadEnvGroups } from '../env';
import { cmdEnvGroupAdd, cmdEnvGroupList, cmdEnvGroupShow, cmdEnvGroupRemove } from '../envCmd';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-envcmd-'));
}

const spy = (fn: () => void) => {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...args: any[]) => logs.push(args.join(' '));
  fn();
  console.log = orig;
  return logs;
};

describe('envCmd', () => {
  let tmpDir: string;
  let origCwd: () => string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('cmdEnvGroupAdd saves group and prints confirmation', () => {
    const logs = spy(() => cmdEnvGroupAdd(['prod', 'a.env', 'b.env']));
    expect(logs[0]).toContain('prod');
    expect(logs[0]).toContain('2 file(s)');
    const groups = loadEnvGroups(tmpDir);
    expect(groups).toHaveLength(1);
  });

  test('cmdEnvGroupList prints all groups', () => {
    addEnvGroup('dev', ['dev.env'], tmpDir);
    addEnvGroup('staging', ['staging.env'], tmpDir);
    const logs = spy(() => cmdEnvGroupList([]));
    expect(logs.some(l => l.includes('dev'))).toBe(true);
    expect(logs.some(l => l.includes('staging'))).toBe(true);
  });

  test('cmdEnvGroupList prints message when empty', () => {
    const logs = spy(() => cmdEnvGroupList([]));
    expect(logs[0]).toContain('No env groups');
  });

  test('cmdEnvGroupShow prints group files', () => {
    addEnvGroup('qa', ['qa.env', 'base.env'], tmpDir);
    const logs = spy(() => cmdEnvGroupShow(['qa']));
    expect(logs.some(l => l.includes('qa.env'))).toBe(true);
    expect(logs.some(l => l.includes('base.env'))).toBe(true);
  });

  test('cmdEnvGroupRemove removes group and prints confirmation', () => {
    addEnvGroup('old', ['old.env'], tmpDir);
    const logs = spy(() => cmdEnvGroupRemove(['old']));
    expect(logs[0]).toContain('removed');
    expect(loadEnvGroups(tmpDir)).toHaveLength(0);
  });
});
