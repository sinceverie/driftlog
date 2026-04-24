import * as fs from 'fs';
import * as path from 'path';
import { ConfigMap } from './loader';

export interface Snapshot {
  label: string;
  timestamp: string;
  config: ConfigMap;
}

export interface SnapshotStore {
  snapshots: Snapshot[];
}

const DEFAULT_SNAPSHOT_DIR = '.driftlog';

export function getSnapshotPath(dir: string, label: string): string {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(dir, `${safe}.json`);
}

export function saveSnapshot(
  label: string,
  config: ConfigMap,
  snapshotDir: string = DEFAULT_SNAPSHOT_DIR
): string {
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
  const snapshot: Snapshot = {
    label,
    timestamp: new Date().toISOString(),
    config,
  };
  const filePath = getSnapshotPath(snapshotDir, label);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return filePath;
}

export function loadSnapshot(
  label: string,
  snapshotDir: string = DEFAULT_SNAPSHOT_DIR
): Snapshot {
  const filePath = getSnapshotPath(snapshotDir, label);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot not found for label "${label}" at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(snapshotDir: string = DEFAULT_SNAPSHOT_DIR): Snapshot[] {
  if (!fs.existsSync(snapshotDir)) return [];
  return fs
    .readdirSync(snapshotDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(snapshotDir, f), 'utf-8');
      return JSON.parse(raw) as Snapshot;
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
