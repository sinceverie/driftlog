import { buildPivotTable, formatPivotTable, PivotTable } from '../pivot';
import { DriftEntry } from '../differ';

function makeEntry(
  key: string,
  baseValue: string | undefined,
  compareValue: string | undefined,
  kind: 'added' | 'removed' | 'changed' | 'unchanged' = 'changed'
): DriftEntry {
  return { key, baseValue, compareValue, kind };
}

describe('buildPivotTable', () => {
  const envLabels = ['staging', 'production'];

  it('builds rows for changed keys', () => {
    const entries: DriftEntry[] = [
      makeEntry('DB_HOST', 'localhost', 'prod-db.example.com'),
      makeEntry('LOG_LEVEL', 'debug', 'info'),
    ];
    const table = buildPivotTable(entries, envLabels);
    expect(table.envs).toEqual(envLabels);
    expect(table.rows).toHaveLength(2);
    const dbRow = table.rows.find(r => r.key === 'DB_HOST')!;
    expect(dbRow['staging']).toBe('localhost');
    expect(dbRow['production']).toBe('prod-db.example.com');
  });

  it('uses "-" for missing values in added/removed entries', () => {
    const entries: DriftEntry[] = [
      makeEntry('NEW_KEY', undefined, 'new-value', 'added'),
      makeEntry('OLD_KEY', 'old-value', undefined, 'removed'),
    ];
    const table = buildPivotTable(entries, envLabels);
    const newRow = table.rows.find(r => r.key === 'NEW_KEY')!;
    expect(newRow['staging']).toBe('-');
    expect(newRow['production']).toBe('new-value');
    const oldRow = table.rows.find(r => r.key === 'OLD_KEY')!;
    expect(oldRow['staging']).toBe('old-value');
    expect(oldRow['production']).toBe('-');
  });

  it('sorts rows by key alphabetically', () => {
    const entries: DriftEntry[] = [
      makeEntry('Z_KEY', 'a', 'b'),
      makeEntry('A_KEY', 'c', 'd'),
      makeEntry('M_KEY', 'e', 'f'),
    ];
    const table = buildPivotTable(entries, envLabels);
    expect(table.rows.map(r => r.key)).toEqual(['A_KEY', 'M_KEY', 'Z_KEY']);
  });

  it('returns empty rows for empty entries', () => {
    const table = buildPivotTable([], envLabels);
    expect(table.rows).toHaveLength(0);
    expect(table.envs).toEqual(envLabels);
  });
});

describe('formatPivotTable', () => {
  it('includes headers and divider', () => {
    const table: PivotTable = {
      envs: ['staging', 'production'],
      rows: [
        { key: 'DB_HOST', staging: 'localhost', production: 'prod-db' },
      ],
    };
    const output = formatPivotTable(table);
    expect(output).toContain('KEY');
    expect(output).toContain('staging');
    expect(output).toContain('production');
    expect(output).toContain('DB_HOST');
    expect(output).toContain('localhost');
    expect(output).toContain('prod-db');
    expect(output).toContain('-+-');
  });

  it('aligns columns to max width', () => {
    const table: PivotTable = {
      envs: ['a', 'b'],
      rows: [
        { key: 'SHORT', a: 'x', b: 'y' },
        { key: 'MUCH_LONGER_KEY', a: 'val', b: 'other' },
      ],
    };
    const lines = formatPivotTable(table).split('\n');
    // All lines should have the same length (padded)
    const lengths = lines.map(l => l.length);
    expect(new Set(lengths).size).toBe(1);
  });
});
