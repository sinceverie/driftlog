import { loadAuditLog, clearAuditLog, AuditEntry } from './audit';

function formatEntry(entry: AuditEntry): string {
  const drift = entry.driftDetected ? `DRIFT (${entry.keysChanged} keys)` : 'clean';
  const files = entry.files.join(', ');
  return `[${entry.timestamp}] ${entry.command} | ${files} | ${drift}`;
}

export function cmdAuditList(args: string[]): void {
  const entries = loadAuditLog();
  if (entries.length === 0) {
    console.log('No audit entries found.');
    return;
  }
  const limit = args.includes('--last')
    ? parseInt(args[args.indexOf('--last') + 1] ?? '10', 10)
    : entries.length;
  const shown = entries.slice(-limit);
  shown.forEach((e) => console.log(formatEntry(e)));
}

export function cmdAuditClear(): void {
  clearAuditLog();
  console.log('Audit log cleared.');
}

export function cmdAuditJson(): void {
  const entries = loadAuditLog();
  console.log(JSON.stringify(entries, null, 2));
}

export function cmdAuditStats(): void {
  const entries = loadAuditLog();
  const total = entries.length;
  const drifted = entries.filter((e) => e.driftDetected).length;
  const totalKeys = entries.reduce((sum, e) => sum + e.keysChanged, 0);
  console.log(`Total runs : ${total}`);
  console.log(`Drift runs : ${drifted}`);
  console.log(`Keys changed (total): ${totalKeys}`);
}
