import { suggestFixes, formatSuggestions } from '../suggest';
import { DriftEntry } from '../differ';

const missingEntry: DriftEntry = {
  key: 'DB_HOST',
  kind: 'missing',
  fromValue: 'localhost',
  toValue: undefined,
};

const extraEntry: DriftEntry = {
  key: 'LEGACY_FLAG',
  kind: 'extra',
  fromValue: undefined,
  toValue: 'true',
};

const changedEntry: DriftEntry = {
  key: 'PORT',
  kind: 'changed',
  fromValue: '3000',
  toValue: '8080',
};

describe('suggestFixes', () => {
  it('returns empty array for no drift', () => {
    expect(suggestFixes([])).toEqual([]);
  });

  it('generates a suggestion for a missing key', () => {
    const [s] = suggestFixes([missingEntry]);
    expect(s.key).toBe('DB_HOST');
    expect(s.kind).toBe('missing');
    expect(s.message).toContain('missing in the target');
    expect(s.fix).toContain('DB_HOST=localhost');
  });

  it('generates a suggestion for an extra key', () => {
    const [s] = suggestFixes([extraEntry]);
    expect(s.key).toBe('LEGACY_FLAG');
    expect(s.kind).toBe('extra');
    expect(s.message).toContain('exists in the target');
    expect(s.fix).toContain('Remove');
  });

  it('generates a suggestion for a changed key', () => {
    const [s] = suggestFixes([changedEntry]);
    expect(s.key).toBe('PORT');
    expect(s.kind).toBe('changed');
    expect(s.message).toContain('source="3000"');
    expect(s.message).toContain('target="8080"');
    expect(s.fix).toContain('3000');
  });

  it('handles multiple entries', () => {
    const results = suggestFixes([missingEntry, extraEntry, changedEntry]);
    expect(results).toHaveLength(3);
  });
});

describe('formatSuggestions', () => {
  it('returns sync message when no suggestions', () => {
    const out = formatSuggestions([]);
    expect(out).toContain('No suggestions');
  });

  it('includes key kind and fix in output', () => {
    const suggestions = suggestFixes([missingEntry, changedEntry]);
    const out = formatSuggestions(suggestions);
    expect(out).toContain('[MISSING]');
    expect(out).toContain('[CHANGED]');
    expect(out).toContain('DB_HOST=localhost');
    expect(out).toContain('→');
  });
});
