import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseIgnoreFile,
  findIgnoreFile,
  loadIgnorePatterns,
  isIgnored,
  applyIgnore,
  IGNORE_FILENAME,
} from '../ignore';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-ignore-'));
}

describe('parseIgnoreFile', () => {
  it('parses patterns, ignoring comments and blank lines', () => {
    const content = `# comment\nDB_PASSWORD\n\nAWS_*\n  SECRET_KEY  `;
    expect(parseIgnoreFile(content)).toEqual(['DB_PASSWORD', 'AWS_*', 'SECRET_KEY']);
  });

  it('returns empty array for empty content', () => {
    expect(parseIgnoreFile('')).toEqual([]);
  });
});

describe('findIgnoreFile', () => {
  it('returns local .driftignore path when it exists', () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, IGNORE_FILENAME);
    fs.writeFileSync(filePath, 'SOME_KEY\n');
    expect(findIgnoreFile(dir)).toBe(filePath);
    fs.rmSync(dir, { recursive: true });
  });

  it('returns null when no .driftignore exists', () => {
    const dir = makeTmpDir();
    expect(findIgnoreFile(dir)).toBeNull();
    fs.rmSync(dir, { recursive: true });
  });
});

describe('loadIgnorePatterns', () => {
  it('loads patterns from .driftignore in cwd', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, IGNORE_FILENAME), 'FOO\nBAR_*\n');
    const patterns = loadIgnorePatterns(dir);
    expect(patterns).toEqual(['FOO', 'BAR_*']);
    fs.rmSync(dir, { recursive: true });
  });

  it('returns empty array when no file found', () => {
    const dir = makeTmpDir();
    expect(loadIgnorePatterns(dir)).toEqual([]);
    fs.rmSync(dir, { recursive: true });
  });
});

describe('isIgnored', () => {
  it('matches exact key', () => {
    expect(isIgnored('DB_PASSWORD', ['DB_PASSWORD', 'FOO'])).toBe(true);
  });

  it('matches wildcard prefix', () => {
    expect(isIgnored('AWS_SECRET', ['AWS_*'])).toBe(true);
    expect(isIgnored('GCP_SECRET', ['AWS_*'])).toBe(false);
  });

  it('returns false when no patterns match', () => {
    expect(isIgnored('SAFE_KEY', ['DB_*', 'SECRET'])).toBe(false);
  });
});

describe('applyIgnore', () => {
  it('removes ignored keys from drift record', () => {
    const drift = { DB_PASS: 'x', AWS_KEY: 'y', PORT: 'z' };
    const result = applyIgnore(drift, ['DB_PASS', 'AWS_*']);
    expect(result).toEqual({ PORT: 'z' });
  });

  it('returns original object when no patterns', () => {
    const drift = { A: '1', B: '2' };
    expect(applyIgnore(drift, [])).toEqual(drift);
  });
});
