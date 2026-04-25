import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveTemplate,
  loadTemplate,
  listTemplates,
  deleteTemplate,
  validateAgainstTemplate,
  DriftTemplate,
} from '../template';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-template-'));
}

describe('template', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const sample: DriftTemplate = {
    name: 'base',
    description: 'Base template',
    keys: ['HOST', 'PORT', 'DB_URL'],
    requiredKeys: ['HOST', 'PORT', 'DB_URL'],
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  test('saveTemplate and loadTemplate round-trip', () => {
    saveTemplate(sample, dir);
    const loaded = loadTemplate('base', dir);
    expect(loaded).toEqual(sample);
  });

  test('loadTemplate returns null for missing template', () => {
    const result = loadTemplate('nonexistent', dir);
    expect(result).toBeNull();
  });

  test('listTemplates returns saved template names', () => {
    saveTemplate(sample, dir);
    saveTemplate({ ...sample, name: 'prod' }, dir);
    const names = listTemplates(dir);
    expect(names).toContain('base');
    expect(names).toContain('prod');
    expect(names).toHaveLength(2);
  });

  test('listTemplates returns empty array when no templates', () => {
    expect(listTemplates(dir)).toEqual([]);
  });

  test('deleteTemplate removes the file and returns true', () => {
    saveTemplate(sample, dir);
    const result = deleteTemplate('base', dir);
    expect(result).toBe(true);
    expect(loadTemplate('base', dir)).toBeNull();
  });

  test('deleteTemplate returns false for missing template', () => {
    expect(deleteTemplate('ghost', dir)).toBe(false);
  });

  test('validateAgainstTemplate returns missing keys', () => {
    const missing = validateAgainstTemplate(['HOST'], sample);
    expect(missing).toContain('PORT');
    expect(missing).toContain('DB_URL');
    expect(missing).not.toContain('HOST');
  });

  test('validateAgainstTemplate returns empty when all keys present', () => {
    const missing = validateAgainstTemplate(['HOST', 'PORT', 'DB_URL'], sample);
    expect(missing).toHaveLength(0);
  });
});
