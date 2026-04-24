import { compareSnapshots, formatSnapshotComparisonText } from '../snapshotDiff';
import { Snapshot } from '../snapshot';

const baseSnap: Snapshot = {
  label: 'prod-v1',
  timestamp: '2024-01-01T00:00:00.000Z',
  config: {
    PORT: '8080',
    NODE_ENV: 'production',
    DB_URL: 'postgres://old/db',
  },
};

const newSnap: Snapshot = {
  label: 'prod-v2',
  timestamp: '2024-02-01T00:00:00.000Z',
  config: {
    PORT: '8080',
    NODE_ENV: 'production',
    DB_URL: 'postgres://new/db',
    REDIS_URL: 'redis://localhost',
  },
};

describe('compareSnapshots', () => {
  test('detects changed and added keys', () => {
    const result = compareSnapshots(baseSnap, newSnap);
    expect(result.hasDrift).toBe(true);
    expect(result.fromLabel).toBe('prod-v1');
    expect(result.toLabel).toBe('prod-v2');
    expect(result.drift['DB_URL'].kind).toBe('changed');
    expect(result.drift['REDIS_URL'].kind).toBe('added');
  });

  test('returns no drift for identical configs', () => {
    const result = compareSnapshots(baseSnap, { ...baseSnap, label: 'prod-v1-copy' });
    expect(result.hasDrift).toBe(false);
  });
});

describe('formatSnapshotComparisonText', () => {
  test('includes header with labels and timestamps', () => {
    const result = compareSnapshots(baseSnap, newSnap);
    const text = formatSnapshotComparisonText(result);
    expect(text).toContain('prod-v1');
    expect(text).toContain('prod-v2');
  });

  test('shows changed key with arrow', () => {
    const result = compareSnapshots(baseSnap, newSnap);
    const text = formatSnapshotComparisonText(result);
    expect(text).toContain('DB_URL');
    expect(text).toContain('→');
  });

  test('shows no drift message when configs match', () => {
    const same = compareSnapshots(baseSnap, { ...baseSnap });
    const text = formatSnapshotComparisonText(same);
    expect(text).toContain('No drift detected');
  });
});
