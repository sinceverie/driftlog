import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { cmdIgnoreList, cmdIgnoreAdd, cmdIgnoreRemove } from '../ignoreCmd';
import { IGNORE_FILENAME } from '../ignore';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-ignorecmd-'));
}

describe('cmdIgnoreList', () => {
  it('prints patterns when .driftignore exists', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, IGNORE_FILENAME), 'FOO\nBAR_*\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdIgnoreList(dir);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2'));
    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });

  it('prints message when no file found', () => {
    const dir = makeTmpDir();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdIgnoreList(dir);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No ignore patterns'));
    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });
});

describe('cmdIgnoreAdd', () => {
  it('creates .driftignore and adds patterns', () => {
    const dir = makeTmpDir();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdIgnoreAdd(['SECRET', 'AWS_*'], dir);
    const content = fs.readFileSync(path.join(dir, IGNORE_FILENAME), 'utf-8');
    expect(content).toContain('SECRET');
    expect(content).toContain('AWS_*');
    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });

  it('does not duplicate existing patterns', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, IGNORE_FILENAME), 'SECRET\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdIgnoreAdd(['SECRET'], dir);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('already present'));
    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });
});

describe('cmdIgnoreRemove', () => {
  it('removes specified patterns from .driftignore', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, IGNORE_FILENAME), 'SECRET\nAWS_*\nPORT\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdIgnoreRemove(['SECRET', 'PORT'], dir);
    const content = fs.readFileSync(path.join(dir, IGNORE_FILENAME), 'utf-8');
    expect(content).not.toContain('SECRET');
    expect(content).not.toContain('PORT');
    expect(content).toContain('AWS_*');
    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });

  it('reports when no patterns matched', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, IGNORE_FILENAME), 'FOO\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    cmdIgnoreRemove(['NONEXISTENT'], dir);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('None of the specified'));
    spy.mockRestore();
    fs.rmSync(dir, { recursive: true });
  });
});
