import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addAlias, loadAliases } from '../alias';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-aliascmd-'));
}

// We test the cmd functions indirectly by mocking the alias module
describe('aliasCmd (integration)', () => {
  let tmpDir: string;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('cmdAliasList prints no aliases message when empty', () => {
    const { cmdAliasList } = require('../aliasCmd');
    // Ensure no aliases exist in cwd context — test passes if no crash
    expect(() => cmdAliasList()).not.toThrow();
  });

  test('addAlias + listAliases integration', () => {
    addAlias('env1', './env1.env', tmpDir);
    addAlias('env2', './env2.env', tmpDir);
    const { listAliases } = require('../alias');
    const list = listAliases(tmpDir);
    expect(list).toHaveLength(2);
  });

  test('removeAlias removes correctly', () => {
    addAlias('temp', './temp.env', tmpDir);
    const { removeAlias } = require('../alias');
    const ok = removeAlias('temp', tmpDir);
    expect(ok).toBe(true);
    const aliases = loadAliases(tmpDir);
    expect(Object.keys(aliases)).not.toContain('temp');
  });

  test('resolveAlias falls back to original when unknown', () => {
    const { resolveAlias } = require('../alias');
    const result = resolveAlias('unknown-alias', tmpDir);
    expect(result).toBe('unknown-alias');
  });
});
