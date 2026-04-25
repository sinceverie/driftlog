import { parseAnnotationArgs, annotateDrift, formatAnnotatedReport, Annotation, AnnotationMap } from '../annotate';
import { DriftEntry } from '../differ';

const baseEntries: DriftEntry[] = [
  { key: 'DB_HOST', kind: 'changed', baseValue: 'localhost', compareValue: 'prod-db' },
  { key: 'API_KEY', kind: 'removed', baseValue: 'abc123', compareValue: undefined },
  { key: 'NEW_FLAG', kind: 'added', baseValue: undefined, compareValue: 'true' },
];

describe('parseAnnotationArgs', () => {
  it('parses key and note', () => {
    const result = parseAnnotationArgs(['DB_HOST', 'intentional change']);
    expect(result.key).toBe('DB_HOST');
    expect(result.note).toBe('intentional change');
    expect(result.author).toBeUndefined();
  });

  it('parses author flag', () => {
    const result = parseAnnotationArgs(['DB_HOST', 'ok', '--author=alice']);
    expect(result.author).toBe('alice');
  });

  it('throws when key or note missing', () => {
    expect(() => parseAnnotationArgs(['DB_HOST'])).toThrow();
    expect(() => parseAnnotationArgs([])).toThrow();
  });
});

describe('annotateDrift', () => {
  const annotations: AnnotationMap = {
    DB_HOST: {
      key: 'DB_HOST',
      note: 'Prod DB host',
      author: 'bob',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  };

  it('attaches annotation to matching entry', () => {
    const result = annotateDrift(baseEntries, annotations);
    const dbEntry = result.find(e => e.key === 'DB_HOST');
    expect(dbEntry?.annotation).toBeDefined();
    expect(dbEntry?.annotation?.note).toBe('Prod DB host');
  });

  it('leaves non-matching entries without annotation', () => {
    const result = annotateDrift(baseEntries, annotations);
    const apiEntry = result.find(e => e.key === 'API_KEY');
    expect(apiEntry?.annotation).toBeUndefined();
  });

  it('returns same number of entries', () => {
    const result = annotateDrift(baseEntries, annotations);
    expect(result).toHaveLength(baseEntries.length);
  });
});

describe('formatAnnotatedReport', () => {
  it('returns no-drift message for empty list', () => {
    expect(formatAnnotatedReport([])).toContain('No drift detected');
  });

  it('includes annotation note in output', () => {
    const annotation: Annotation = {
      key: 'DB_HOST',
      note: 'expected for prod',
      author: 'alice',
      createdAt: '2024-06-01T12:00:00.000Z',
    };
    const annotated = [{ ...baseEntries[0], annotation }];
    const output = formatAnnotatedReport(annotated);
    expect(output).toContain('expected for prod');
    expect(output).toContain('alice');
    expect(output).toContain('CHANGED');
  });

  it('formats added and removed entries', () => {
    const result = formatAnnotatedReport(baseEntries as any);
    expect(result).toContain('ADDED');
    expect(result).toContain('REMOVED');
  });
});
