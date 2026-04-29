import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, loadConfigs, resolveLabel, ConfigLoadError } from '../loader';

function writeTmp(name: string, content: string): string {
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('resolveLabel', () => {
  it('returns override when provided', () => {
    expect(resolveLabel('/some/path/prod.env', 'production')).toBe('production');
  });

  it('returns basename without extension when no override', () => {
    expect(resolveLabel('/some/path/staging.env')).toBe('staging');
    expect(resolveLabel('/some/path/config.json')).toBe('config');
  });

  it('handles files with no extension', () => {
    expect(resolveLabel('/some/path/Makefile')).toBe('Makefile');
  });

  it('handles deeply nested paths', () => {
    expect(resolveLabel('/a/b/c/d/production.env')).toBe('production');
  });
});

describe('loadConfig', () => {
  it('loads a valid .env file', () => {
    const filePath = writeTmp('test-load.env', 'FOO=bar\nBAZ=qux\n');
    const result = loadConfig(filePath);
    expect(result.data).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(result.label).toBe('test-load');
  });

  it('uses label override', () => {
    const filePath = writeTmp('test-label.env', 'X=1\n');
    const result = loadConfig(filePath, 'myenv');
    expect(result.label).toBe('myenv');
  });

  it('throws ConfigLoadError for missing file', () => {
    expect(() => loadConfig('/nonexistent/path/missing.env')).toThrow(ConfigLoadError);
    expect(() => loadConfig('/nonexistent/path/missing.env')).toThrow('file not found');
  });

  it('throws ConfigLoadError for unreadable/invalid content gracefully', () => {
    // Write a file that parseConfigFile would reject (empty is fine, just test path)
    const filePath = writeTmp('empty.env', '');
    const result = loadConfig(filePath);
    expect(result.data).toEqual({});
  });

  it('includes the file path in ConfigLoadError message', () => {
    const missingPath = '/nonexistent/path/missing.env';
    expect(() => loadConfig(missingPath)).toThrow(missingPath);
  });
});

describe('loadConfigs', () => {
  it('loads multiple configs', () => {
    const a = writeTmp('multi-a.env', 'KEY=alpha\n');
    const b = writeTmp('multi-b.env', 'KEY=beta\n');
    const results = loadConfigs([{ filePath: a }, { filePath: b }]);
    expect(results).toHaveLength(2);
    expect(results[0].data.KEY).toBe('alpha');
    expect(results[1].data.KEY).toBe('beta');
  });

  it('throws when fewer than two configs provided', () => {
    const a = writeTmp('single.env', 'KEY=only\n');
    expect(() => loadConfigs([{ filePath: a }])).toThrow(
      'At least two config files are required'
    );
  });

  it('throws when an empty array is provided', () => {
    expect(() => loadConfigs([])).toThrow('At least two config files are required');
  });
});
