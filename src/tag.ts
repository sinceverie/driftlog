import * as fs from 'fs';
import * as path from 'path';

export interface TagEntry {
  key: string;
  tags: string[];
}

export interface TagMap {
  [key: string]: string[];
}

export function getTagDir(base = process.env.HOME || '.'): string {
  return path.join(base, '.driftlog', 'tags');
}

export function getTagPath(label: string, base?: string): string {
  return path.join(getTagDir(base), `${label}.json`);
}

export function saveTags(label: string, tags: TagMap, base?: string): void {
  const dir = getTagDir(base);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getTagPath(label, base), JSON.stringify(tags, null, 2), 'utf-8');
}

export function loadTags(label: string, base?: string): TagMap {
  const p = getTagPath(label, base);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as TagMap;
  } catch (err) {
    throw new Error(`Failed to parse tag file for label "${label}": ${(err as Error).message}`);
  }
}

export function addTag(label: string, key: string, tag: string, base?: string): TagMap {
  const tags = loadTags(label, base);
  if (!tags[key]) tags[key] = [];
  if (!tags[key].includes(tag)) tags[key].push(tag);
  saveTags(label, tags, base);
  return tags;
}

export function removeTag(label: string, key: string, tag: string, base?: string): TagMap {
  const tags = loadTags(label, base);
  if (tags[key]) {
    tags[key] = tags[key].filter(t => t !== tag);
    if (tags[key].length === 0) delete tags[key];
  }
  saveTags(label, tags, base);
  return tags;
}

export function listTaggedKeys(label: string, tag: string, base?: string): string[] {
  const tags = loadTags(label, base);
  return Object.entries(tags)
    .filter(([, v]) => v.includes(tag))
    .map(([k]) => k);
}

export function listAllTags(label: string, base?: string): string[] {
  const tags = loadTags(label, base);
  const set = new Set<string>();
  for (const arr of Object.values(tags)) arr.forEach(t => set.add(t));
  return [...set].sort();
}
