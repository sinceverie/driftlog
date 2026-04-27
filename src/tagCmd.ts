import { DriftEntry } from './differ';
import { addTag, removeTag, loadTags, listTaggedKeys, listAllTags } from './tag';

export function cmdTagAdd(
  label: string,
  key: string,
  tag: string,
  base?: string
): void {
  addTag(label, key, tag, base);
  console.log(`Tagged '${key}' with '${tag}' in [${label}]`);
}

export function cmdTagRemove(
  label: string,
  key: string,
  tag: string,
  base?: string
): void {
  removeTag(label, key, tag, base);
  console.log(`Removed tag '${tag}' from '${key}' in [${label}]`);
}

export function cmdTagList(label: string, base?: string): void {
  const all = listAllTags(label, base);
  if (all.length === 0) {
    console.log(`No tags found for [${label}]`);
    return;
  }
  console.log(`Tags in [${label}]:`);
  all.forEach(t => console.log(`  - ${t}`));
}

export function cmdTagShow(label: string, tag: string, base?: string): void {
  const keys = listTaggedKeys(label, tag, base);
  if (keys.length === 0) {
    console.log(`No keys tagged '${tag}' in [${label}]`);
    return;
  }
  console.log(`Keys tagged '${tag}' in [${label}]:`);
  keys.forEach(k => console.log(`  ${k}`));
}

export function cmdTagDump(label: string, base?: string): void {
  const tags = loadTags(label, base);
  const entries = Object.entries(tags);
  if (entries.length === 0) {
    console.log(`No tag assignments for [${label}]`);
    return;
  }
  entries.forEach(([key, ts]) => {
    console.log(`  ${key}: ${ts.join(', ')}`);
  });
}
