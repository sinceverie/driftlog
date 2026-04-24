import { filterDrift, matchesPattern, parseFilterArgs } from '../filter';
import { DriftResult } from '../differ';

const sampleDrift: DriftResult[] = [
  { key: 'DB_HOST', kind: 'changed', base: 'localhost', compare: 'prod-db.internal' },
  { key: 'DB_PORT', kind: 'changed', base: '5432', compare: '5433' },
  { key: 'SECRET_KEY', kind: 'changed', base: 'abc', compare: 'xyz' },
  { key: 'NEW_FEATURE_FLAG', kind: 'added', base: undefined, compare: 'true' },
  { key: 'DEPRECATED_VAR', kind: 'removed', base: 'old', compare: undefined },
];

describe('matchesPattern', () => {
  it('matches exact key', () => {
    expect(matchesPattern('DB_HOST', 'DB_HOST')).toBe(true);
  });

  it('matches wildcard prefix', () => {
    expect(matchesPattern('DB_HOST', 'DB_*')).toBe(true);
    expect(matchesPattern('DB_PORT', 'DB_*')).toBe(true);
    expect(matchesPattern('SECRET_KEY', 'DB_*')).toBe(false);
  });

  it('matches substring', () => {
    expect(matchesPattern('NEW_FEATURE_FLAG', 'FEATURE')).toBe(true);
    expect(matchesPattern('DB_HOST', 'FEATURE')).toBe(false);
  });
});

describe('filterDrift', () => {
  it('returns all entries when no options given', () => {
    expect(filterDrift(sampleDrift, {})).toHaveLength(5);
  });

  it('filters by kind', () => {
    const result = filterDrift(sampleDrift, { kinds: ['added', 'removed'] });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.key)).toEqual(['NEW_FEATURE_FLAG', 'DEPRECATED_VAR']);
  });

  it('filters by include pattern', () => {
    const result = filterDrift(sampleDrift, { include: ['DB_*'] });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.key.startsWith('DB_'))).toBe(true);
  });

  it('filters by exclude pattern', () => {
    const result = filterDrift(sampleDrift, { exclude: ['SECRET*'] });
    expect(result).toHaveLength(4);
    expect(result.find((r) => r.key === 'SECRET_KEY')).toBeUndefined();
  });

  it('exclude takes precedence over include', () => {
    const result = filterDrift(sampleDrift, { include: ['DB_*'], exclude: ['DB_PORT'] });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('DB_HOST');
  });
});

describe('parseFilterArgs', () => {
  it('parses include, exclude, and kinds flags', () => {
    const opts = parseFilterArgs([
      '--include=DB_*,SECRET*',
      '--exclude=DB_PORT',
      '--kinds=changed,added',
    ]);
    expect(opts.include).toEqual(['DB_*', 'SECRET*']);
    expect(opts.exclude).toEqual(['DB_PORT']);
    expect(opts.kinds).toEqual(['changed', 'added']);
  });

  it('returns empty options for unrelated args', () => {
    const opts = parseFilterArgs(['--format=text', '--output=report.txt']);
    expect(opts.include).toBeUndefined();
    expect(opts.exclude).toBeUndefined();
    expect(opts.kinds).toBeUndefined();
  });
});
