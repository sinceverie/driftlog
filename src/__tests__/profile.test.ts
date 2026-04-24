import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { saveProfile, loadProfile, listProfiles, deleteProfile, getProfileDir } from '../profile';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-profile-'));
}

describe('profile', () => {
  let origHome: string | undefined;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('saveProfile and loadProfile round-trip', () => {
    const profile = { name: 'staging', files: ['a.env', 'b.env'], labels: ['dev', 'staging'] };
    saveProfile('staging', profile);
    const loaded = loadProfile('staging');
    expect(loaded).toEqual(profile);
  });

  test('listProfiles returns saved profile names', () => {
    saveProfile('alpha', { name: 'alpha', files: ['x.env'] });
    saveProfile('beta', { name: 'beta', files: ['y.env'] });
    const list = listProfiles();
    expect(list).toContain('alpha');
    expect(list).toContain('beta');
  });

  test('listProfiles returns empty array when no profiles exist', () => {
    expect(listProfiles()).toEqual([]);
  });

  test('deleteProfile removes the profile file', () => {
    saveProfile('temp', { name: 'temp', files: ['z.env'] });
    deleteProfile('temp');
    expect(listProfiles()).not.toContain('temp');
  });

  test('loadProfile throws for missing profile', () => {
    expect(() => loadProfile('nonexistent')).toThrow("Profile 'nonexistent' not found.");
  });

  test('deleteProfile throws for missing profile', () => {
    expect(() => deleteProfile('ghost')).toThrow("Profile 'ghost' not found.");
  });
});
