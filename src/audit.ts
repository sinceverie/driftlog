import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  timestamp: string;
  command: string;
  files: string[];
  driftDetected: boolean;
  keysChanged: number;
}

export function getAuditDir(): string {
  return path.join(os.homedir(), '.driftlog', 'audit');
}

export function getAuditPath(): string {
  return path.join(getAuditDir(), 'audit.log');
}

export function appendAuditEntry(entry: AuditEntry): void {
  const dir = getAuditDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(getAuditPath(), line, 'utf-8');
}

export function loadAuditLog(): AuditEntry[] {
  const filePath = getAuditPath();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  if (!raw) return [];
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditEntry);
}

export function clearAuditLog(): void {
  const filePath = getAuditPath();
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf-8');
  }
}

export function buildAuditEntry(
  command: string,
  files: string[],
  driftDetected: boolean,
  keysChanged: number
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    command,
    files,
    driftDetected,
    keysChanged,
  };
}
