import { scoreDrift, formatScoreReport, DriftScore } from '../score';
import { DriftEntry } from '../differ';

function makeEntries(
  added: number,
  removed: number,
  changed: number
): DriftEntry[] {
  const entries: DriftEntry[] = [];
  for (let i = 0; i < added; i++)
    entries.push({ key: `add_${i}`, kind: 'added', left: undefined, right: 'val' });
  for (let i = 0; i < removed; i++)
    entries.push({ key: `rem_${i}`, kind: 'removed', left: 'val', right: undefined });
  for (let i = 0; i < changed; i++)
    entries.push({ key: `chg_${i}`, kind: 'changed', left: 'a', right: 'b' });
  return entries;
}

describe('scoreDrift', () => {
  it('returns none severity for empty entries', () => {
    const score = scoreDrift([]);
    expect(score.severity).toBe('none');
    expect(score.total).toBe(0);
    expect(score.summary).toBe('No drift detected.');
  });

  it('returns low severity for a single added key', () => {
    const score = scoreDrift(makeEntries(1, 0, 0));
    expect(score.severity).toBe('low');
    expect(score.added).toBe(1);
    expect(score.removed).toBe(0);
    expect(score.changed).toBe(0);
  });

  it('returns medium severity for moderate drift', () => {
    const score = scoreDrift(makeEntries(1, 1, 1));
    expect(score.severity).toBe('medium');
    expect(score.total).toBe(3);
  });

  it('returns high severity for heavy drift', () => {
    const score = scoreDrift(makeEntries(2, 3, 3));
    expect(score.severity).toBe('high');
  });

  it('weighs removed and changed keys more heavily', () => {
    const manyAdded = scoreDrift(makeEntries(4, 0, 0));
    const fewRemoved = scoreDrift(makeEntries(0, 2, 0));
    // 4 added => weightedScore 4 => low; 2 removed => weightedScore 6 => medium
    expect(manyAdded.severity).toBe('low');
    expect(fewRemoved.severity).toBe('medium');
  });

  it('includes all parts in summary string', () => {
    const score = scoreDrift(makeEntries(2, 1, 3));
    expect(score.summary).toContain('added');
    expect(score.summary).toContain('removed');
    expect(score.summary).toContain('changed');
  });
});

describe('formatScoreReport', () => {
  it('renders a readable report', () => {
    const score = scoreDrift(makeEntries(1, 2, 1));
    const report = formatScoreReport(score);
    expect(report).toContain('Drift Severity');
    expect(report).toContain('Total Keys');
    expect(report).toContain('Added');
    expect(report).toContain('Removed');
    expect(report).toContain('Changed');
    expect(report).toContain('Summary');
  });

  it('shows NONE for empty drift', () => {
    const score = scoreDrift([]);
    const report = formatScoreReport(score);
    expect(report).toContain('NONE');
  });
});
