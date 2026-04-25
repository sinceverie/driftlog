import * as fs from 'fs';
import * as path from 'path';

export interface EnvGroup {
  name: string;
  files: string[];
}

export interface EnvGroupConfig {
  groups: EnvGroup[];
}

const ENV_GROUP_FILE = '.driftlog-groups.json';

export function getEnvGroupFile(dir: string = process.cwd()): string {
  return path.join(dir, ENV_GROUP_FILE);
}

export function saveEnvGroups(groups: EnvGroup[], dir: string = process.cwd()): void {
  const filePath = getEnvGroupFile(dir);
  const config: EnvGroupConfig = { groups };
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

export function loadEnvGroups(dir: string = process.cwd()): EnvGroup[] {
  const filePath = getEnvGroupFile(dir);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const config: EnvGroupConfig = JSON.parse(raw);
  return config.groups ?? [];
}

export function findGroup(name: string, dir: string = process.cwd()): EnvGroup | undefined {
  return loadEnvGroups(dir).find(g => g.name === name);
}

export function addEnvGroup(name: string, files: string[], dir: string = process.cwd()): void {
  const groups = loadEnvGroups(dir).filter(g => g.name !== name);
  groups.push({ name, files });
  saveEnvGroups(groups, dir);
}

export function removeEnvGroup(name: string, dir: string = process.cwd()): boolean {
  const groups = loadEnvGroups(dir);
  const filtered = groups.filter(g => g.name !== name);
  if (filtered.length === groups.length) return false;
  saveEnvGroups(filtered, dir);
  return true;
}

export function listEnvGroups(dir: string = process.cwd()): string[] {
  return loadEnvGroups(dir).map(g => g.name);
}
