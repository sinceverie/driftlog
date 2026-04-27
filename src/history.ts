import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface HistoryEntry {
  timestamp: string;
  command: string;
  files: string[];
  driftCount: number;
  summary: string;
}

export function getHistoryDir(): string {
  return path.join(os.homedir(), ".driftlog", "history");
}

export function getHistoryPath(): string {
  return path.join(getHistoryDir(), "history.json");
}

export function ensureHistoryDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function appendHistoryEntry(entry: HistoryEntry, dir?: string): void {
  const histDir = dir ?? getHistoryDir();
  ensureHistoryDir(histDir);
  const filePath = path.join(histDir, "history.json");
  const existing = loadHistory(histDir);
  existing.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
}

export function loadHistory(dir?: string): HistoryEntry[] {
  const histDir = dir ?? getHistoryDir();
  const filePath = path.join(histDir, "history.json");
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function clearHistory(dir?: string): void {
  const histDir = dir ?? getHistoryDir();
  const filePath = path.join(histDir, "history.json");
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

export function formatHistoryEntry(entry: HistoryEntry): string {
  const files = entry.files.join(", ");
  return `[${entry.timestamp}] ${entry.command} | files: ${files} | drift: ${entry.driftCount} | ${entry.summary}`;
}

export function buildHistoryEntry(
  command: string,
  files: string[],
  driftCount: number,
  summary: string
): HistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    command,
    files,
    driftCount,
    summary,
  };
}
