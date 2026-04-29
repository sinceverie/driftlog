import { buildCompareTable, formatCompareTable, CompareRow } from '../compare';
import { DriftEntry } from '../differ';

const leftConfig = { A: '1', B: '2', C: '3' };
const rightConfig = { A: '1', B: '99', D: '4' };

const entries: DriftEntry[] = [
  { key: 'B', kind: 'changed', leftValue: '2', rightValue: '99' },
  { key: 'C', kind: 'removed', leftValue: '3', rightValue: undefined },
  { key: 'D', kind: 'added', leftValue: undefined, rightValue: '4' },
];

describe('buildCompareTable', () => {
  it('returns rows for drifted keys only by default', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
    });
    expect(rows).toHaveLength(3);
    const keys = rows.map((r) => r.key);
    expect(keys).toContain('B');
    expect(keys).toContain('C');
    expect(keys).toContain('D');
  });

  it('includes equal rows when showEqual is true', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
      showEqual: true,
    });
    const equal = rows.filter((r) => r.status === 'equal');
    expect(equal.length).toBeGreaterThan(0);
    expect(equal[0].key).toBe('A');
  });

  it('filters to onlyKeys when specified', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
      onlyKeys: ['B'],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('B');
    expect(rows[0].status).toBe('changed');
  });

  it('assigns correct statuses', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
    });
    const byKey: Record<string, CompareRow> = {};
    rows.forEach((r) => (byKey[r.key] = r));
    expect(byKey['B'].status).toBe('changed');
    expect(byKey['C'].status).toBe('removed');
    expect(byKey['D'].status).toBe('added');
  });
});

describe('formatCompareTable', () => {
  it('returns no-diff message for empty rows', () => {
    const out = formatCompareTable([], ['left', 'right']);
    expect(out).toBe('No differences found.');
  });

  it('includes key and both label headers', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
    });
    const out = formatCompareTable(rows, ['left', 'right']);
    expect(out).toContain('left');
    expect(out).toContain('right');
    expect(out).toContain('KEY');
  });

  it('marks changed rows with ~', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
    });
    const out = formatCompareTable(rows, ['left', 'right']);
    expect(out).toContain('~');
  });

  it('shows (missing) for absent values', () => {
    const rows = buildCompareTable(entries, leftConfig, rightConfig, {
      labels: ['left', 'right'],
    });
    const out = formatCompareTable(rows, ['left', 'right']);
    expect(out).toContain('(missing)');
  });
});
