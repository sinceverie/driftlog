import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getTagPath,
  saveTags,
  loadTags,
  addTag,
  removeTag,
  listTaggedKeys,
  listAllTags,
} from '../tag';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-tag-'));
}

describe('tag', () => {
  let tmp: string;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns empty map when no file exists', () => {
    expect(loadTags('prod', tmp)).toEqual({});
  });

  it('saves and loads tags', () => {
    saveTags('prod', { DB_HOST: ['critical', 'infra'] }, tmp);
    expect(loadTags('prod', tmp)).toEqual({ DB_HOST: ['critical', 'infra'] });
  });

  it('addTag adds a new tag to a key', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    const tags = loadTags('prod', tmp);
    expect(tags['DB_HOST']).toContain('critical');
  });

  it('addTag does not duplicate tags', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    addTag('prod', 'DB_HOST', 'critical', tmp);
    expect(loadTags('prod', tmp)['DB_HOST']).toHaveLength(1);
  });

  it('removeTag removes a tag', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    addTag('prod', 'DB_HOST', 'infra', tmp);
    removeTag('prod', 'DB_HOST', 'critical', tmp);
    const tags = loadTags('prod', tmp);
    expect(tags['DB_HOST']).not.toContain('critical');
    expect(tags['DB_HOST']).toContain('infra');
  });

  it('removeTag deletes key when no tags remain', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    removeTag('prod', 'DB_HOST', 'critical', tmp);
    expect(loadTags('prod', tmp)['DB_HOST']).toBeUndefined();
  });

  it('listTaggedKeys returns keys with given tag', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    addTag('prod', 'API_KEY', 'secret', tmp);
    expect(listTaggedKeys('prod', 'critical', tmp)).toEqual(['DB_HOST']);
  });

  it('listAllTags returns all unique tags sorted', () => {
    addTag('prod', 'DB_HOST', 'critical', tmp);
    addTag('prod', 'API_KEY', 'secret', tmp);
    addTag('prod', 'PORT', 'critical', tmp);
    expect(listAllTags('prod', tmp)).toEqual(['critical', 'secret']);
  });
});
