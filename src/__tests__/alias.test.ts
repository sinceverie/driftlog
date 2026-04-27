import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addAlias,
  removeAlias,
  listAliases,
  resolveAlias,
  loadAliases,
  saveAliases,
} from '../alias';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-alias-'));
}

describe('alias', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('loadAliases returns empty object when no file', () => {
    const result = loadAliases(tmpDir);
    expect(result).toEqual({});
  });

  test('saveAliases and loadAliases round-trip', () => {
    const aliases = { prod: '/etc/app/prod.env', staging: '/etc/app/staging.env' };
    saveAliases(aliases, tmpDir);
    const loaded = loadAliases(tmpDir);
    expect(loaded).toEqual(aliases);
  });

  test('addAlias stores a new alias', () => {
    addAlias('dev', './configs/dev.env', tmpDir);
    const aliases = loadAliases(tmpDir);
    expect(aliases['dev']).toBe('./configs/dev.env');
  });

  test('addAlias overwrites existing alias', () => {
    addAlias('dev', './old.env', tmpDir);
    addAlias('dev', './new.env', tmpDir);
    const aliases = loadAliases(tmpDir);
    expect(aliases['dev']).toBe('./new.env');
  });

  test('removeAlias deletes an existing alias and returns true', () => {
    addAlias('qa', './qa.env', tmpDir);
    const result = removeAlias('qa', tmpDir);
    expect(result).toBe(true);
    expect(loadAliases(tmpDir)['qa']).toBeUndefined();
  });

  test('removeAlias returns false when alias does not exist', () => {
    const result = removeAlias('nonexistent', tmpDir);
    expect(result).toBe(false);
  });

  test('resolveAlias returns mapped path when alias exists', () => {
    addAlias('prod', '/configs/prod.env', tmpDir);
    expect(resolveAlias('prod', tmpDir)).toBe('/configs/prod.env');
  });

  test('resolveAlias returns original string when no alias', () => {
    expect(resolveAlias('./some/path.env', tmpDir)).toBe('./some/path.env');
  });

  test('listAliases returns all aliases as array', () => {
    addAlias('a', '/path/a.env', tmpDir);
    addAlias('b', '/path/b.env', tmpDir);
    const list = listAliases(tmpDir);
    expect(list).toHaveLength(2);
    expect(list).toContainEqual({ name: 'a', target: '/path/a.env' });
    expect(list).toContainEqual({ name: 'b', target: '/path/b.env' });
  });
});
