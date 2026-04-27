import { buildPayload, severityRank, notify, NotifyOptions } from '../notify';
import { DriftEntry } from '../differ';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function makeEntries(n: number, kind: DriftEntry['kind'] = 'changed'): DriftEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    key: `KEY_${i}`,
    kind,
    left: 'a',
    right: 'b',
  }));
}

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-notify-'));
}

describe('buildPayload', () => {
  it('includes timestamp and totalDrift', () => {
    const entries = makeEntries(3);
    const p = buildPayload(entries);
    expect(p.totalDrift).toBe(3);
    expect(p.entries).toHaveLength(3);
    expect(typeof p.timestamp).toBe('string');
  });

  it('sets severity based on entries', () => {
    const p = buildPayload(makeEntries(0));
    expect(p.severity).toBe('low');
  });
});

describe('severityRank', () => {
  it('ranks high > medium > low', () => {
    expect(severityRank('high')).toBeGreaterThan(severityRank('medium'));
    expect(severityRank('medium')).toBeGreaterThan(severityRank('low'));
  });
});

describe('notify console channel', () => {
  it('logs to console for console channel', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await notify(makeEntries(1), { channel: 'console' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('notify file channel', () => {
  it('writes JSON payload to file', async () => {
    const dir = makeTmpDir();
    const dest = path.join(dir, 'out.json');
    await notify(makeEntries(2), { channel: 'file', outputFile: dest });
    const raw = fs.readFileSync(dest, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.totalDrift).toBe(2);
    expect(Array.isArray(parsed.entries)).toBe(true);
  });

  it('respects minSeverity and skips when below threshold', async () => {
    const dir = makeTmpDir();
    const dest = path.join(dir, 'out2.json');
    await notify(makeEntries(1), { channel: 'file', outputFile: dest, minSeverity: 'high' });
    expect(fs.existsSync(dest)).toBe(false);
  });
});

describe('notify webhook channel', () => {
  it('throws when webhookUrl is missing', async () => {
    await expect(notify(makeEntries(1), { channel: 'webhook' })).rejects.toThrow('webhookUrl required');
  });
});
