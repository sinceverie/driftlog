import * as fs from "fs";
import * as path from "path";
import { ConfigMap } from "./loader";

export interface BaselineEntry {
  label: string;
  timestamp: string;
  data: ConfigMap;
}

export interface BaselineStore {
  baselines: Record<string, BaselineEntry>;
}

export function getBaselineDir(): string {
  return path.resolve(process.cwd(), ".driftlog", "baselines");
}

export function getBaselinePath(name: string): string {
  return path.join(getBaselineDir(), `${name}.json`);
}

export function saveBaseline(name: string, label: string, data: ConfigMap): void {
  const dir = getBaselineDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const entry: BaselineEntry = {
    label,
    timestamp: new Date().toISOString(),
    data,
  };
  fs.writeFileSync(getBaselinePath(name), JSON.stringify(entry, null, 2), "utf-8");
}

export function loadBaseline(name: string): BaselineEntry | null {
  const filePath = getBaselinePath(name);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as BaselineEntry;
}

export function listBaselines(): string[] {
  const dir = getBaselineDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function deleteBaseline(name: string): boolean {
  const filePath = getBaselinePath(name);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}
