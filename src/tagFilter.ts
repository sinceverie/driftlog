import { DriftEntry } from './differ';
import { loadTags, TagMap } from './tag';

export interface TagFilterOptions {
  include?: string[];
  exclude?: string[];
}

export function filterDriftByTags(
  entries: DriftEntry[],
  label: string,
  opts: TagFilterOptions,
  base?: string
): DriftEntry[] {
  const tags: TagMap = loadTags(label, base);

  return entries.filter(entry => {
    const keyTags = tags[entry.key] ?? [];

    if (opts.include && opts.include.length > 0) {
      const hasAll = opts.include.every(t => keyTags.includes(t));
      if (!hasAll) return false;
    }

    if (opts.exclude && opts.exclude.length > 0) {
      const hasAny = opts.exclude.some(t => keyTags.includes(t));
      if (hasAny) return false;
    }

    return true;
  });
}

export function parseTagFilterArgs(args: string[]): TagFilterOptions {
  const opts: TagFilterOptions = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tag-include' && args[i + 1]) {
      opts.include = args[++i].split(',').map(s => s.trim());
    } else if (args[i] === '--tag-exclude' && args[i + 1]) {
      opts.exclude = args[++i].split(',').map(s => s.trim());
    }
  }
  return opts;
}
