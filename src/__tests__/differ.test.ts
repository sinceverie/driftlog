import { computeDrift, hasDrift } from '../differ';
import { ConfigRecord } from '../parser';

describe('computeDrift', () => {
  it('returns empty array when configs are identical', () => {
    const base: ConfigRecord = { PORT: '3000', DB_HOST: 'localhost' };
    const target: ConfigRecord = { PORT: '3000', DB_HOST: 'localhost' };
    expect(computeDrift(base, target)).toEqual([]);
  });

  it('detects added keys', () => {
    const base: ConfigRecord = { PORT: '3000' };
    const target: ConfigRecord = { PORT: '3000', NEW_KEY: 'value' };
    const drift = computeDrift(base, target);
    expect(drift).toHaveLength(1);
    expect(drift[0].kind).toBe('added');
    expect(drift[0].path).toBe('NEW_KEY');
    expect(drift[0].targetValue).toBe('value');
  });

  it('detects removed keys', () => {
    const base: ConfigRecord = { PORT: '3000', OLD_KEY: 'old' };
    const target: ConfigRecord = { PORT: '3000' };
    const drift = computeDrift(base, target);
    expect(drift).toHaveLength(1);
    expect(drift[0].kind).toBe('removed');
    expect(drift[0].path).toBe('OLD_KEY');
    expect(drift[0].baseValue).toBe('old');
  });

  it('detects changed values', () => {
    const base: ConfigRecord = { PORT: '3000' };
    const target: ConfigRecord = { PORT: '8080' };
    const drift = computeDrift(base, target);
    expect(drift).toHaveLength(1);
    expect(drift[0].kind).toBe('changed');
    expect(drift[0].baseValue).toBe('3000');
    expect(drift[0].targetValue).toBe('8080');
  });

  it('detects nested key changes', () => {
    const base: ConfigRecord = { database: { host: 'localhost', port: 5432 } };
    const target: ConfigRecord = { database: { host: 'prod-db.example.com', port: 5432 } };
    const drift = computeDrift(base, target);
    expect(drift).toHaveLength(1);
    expect(drift[0].path).toBe('database.host');
  });
});

describe('hasDrift', () => {
  it('returns false for empty drift entries', () => {
    expect(hasDrift([])).toBe(false);
  });

  it('returns true when drift entries exist', () => {
    const drift = computeDrift({ A: '1' }, { A: '2' });
    expect(hasDrift(drift)).toBe(true);
  });
});
