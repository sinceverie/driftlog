import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DriftEntry } from '../differ';
import { addTag } from '../tag';
import { filterDriftByTags, parseTagFilterArgs } from '../tagFilter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-tagfilter-'));
}

const entries: DriftEntry[] = [
  { key: 'DB_HOST', kind: 'changed', left: 'a', right: 'b' },
  { key: 'API_KEY', kind: 'missing', left: 'x', right: undefined },
  { key: 'PORT', kind: 'extra', left: undefined, right: '8080' },
];

describe('filterDriftByTags', () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns all entries when no filters given', () => {
    const result = filterDriftByTags(entries, 'prod', {}, tmp);
    expect(result).toHaveLength(3);
  });

  it('filters by include tag', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    const result = filterDriftByTags(entries, 'prod', { include: ['critical'] }, tmp);
    expect(result.map(e => e.key)).toEqual(['DB_HOST']);
  });

  it('filters by exclude tag', () => {
    addTag('prod', 'API_KEY', 'secret', tmp);
    const result = filterDriftByTags(entries, 'prod', { exclude: ['secret'] }, tmp);
    expect(result.map(e => e.key)).not.toContain('API_KEY');
  });

  it('include and exclude can be combined', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    addTag('prod', 'DB_HOST', 'infra', tmp);
    addTag('prod', 'PORT', 'critical', tmp);
    const result = filterDriftByTags(entries, 'prod', { include: ['critical'], exclude: ['infra'] }, tmp);
    expect(result.map(e => e.key)).toEqual(['PORT']);
  });
});

describe('parseTagFilterArgs', () => {
  it('parses --tag-include', () => {
    const opts = parseTagFilterArgs(['--tag-include', 'critical,infra']);
    expect(opts.include).toEqual(['critical', 'infra']);
  });

  it('parses --tag-exclude', () => {
    const opts = parseTagFilterArgs(['--tag-exclude', 'secret']);
    expect(opts.exclude).toEqual(['secret']);
  });

  it('returns empty opts for no args', () => {
    expect(parseTagFilterArgs([])).toEqual({});
  });
});
