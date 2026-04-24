import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  getSnapshotPath,
} from '../snapshot';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-snap-'));
}

describe('snapshot', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('saveSnapshot creates a JSON file', () => {
    const config = { PORT: '3000', NODE_ENV: 'production' };
    const filePath = saveSnapshot('prod', config, tmpDir);
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(data.label).toBe('prod');
    expect(data.config).toEqual(config);
    expect(typeof data.timestamp).toBe('string');
  });

  test('loadSnapshot returns saved snapshot', () => {
    const config = { DB_URL: 'postgres://localhost/db' };
    saveSnapshot('staging', config, tmpDir);
    const snap = loadSnapshot('staging', tmpDir);
    expect(snap.label).toBe('staging');
    expect(snap.config).toEqual(config);
  });

  test('loadSnapshot throws if not found', () => {
    expect(() => loadSnapshot('missing', tmpDir)).toThrow(/not found/);
  });

  test('listSnapshots returns all saved snapshots', () => {
    saveSnapshot('env-a', { A: '1' }, tmpDir);
    saveSnapshot('env-b', { B: '2' }, tmpDir);
    const snaps = listSnapshots(tmpDir);
    expect(snaps).toHaveLength(2);
    const labels = snaps.map((s) => s.label);
    expect(labels).toContain('env-a');
    expect(labels).toContain('env-b');
  });

  test('listSnapshots returns empty array if dir missing', () => {
    expect(listSnapshots(path.join(tmpDir, 'nonexistent'))).toEqual([]);
  });

  test('getSnapshotPath sanitizes label', () => {
    const p = getSnapshotPath('/some/dir', 'my/env:label');
    expect(p).toMatch(/my_env_label\.json$/);
  });
});
