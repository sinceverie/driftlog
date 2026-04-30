import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  appendTimelineEntry,
  loadTimeline,
  filterTimeline,
  formatTimelineReport,
  getTimelinePath,
} from '../timeline';
import { DriftEntry } from '../differ';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-timeline-'));
}

const mockEntries: DriftEntry[] = [
  { key: 'PORT', kind: 'added', leftValue: undefined, rightValue: '3000' },
  { key: 'HOST', kind: 'changed', leftValue: 'localhost', rightValue: '0.0.0.0' },
  { key: 'OLD_KEY', kind: 'removed', leftValue: 'yes', rightValue: undefined },
];

test('appendTimelineEntry creates file and writes entry', () => {
  const tmp = makeTmpDir();
  appendTimelineEntry('staging', mockEntries, tmp);
  const file = getTimelinePath('staging', tmp);
  expect(fs.existsSync(file)).toBe(true);
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  expect(lines).toHaveLength(1);
  const parsed = JSON.parse(lines[0]);
  expect(parsed.label).toBe('staging');
  expect(parsed.added).toBe(1);
  expect(parsed.removed).toBe(1);
  expect(parsed.changed).toBe(1);
  expect(parsed.keys).toEqual(['PORT', 'HOST', 'OLD_KEY']);
});

test('loadTimeline returns all appended entries', () => {
  const tmp = makeTmpDir();
  appendTimelineEntry('prod', mockEntries, tmp);
  appendTimelineEntry('prod', mockEntries.slice(0, 1), tmp);
  const entries = loadTimeline('prod', tmp);
  expect(entries).toHaveLength(2);
});

test('loadTimeline returns empty array when file missing', () => {
  const tmp = makeTmpDir();
  expect(loadTimeline('nonexistent', tmp)).toEqual([]);
});

test('filterTimeline filters by since', () => {
  const tmp = makeTmpDir();
  appendTimelineEntry('env', mockEntries, tmp);
  const all = loadTimeline('env', tmp);
  const future = filterTimeline(all, { since: '2099-01-01T00:00:00.000Z' });
  expect(future).toHaveLength(0);
  const past = filterTimeline(all, { since: '2000-01-01T00:00:00.000Z' });
  expect(past).toHaveLength(1);
});

test('formatTimelineReport renders entries', () => {
  const tmp = makeTmpDir();
  appendTimelineEntry('dev', mockEntries, tmp);
  const entries = loadTimeline('dev', tmp);
  const report = formatTimelineReport(entries);
  expect(report).toContain('Timeline:');
  expect(report).toContain('dev');
  expect(report).toContain('+1 added');
  expect(report).toContain('-1 removed');
  expect(report).toContain('~1 changed');
});

test('formatTimelineReport handles empty list', () => {
  expect(formatTimelineReport([])).toContain('No timeline entries found.');
});
