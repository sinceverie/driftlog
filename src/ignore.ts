import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const IGNORE_FILENAME = '.driftignore';

/**
 * Parse a .driftignore file into an array of glob/key patterns.
 * Lines starting with '#' or empty lines are ignored.
 */
export function parseIgnoreFile(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/**
 * Locate a .driftignore file by searching cwd, then home directory.
 * Returns null if none found.
 */
export function findIgnoreFile(cwd: string = process.cwd()): string | null {
  const local = path.join(cwd, IGNORE_FILENAME);
  if (fs.existsSync(local)) return local;

  const home = path.join(os.homedir(), IGNORE_FILENAME);
  if (fs.existsSync(home)) return home;

  return null;
}

/**
 * Load ignore patterns from the first .driftignore file found.
 * Returns an empty array if no file is found.
 */
export function loadIgnorePatterns(cwd: string = process.cwd()): string[] {
  const filePath = findIgnoreFile(cwd);
  if (!filePath) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseIgnoreFile(content);
}

/**
 * Check whether a given key matches any ignore pattern.
 * Supports exact matches and trailing wildcard (e.g. "AWS_*").
 */
export function isIgnored(key: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return key.startsWith(prefix);
    }
    return key === pattern;
  });
}

/**
 * Filter a drift record object, removing keys that match ignore patterns.
 */
export function applyIgnore(
  drift: Record<string, unknown>,
  patterns: string[]
): Record<string, unknown> {
  if (patterns.length === 0) return drift;
  return Object.fromEntries(
    Object.entries(drift).filter(([key]) => !isIgnored(key, patterns))
  );
}
