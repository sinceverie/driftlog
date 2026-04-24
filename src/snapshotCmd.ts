import { loadConfig } from './loader';
import { saveSnapshot, loadSnapshot, listSnapshots } from './snapshot';
import { compareSnapshots, formatSnapshotComparisonText } from './snapshotDiff';

const SNAPSHOT_DIR = '.driftlog';

export function cmdSnapshot(label: string, filePath: string): void {
  const config = loadConfig(filePath, label);
  const savedPath = saveSnapshot(label, config, SNAPSHOT_DIR);
  console.log(`Snapshot saved: ${savedPath}`);
}

export function cmdSnapshotDiff(labelA: string, labelB: string): void {
  const snapA = loadSnapshot(labelA, SNAPSHOT_DIR);
  const snapB = loadSnapshot(labelB, SNAPSHOT_DIR);
  const comparison = compareSnapshots(snapA, snapB);
  console.log(formatSnapshotComparisonText(comparison));
  if (comparison.hasDrift) {
    process.exitCode = 1;
  }
}

export function cmdSnapshotList(): void {
  const snaps = listSnapshots(SNAPSHOT_DIR);
  if (snaps.length === 0) {
    console.log('No snapshots found. Run `driftlog snapshot <label> <file>` to create one.');
    return;
  }
  console.log('Saved snapshots:');
  for (const snap of snaps) {
    const keyCount = Object.keys(snap.config).length;
    console.log(`  ${snap.label.padEnd(20)} ${snap.timestamp}  (${keyCount} keys)`);
  }
}
