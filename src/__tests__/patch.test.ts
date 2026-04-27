import { buildPatchFromDrift, applyPatch, formatPatchReport, PatchOperation } from '../patch';
import { DriftEntry } from '../differ';

const entries: DriftEntry[] = [
  { key: 'DB_HOST', kind: 'changed', sourceValue: 'localhost', targetValue: 'prod-db.internal' },
  { key: 'CACHE_URL', kind: 'missing', sourceValue: undefined, targetValue: 'redis://cache:6379' },
  { key: 'DEBUG', kind: 'extra', sourceValue: 'true', targetValue: undefined },
];

describe('buildPatchFromDrift', () => {
  it('generates set op for changed keys', () => {
    const ops = buildPatchFromDrift(entries);
    const setOp = ops.find(o => o.key === 'DB_HOST');
    expect(setOp).toBeDefined();
    expect(setOp?.op).toBe('set');
    expect(setOp?.value).toBe('prod-db.internal');
  });

  it('generates set op for missing keys', () => {
    const ops = buildPatchFromDrift(entries);
    const missingOp = ops.find(o => o.key === 'CACHE_URL');
    expect(missingOp?.op).toBe('set');
    expect(missingOp?.value).toBe('redis://cache:6379');
  });

  it('generates unset op for extra keys', () => {
    const ops = buildPatchFromDrift(entries);
    const extraOp = ops.find(o => o.key === 'DEBUG');
    expect(extraOp?.op).toBe('unset');
  });

  it('returns empty array for no drift', () => {
    expect(buildPatchFromDrift([])).toEqual([]);
  });
});

describe('applyPatch', () => {
  const base: Record<string, string> = {
    DB_HOST: 'localhost',
    DEBUG: 'true',
    PORT: '3000',
  };

  it('applies set operations', () => {
    const ops: PatchOperation[] = [{ op: 'set', key: 'DB_HOST', value: 'prod-db.internal' }];
    const result = applyPatch(base, ops);
    expect(result.output['DB_HOST']).toBe('prod-db.internal');
    expect(result.applied).toHaveLength(1);
  });

  it('applies unset operations', () => {
    const ops: PatchOperation[] = [{ op: 'unset', key: 'DEBUG' }];
    const result = applyPatch(base, ops);
    expect(result.output).not.toHaveProperty('DEBUG');
    expect(result.applied).toHaveLength(1);
  });

  it('skips unset for missing key', () => {
    const ops: PatchOperation[] = [{ op: 'unset', key: 'NONEXISTENT' }];
    const result = applyPatch(base, ops);
    expect(result.skipped).toHaveLength(1);
  });

  it('applies rename operations', () => {
    const ops: PatchOperation[] = [{ op: 'rename', key: 'PORT', newKey: 'APP_PORT' }];
    const result = applyPatch(base, ops);
    expect(result.output).toHaveProperty('APP_PORT', '3000');
    expect(result.output).not.toHaveProperty('PORT');
  });

  it('does not mutate original config', () => {
    const ops: PatchOperation[] = [{ op: 'set', key: 'PORT', value: '8080' }];
    applyPatch(base, ops);
    expect(base['PORT']).toBe('3000');
  });
});

describe('formatPatchReport', () => {
  it('includes applied and skipped counts', () => {
    const result = applyPatch({ KEY: 'val' }, [
      { op: 'set', key: 'KEY', value: 'new' },
      { op: 'unset', key: 'MISSING' },
    ]);
    const report = formatPatchReport(result);
    expect(report).toContain('1 applied');
    expect(report).toContain('1 skipped');
    expect(report).toContain('[set]');
    expect(report).toContain('[unset]');
  });
});
