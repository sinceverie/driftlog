import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchConfigs } from '../watch';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-watch-'));
}

function writeTmp(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('watchConfigs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns a handle with a stop function', () => {
    const a = writeTmp(tmpDir, 'a.env', 'KEY=1\n');
    const b = writeTmp(tmpDir, 'b.env', 'KEY=1\n');
    const handle = watchConfigs({
      files: [a, b],
      format: 'text',
      interval: 50000,
    });
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });

  it('calls onDrift when a file changes and drift exists', (done) => {
    const a = writeTmp(tmpDir, 'a.env', 'KEY=original\n');
    const b = writeTmp(tmpDir, 'b.env', 'KEY=original\n');

    const handle = watchConfigs({
      files: [a, b],
      format: 'text',
      interval: 100,
      onDrift: (report) => {
        expect(report).toContain('KEY');
        handle.stop();
        done();
      },
    });

    setTimeout(() => {
      fs.writeFileSync(b, 'KEY=changed\n', 'utf8');
    }, 150);
  });

  it('does not call onDrift when files are identical', (done) => {
    const a = writeTmp(tmpDir, 'a.env', 'KEY=same\n');
    const b = writeTmp(tmpDir, 'b.env', 'KEY=same\n');
    let driftCalled = false;

    const handle = watchConfigs({
      files: [a, b],
      format: 'text',
      interval: 80,
      onDrift: () => { driftCalled = true; },
    });

    setTimeout(() => {
      handle.stop();
      expect(driftCalled).toBe(false);
      done();
    }, 400);
  });
});
