import {
  stringSimilarity,
  buildDiffStats,
  summarizeDiffStats,
  formatDiffStatsReport,
} from '../diff';

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1);
  });

  it('returns 1 for two empty strings', () => {
    expect(stringSimilarity('', '')).toBe(1);
  });

  it('returns a value between 0 and 1 for partial matches', () => {
    const sim = stringSimilarity('abc', 'axc');
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('returns lower similarity for very different strings', () => {
    const sim = stringSimilarity('aaaa', 'zzzz');
    expect(sim).toBeLessThan(0.5);
  });
});

describe('buildDiffStats', () => {
  const left  = { A: '1', B: '2', C: '3' };
  const right = { A: '1', B: '99', D: '4' };

  it('detects equal keys', () => {
    const stats = buildDiffStats(left, right);
    const eq = stats.find(s => s.key === 'A');
    expect(eq?.kind).toBe('equal');
  });

  it('detects changed keys', () => {
    const stats = buildDiffStats(left, right);
    const ch = stats.find(s => s.key === 'B');
    expect(ch?.kind).toBe('changed');
    expect(ch?.leftValue).toBe('2');
    expect(ch?.rightValue).toBe('99');
    expect(ch?.similarity).toBeDefined();
  });

  it('detects removed keys', () => {
    const stats = buildDiffStats(left, right);
    const rm = stats.find(s => s.key === 'C');
    expect(rm?.kind).toBe('removed');
    expect(rm?.rightValue).toBeUndefined();
  });

  it('detects added keys', () => {
    const stats = buildDiffStats(left, right);
    const ad = stats.find(s => s.key === 'D');
    expect(ad?.kind).toBe('added');
    expect(ad?.leftValue).toBeUndefined();
  });

  it('returns keys in sorted order', () => {
    const stats = buildDiffStats(left, right);
    const keys = stats.map(s => s.key);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('summarizeDiffStats', () => {
  it('produces correct counts and change rate', () => {
    const left  = { A: '1', B: '2', C: '3' };
    const right = { A: '1', B: '99', D: '4' };
    const stats = buildDiffStats(left, right);
    const summary = summarizeDiffStats(stats);
    expect(summary.total).toBe(4);
    expect(summary.equal).toBe(1);
    expect(summary.changed).toBe(1);
    expect(summary.removed).toBe(1);
    expect(summary.added).toBe(1);
    expect(summary.changeRate).toBeCloseTo(0.75, 2);
  });

  it('returns changeRate 0 for empty stats', () => {
    const summary = summarizeDiffStats([]);
    expect(summary.changeRate).toBe(0);
  });
});

describe('formatDiffStatsReport', () => {
  it('includes added/removed/changed markers', () => {
    const left  = { A: '1' };
    const right = { B: '2' };
    const stats = buildDiffStats(left, right);
    const summary = summarizeDiffStats(stats);
    const report = formatDiffStatsReport(stats, summary);
    expect(report).toContain('- A');
    expect(report).toContain('+ B');
    expect(report).toContain('Change rate:');
  });

  it('includes similarity for changed entries', () => {
    const left  = { X: 'hello' };
    const right = { X: 'hxllo' };
    const stats = buildDiffStats(left, right);
    const summary = summarizeDiffStats(stats);
    const report = formatDiffStatsReport(stats, summary);
    expect(report).toContain('~ X');
    expect(report).toContain('sim:');
  });
});
