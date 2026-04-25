import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addEnvGroup,
  removeEnvGroup,
  loadEnvGroups,
  findGroup,
  listEnvGroups,
  saveEnvGroups,
} from '../env';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-env-'));
}

describe('env groups', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loadEnvGroups returns empty array when no file exists', () => {
    expect(loadEnvGroups(tmpDir)).toEqual([]);
  });

  test('addEnvGroup saves a new group', () => {
    addEnvGroup('staging', ['.env.staging', '.env.base'], tmpDir);
    const groups = loadEnvGroups(tmpDir);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('staging');
    expect(groups[0].files).toEqual(['.env.staging', '.env.base']);
  });

  test('addEnvGroup overwrites group with same name', () => {
    addEnvGroup('prod', ['a.env'], tmpDir);
    addEnvGroup('prod', ['b.env', 'c.env'], tmpDir);
    const groups = loadEnvGroups(tmpDir);
    expect(groups).toHaveLength(1);
    expect(groups[0].files).toEqual(['b.env', 'c.env']);
  });

  test('findGroup returns matching group', () => {
    addEnvGroup('dev', ['.env.dev'], tmpDir);
    const g = findGroup('dev', tmpDir);
    expect(g).toBeDefined();
    expect(g!.name).toBe('dev');
  });

  test('findGroup returns undefined for unknown group', () => {
    expect(findGroup('unknown', tmpDir)).toBeUndefined();
  });

  test('removeEnvGroup removes existing group and returns true', () => {
    addEnvGroup('test', ['.env.test'], tmpDir);
    const result = removeEnvGroup('test', tmpDir);
    expect(result).toBe(true);
    expect(loadEnvGroups(tmpDir)).toHaveLength(0);
  });

  test('removeEnvGroup returns false for non-existent group', () => {
    const result = removeEnvGroup('ghost', tmpDir);
    expect(result).toBe(false);
  });

  test('listEnvGroups returns group names', () => {
    addEnvGroup('alpha', ['a.env'], tmpDir);
    addEnvGroup('beta', ['b.env'], tmpDir);
    expect(listEnvGroups(tmpDir)).toEqual(['alpha', 'beta']);
  });
});
