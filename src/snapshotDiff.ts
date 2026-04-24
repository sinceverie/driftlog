import { Snapshot } from './snapshot';
import { computeDrift, hasDrift, DriftResult } from './differ';

export interface SnapshotComparison {
  fromLabel: string;
  fromTimestamp: string;
  toLabel: string;
  toTimestamp: string;
  drift: DriftResult;
  hasDrift: boolean;
}

export function compareSnapshots(
  from: Snapshot,
  to: Snapshot
): SnapshotComparison {
  const drift = computeDrift(from.config, to.config);
  return {
    fromLabel: from.label,
    fromTimestamp: from.timestamp,
    toLabel: to.label,
    toTimestamp: to.timestamp,
    drift,
    hasDrift: hasDrift(drift),
  };
}

export function formatSnapshotComparisonText(
  comparison: SnapshotComparison
): string {
  const lines: string[] = [];
  lines.push(
    `Snapshot diff: ${comparison.fromLabel} (${comparison.fromTimestamp}) → ${comparison.toLabel} (${comparison.toTimestamp})`
  );
  if (!comparison.hasDrift) {
    lines.push('No drift detected between snapshots.');
    return lines.join('\n');
  }
  for (const [key, entry] of Object.entries(comparison.drift)) {
    if (entry.kind === 'added') {
      lines.push(`  + ${key}: ${entry.to}`);
    } else if (entry.kind === 'removed') {
      lines.push(`  - ${key}: ${entry.from}`);
    } else if (entry.kind === 'changed') {
      lines.push(`  ~ ${key}: ${entry.from} → ${entry.to}`);
    }
  }
  return lines.join('\n');
}
