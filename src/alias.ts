import * as fs from 'fs';
import * as path from 'path';

export interface AliasMap {
  [alias: string]: string;
}

export function getAliasFile(dir: string = process.cwd()): string {
  return path.join(dir, '.driftlog', 'aliases.json');
}

export function loadAliases(dir?: string): AliasMap {
  const file = getAliasFile(dir);
  if (!fs.existsSync(file)) return {};
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as AliasMap;
  } catch {
    return {};
  }
}

export function saveAliases(aliases: AliasMap, dir?: string): void {
  const file = getAliasFile(dir);
  const dirPath = path.dirname(file);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(aliases, null, 2), 'utf-8');
}

export function addAlias(name: string, target: string, dir?: string): void {
  const aliases = loadAliases(dir);
  aliases[name] = target;
  saveAliases(aliases, dir);
}

export function removeAlias(name: string, dir?: string): boolean {
  const aliases = loadAliases(dir);
  if (!(name in aliases)) return false;
  delete aliases[name];
  saveAliases(aliases, dir);
  return true;
}

export function resolveAlias(nameOrPath: string, dir?: string): string {
  const aliases = loadAliases(dir);
  return aliases[nameOrPath] ?? nameOrPath;
}

export function listAliases(dir?: string): Array<{ name: string; target: string }> {
  const aliases = loadAliases(dir);
  return Object.entries(aliases).map(([name, target]) => ({ name, target }));
}
