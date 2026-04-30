import { buildTrendPoint, analyzeTrend, buildTrendReport, formatTrendReport, TrendPoint } from '../trend';
import { HistoryEntry } from '../history';
import * as historyModule from '../history';

const makeEntry = (timestamp: string, drift: { kind: string }[]): HistoryEntry => ({
  timestamp,
  label: 'test',
  drift: drift as any,
});

describe('buildTrendPoint', () => {
  it('counts drift kinds correctly', () => {
    const entry = makeEntry('2024-01-01T00:00:00Z', [
      { kind: 'added' },
      { kind: 'added' },
      { kind: 'removed' },
      { kind: 'changed' },
    ]);
    const point = buildTrendPoint(entry);
    expect(point.added).toBe(2);
    expect(point.removed).toBe(1);
    expect(point.changed).toBe(1);
    expect(point.total).toBe(4);
    expect(point.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('handles empty drift', () => {
    const entry = makeEntry('2024-01-02T00:00:00Z', []);
    const point = buildTrendPoint(entry);
    expect(point.total).toBe(0);
  });
});

describe('analyzeTrend', () => {
  it('returns stable with fewer than 2 points', () => {
    expect(analyzeTrend([]).direction).toBe('stable');
    const p: TrendPoint = { timestamp: 't', added: 1, removed: 0, changed: 0, total: 1 };
    expect(analyzeTrend([p]).direction).toBe('stable');
  });

  it('detects worsening trend', () => {
    const pts: TrendPoint[] = [
      { timestamp: 't1', added: 1, removed: 0, changed: 0, total: 1 },
      { timestamp: 't2', added: 3, removed: 1, changed: 1, total: 5 },
    ];
    const result = analyzeTrend(pts);
    expect(result.direction).toBe('worsening');
    expect(result.delta).toBe(4);
  });

  it('detects improving trend', () => {
    const pts: TrendPoint[] = [
      { timestamp: 't1', added: 4, removed: 1, changed: 1, total: 6 },
      { timestamp: 't2', added: 1, removed: 0, changed: 0, total: 1 },
    ];
    const result = analyzeTrend(pts);
    expect(result.direction).toBe('improving');
    expect(result.delta).toBe(-5);
  });
});

describe('buildTrendReport', () => {
  it('builds a report from history', () => {
    jest.spyOn(historyModule, 'loadHistory').mockReturnValue([
      makeEntry('2024-01-01T00:00:00Z', [{ kind: 'added' }]),
      makeEntry('2024-01-02T00:00:00Z', [{ kind: 'added' }, { kind: 'changed' }]),
    ]);
    const report = buildTrendReport('staging');
    expect(report.label).toBe('staging');
    expect(report.points).toHaveLength(2);
    expect(report.direction).toBe('worsening');
    jest.restoreAllMocks();
  });
});

describe('formatTrendReport', () => {
  it('includes label and direction in output', () => {
    const report = {
      label: 'prod',
      points: [
        { timestamp: '2024-01-01T00:00:00Z', added: 1, removed: 0, changed: 0, total: 1 },
      ],
      direction: 'stable' as const,
      delta: 0,
    };
    const output = formatTrendReport(report);
    expect(output).toContain('prod');
    expect(output).toContain('stable');
    expect(output).toContain('2024-01-01T00:00:00Z');
  });
});
