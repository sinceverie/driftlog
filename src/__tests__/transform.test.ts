import {
  redactValue,
  normalizeValue,
  applyTransforms,
  parseTransformArgs,
  TransformRule,
} from '../transform';
import { DriftEntry } from '../differ';

const makeEntry = (key: string, base: unknown, compare: unknown): DriftEntry => ({
  key,
  kind: 'changed',
  baseValue: base,
  compareValue: compare,
});

describe('redactValue', () => {
  it('replaces both values with placeholder', () => {
    const entry = makeEntry('DB_PASS', 'secret', 'other');
    const result = redactValue(entry);
    expect(result.baseValue).toBe('***');
    expect(result.compareValue).toBe('***');
  });

  it('leaves undefined values as undefined', () => {
    const entry: DriftEntry = { key: 'X', kind: 'added', baseValue: undefined, compareValue: 'v' };
    const result = redactValue(entry);
    expect(result.baseValue).toBeUndefined();
    expect(result.compareValue).toBe('***');
  });

  it('supports custom placeholder', () => {
    const entry = makeEntry('K', 'a', 'b');
    expect(redactValue(entry, '[REDACTED]').baseValue).toBe('[REDACTED]');
  });
});

describe('normalizeValue', () => {
  it('lowercases and trims string values', () => {
    const entry = makeEntry('HOST', '  LOCALHOST  ', '  Prod.Example.Com  ');
    const result = normalizeValue(entry);
    expect(result.baseValue).toBe('localhost');
    expect(result.compareValue).toBe('prod.example.com');
  });

  it('leaves non-string values unchanged', () => {
    const entry = makeEntry('PORT', 8080, 9090);
    const result = normalizeValue(entry);
    expect(result.baseValue).toBe(8080);
  });
});

describe('applyTransforms', () => {
  it('applies matching rule by exact key', () => {
    const entries = [makeEntry('SECRET', 'x', 'y'), makeEntry('HOST', 'a', 'b')];
    const rules: TransformRule[] = [{ key: 'SECRET', fn: (e) => redactValue(e) }];
    const result = applyTransforms(entries, rules);
    expect(result[0].baseValue).toBe('***');
    expect(result[1].baseValue).toBe('a');
  });

  it('applies matching rule by regex', () => {
    const entries = [makeEntry('DB_PASS', 'p', 'q'), makeEntry('DB_USER', 'u', 'v')];
    const rules: TransformRule[] = [{ key: /^DB_PASS/, fn: (e) => redactValue(e) }];
    const result = applyTransforms(entries, rules);
    expect(result[0].baseValue).toBe('***');
    expect(result[1].baseValue).toBe('u');
  });

  it('excludes entry when transform returns null', () => {
    const entries = [makeEntry('SKIP', 'a', 'b'), makeEntry('KEEP', 'c', 'd')];
    const rules: TransformRule[] = [{ key: 'SKIP', fn: () => null }];
    const result = applyTransforms(entries, rules);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('KEEP');
  });
});

describe('parseTransformArgs', () => {
  it('parses --redact with string key', () => {
    const rules = parseTransformArgs(['--redact', 'API_KEY']);
    expect(rules).toHaveLength(1);
    const entry = makeEntry('API_KEY', 'secret', 'other');
    expect(rules[0].fn(entry)?.baseValue).toBe('***');
  });

  it('parses --normalize flag', () => {
    const rules = parseTransformArgs(['--normalize']);
    expect(rules).toHaveLength(1);
    const entry = makeEntry('ENV', '  PROD  ', '  dev  ');
    expect(rules[0].fn(entry)?.baseValue).toBe('prod');
  });

  it('returns empty array for no flags', () => {
    expect(parseTransformArgs([])).toHaveLength(0);
  });
});
