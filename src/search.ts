/**
 * search.ts
 * Full-text search across drift entries, snapshots, and baselines.
 * Supports key/value pattern matching with optional filters.
 */

import { DriftEntry } from "./differ";

export interface SearchOptions {
  /** Search in keys */
  keys?: boolean;
  /** Search in values */
  values?: boolean;
  /** Case-sensitive match */
  caseSensitive?: boolean;
  /** Only return entries of a specific kind */
  kind?: "added" | "removed" | "changed" | "unchanged";
}

export interface SearchResult {
  entry: DriftEntry;
  matchedOn: "key" | "value" | "both";
}

/**
 * Normalize a string for comparison based on case sensitivity option.
 */
function normalize(str: string, caseSensitive: boolean): string {
  return caseSensitive ? str : str.toLowerCase();
}

/**
 * Search drift entries for a given query string.
 * By default searches both keys and values, case-insensitively.
 */
export function searchDrift(
  entries: DriftEntry[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    keys = true,
    values = true,
    caseSensitive = false,
    kind,
  } = options;

  const normalizedQuery = normalize(query, caseSensitive);
  const results: SearchResult[] = [];

  for (const entry of entries) {
    if (kind && entry.kind !== kind) continue;

    const keyMatch =
      keys && normalize(entry.key, caseSensitive).includes(normalizedQuery);

    const baseVal = entry.base !== undefined ? String(entry.base) : "";
    const headVal = entry.head !== undefined ? String(entry.head) : "";
    const valueMatch =
      values &&
      (normalize(baseVal, caseSensitive).includes(normalizedQuery) ||
        normalize(headVal, caseSensitive).includes(normalizedQuery));

    if (keyMatch && valueMatch) {
      results.push({ entry, matchedOn: "both" });
    } else if (keyMatch) {
      results.push({ entry, matchedOn: "key" });
    } else if (valueMatch) {
      results.push({ entry, matchedOn: "value" });
    }
  }

  return results;
}

/**
 * Format search results as a human-readable text block.
 */
export function formatSearchResults(
  results: SearchResult[],
  query: string
): string {
  if (results.length === 0) {
    return `No results found for "${query}".\n`;
  }

  const lines: string[] = [
    `Found ${results.length} result(s) for "${query}":`,
    "",
  ];

  for (const { entry, matchedOn } of results) {
    const kind = entry.kind.toUpperCase().padEnd(9);
    const base =
      entry.base !== undefined ? String(entry.base) : "(none)";
    const head =
      entry.head !== undefined ? String(entry.head) : "(none)";
    lines.push(`  [${kind}] ${entry.key}  (matched: ${matchedOn})`);
    if (entry.kind === "changed") {
      lines.push(`           base: ${base}`);
      lines.push(`           head: ${head}`);
    } else if (entry.kind === "added") {
      lines.push(`           value: ${head}`);
    } else if (entry.kind === "removed") {
      lines.push(`           value: ${base}`);
    }
  }

  return lines.join("\n") + "\n";
}

/**
 * Parse CLI args for search command.
 * Expected: --query <q> [--keys-only] [--values-only] [--case-sensitive] [--kind <kind>]
 */
export function parseSearchArgs(argv: string[]): {
  query: string;
  options: SearchOptions;
} {
  let query = "";
  const options: SearchOptions = { keys: true, values: true };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--query" || arg === "-q") && argv[i + 1]) {
      query = argv[++i];
    } else if (arg === "--keys-only") {
      options.keys = true;
      options.values = false;
    } else if (arg === "--values-only") {
      options.keys = false;
      options.values = true;
    } else if (arg === "--case-sensitive") {
      options.caseSensitive = true;
    } else if (arg === "--kind" && argv[i + 1]) {
      options.kind = argv[++i] as SearchOptions["kind"];
    }
  }

  return { query, options };
}
