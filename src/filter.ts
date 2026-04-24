/**
 * filter.ts
 * Utilities for filtering drift results by key patterns or drift kind.
 */

import { DriftResult, DriftKind } from './differ';

export interface FilterOptions {
  include?: string[];   // glob-style prefixes/substrings to include
  exclude?: string[];   // glob-style prefixes/substrings to exclude
  kinds?: DriftKind[];  // only show these drift kinds
}

/**
 * Returns true if the key matches any of the given patterns.
 * Supports simple wildcard '*' at end of pattern.
 */
export function matchesPattern(key: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    return key.startsWith(pattern.slice(0, -1));
  }
  return key === pattern || key.includes(pattern);
}

/**
 * Filter a list of DriftResult entries according to FilterOptions.
 */
export function filterDrift(
  results: DriftResult[],
  options: FilterOptions
): DriftResult[] {
  return results.filter((entry) => {
    // Kind filter
    if (options.kinds && options.kinds.length > 0) {
      if (!options.kinds.includes(entry.kind)) return false;
    }

    // Exclude filter (exclude takes precedence)
    if (options.exclude && options.exclude.length > 0) {
      if (options.exclude.some((pat) => matchesPattern(entry.key, pat))) {
        return false;
      }
    }

    // Include filter
    if (options.include && options.include.length > 0) {
      if (!options.include.some((pat) => matchesPattern(entry.key, pat))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Parse filter flags from CLI args into a FilterOptions object.
 * Expects flags like: --include=DB_* --exclude=SECRET* --kinds=changed,added
 */
export function parseFilterArgs(args: string[]): FilterOptions {
  const opts: FilterOptions = {};

  for (const arg of args) {
    if (arg.startsWith('--include=')) {
      opts.include = arg.slice('--include='.length).split(',').filter(Boolean);
    } else if (arg.startsWith('--exclude=')) {
      opts.exclude = arg.slice('--exclude='.length).split(',').filter(Boolean);
    } else if (arg.startsWith('--kinds=')) {
      opts.kinds = arg.slice('--kinds='.length).split(',').filter(Boolean) as DriftKind[];
    }
  }

  return opts;
}
