import {
  listRollbackTargets,
  resolveRollbackData,
  generateRollbackPatch,
  formatRollbackReport,
} from '../rollback';
import { saveSnapshot } from '../snapshot';
import { saveBaseline } from '../baseline';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
}

describe('generateRollbackPatch', () => {
  it('returns empty patch when configs are identical', () => {
    const cur = { A: '1', B: '2' };
    const tgt = { A: '1', B: '2' };
    expect(generateRollbackPatch(cur, tgt)).toHaveLength(0);
  });

  it('detects changed keys', () => {
    const patch = generateRollbackPatch({ A: 'old' }, { A: 'new' });
    expect(patch).toHaveLength(1);
    expect(patch[0]).toMatchObject({ key: 'A', kind: 'changed', leftVal: 'old', rightVal: 'new' });
  });

  it('detects added keys (present in target but not current)', () => {
    const patch = generateRollbackPatch({}, { X: 'val' });
    expect(patch[0]).toMatchObject({ key: 'X', kind: 'added' });
  });

  it('detects removed keys (present in current but not target)', () => {
    const patch = generateRollbackPatch({ Y: 'val' }, {});
    expect(patch[0]).toMatchObject({ key: 'Y', kind: 'removed' });
  });
});

describe('formatRollbackReport', () => {
  it('reports no changes when patch is empty', () => {
    const out = formatRollbackReport([], 'v1');
    expect(out).toContain('No changes needed');
  });

  it('formats changed entry', () => {
    const patch = [{ key: 'PORT', kind: 'changed' as const, leftVal: '80', rightVal: '443' }];
    const out = formatRollbackReport(patch, 'v1');
    expect(out).toContain('~ PORT');
    expect(out).toContain('80');
    expect(out).toContain('443');
  });
});

describe('listRollbackTargets + resolveRollbackData', () => {
  it('lists and resolves snapshot targets', () => {
    const dir = makeTmpDir();
    saveSnapshot('env', 'prod', { KEY: 'val' }, dir);
    const targets = listRollbackTargets('snapshot', dir);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets[0].source).toBe('snapshot');
    const data = resolveRollbackData('snapshot', 'env', 'prod', dir);
    expect(data).toEqual({ KEY: 'val' });
  });

  it('returns null for missing snapshot', () => {
    const dir = makeTmpDir();
    const data = resolveRollbackData('snapshot', 'missing', 'label', dir);
    expect(data).toBeNull();
  });
});
