import { groupDrift, formatGroupReport, parseGroupArgs, DriftGroup } from '../group';
import { DriftEntry } from '../differ';

const entries: DriftEntry[] = [
  { key: 'DB_HOST', kind: 'changed', base: 'localhost', target: 'prod-db' },
  { key: 'DB_PORT', kind: 'changed', base: '5432', target: '5433' },
  { key: 'APP_NAME', kind: 'added', base: undefined, target: 'myapp' },
  { key: 'OLD_KEY', kind: 'removed', base: 'old', target: undefined },
];

describe('groupDrift', () => {
  it('groups by kind', () => {
    const groups = groupDrift(entries, 'kind');
    const labels = groups.map(g => g.label);
    expect(labels).toContain('added');
    expect(labels).toContain('changed');
    expect(labels).toContain('removed');
    const changed = groups.find(g => g.label === 'changed')!;
    expect(changed.entries).toHaveLength(2);
  });

  it('groups by key', () => {
    const groups = groupDrift(entries, 'key');
    expect(groups).toHaveLength(4);
    expect(groups.map(g => g.label)).toContain('DB_HOST');
  });

  it('groups by prefix', () => {
    const groups = groupDrift(entries, 'prefix');
    const labels = groups.map(g => g.label);
    expect(labels).toContain('DB');
    expect(labels).toContain('APP');
    expect(labels).toContain('OLD');
    const db = groups.find(g => g.label === 'DB')!;
    expect(db.entries).toHaveLength(2);
  });

  it('returns empty array for no entries', () => {
    expect(groupDrift([], 'kind')).toEqual([]);
  });

  it('sorts groups alphabetically', () => {
    const groups = groupDrift(entries, 'kind');
    const labels = groups.map(g => g.label);
    expect(labels).toEqual([...labels].sort());
  });
});

describe('formatGroupReport', () => {
  it('returns no-drift message for empty groups', () => {
    expect(formatGroupReport([], 'kind')).toContain('No drift detected');
  });

  it('includes group label and count', () => {
    const groups = groupDrift(entries, 'kind');
    const report = formatGroupReport(groups, 'kind');
    expect(report).toContain('[changed] (2 items)');
    expect(report).toContain('[added] (1 item)');
  });

  it('formats changed entries with arrow', () => {
    const groups = groupDrift(entries, 'kind');
    const report = formatGroupReport(groups, 'kind');
    expect(report).toContain('DB_HOST');
    expect(report).toContain('→');
  });

  it('formats added entries with +', () => {
    const groups = groupDrift(entries, 'kind');
    const report = formatGroupReport(groups, 'kind');
    expect(report).toContain('+ APP_NAME');
  });

  it('formats removed entries with -', () => {
    const groups = groupDrift(entries, 'kind');
    const report = formatGroupReport(groups, 'kind');
    expect(report).toContain('- OLD_KEY');
  });
});

describe('parseGroupArgs', () => {
  it('defaults to kind', () => {
    expect(parseGroupArgs([])).toBe('kind');
  });

  it('parses --group-by prefix', () => {
    expect(parseGroupArgs(['--group-by', 'prefix'])).toBe('prefix');
  });

  it('parses --group-by key', () => {
    expect(parseGroupArgs(['--group-by', 'key'])).toBe('key');
  });

  it('falls back to kind for unknown value', () => {
    expect(parseGroupArgs(['--group-by', 'unknown'])).toBe('kind');
  });
});
