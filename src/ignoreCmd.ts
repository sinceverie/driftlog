import * as fs from 'fs';
import * as path from 'path';
import { IGNORE_FILENAME, loadIgnorePatterns, parseIgnoreFile } from './ignore';

/**
 * Show current ignore patterns loaded from .driftignore.
 */
export function cmdIgnoreList(cwd: string = process.cwd()): void {
  const patterns = loadIgnorePatterns(cwd);
  if (patterns.length === 0) {
    console.log('No ignore patterns found. Create a .driftignore file to get started.');
    return;
  }
  console.log(`Ignore patterns (${patterns.length}):`);
  patterns.forEach((p) => console.log(`  ${p}`));
}

/**
 * Add one or more patterns to the local .driftignore file.
 */
export function cmdIgnoreAdd(patterns: string[], cwd: string = process.cwd()): void {
  if (patterns.length === 0) {
    console.error('Usage: driftlog ignore add <pattern> [pattern...]');
    process.exit(1);
  }
  const filePath = path.join(cwd, IGNORE_FILENAME);
  const existing = fs.existsSync(filePath)
    ? parseIgnoreFile(fs.readFileSync(filePath, 'utf-8'))
    : [];

  const toAdd = patterns.filter((p) => !existing.includes(p));
  if (toAdd.length === 0) {
    console.log('All patterns already present in .driftignore.');
    return;
  }

  const newContent = [...existing, ...toAdd].join('\n') + '\n';
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`Added ${toAdd.length} pattern(s) to ${filePath}:`);
  toAdd.forEach((p) => console.log(`  + ${p}`));
}

/**
 * Remove one or more patterns from the local .driftignore file.
 */
export function cmdIgnoreRemove(patterns: string[], cwd: string = process.cwd()): void {
  if (patterns.length === 0) {
    console.error('Usage: driftlog ignore remove <pattern> [pattern...]');
    process.exit(1);
  }
  const filePath = path.join(cwd, IGNORE_FILENAME);
  if (!fs.existsSync(filePath)) {
    console.log('No .driftignore file found.');
    return;
  }
  const existing = parseIgnoreFile(fs.readFileSync(filePath, 'utf-8'));
  const remaining = existing.filter((p) => !patterns.includes(p));
  const removed = existing.length - remaining.length;

  if (removed === 0) {
    console.log('None of the specified patterns were found in .driftignore.');
    return;
  }

  fs.writeFileSync(filePath, remaining.join('\n') + (remaining.length ? '\n' : ''), 'utf-8');
  console.log(`Removed ${removed} pattern(s) from ${filePath}.`);
}
