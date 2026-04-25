import { DriftEntry } from './differ';

export interface Annotation {
  key: string;
  note: string;
  author?: string;
  createdAt: string;
}

export interface AnnotationMap {
  [key: string]: Annotation;
}

/**
 * Parse annotation arguments of the form key="note" or key="note" --author=name
 */
export function parseAnnotationArgs(args: string[]): { key: string; note: string; author?: string } {
  const key = args[0];
  const note = args[1];
  if (!key || !note) {
    throw new Error('Usage: annotate <key> <note> [--author=<name>]');
  }
  const authorArg = args.find(a => a.startsWith('--author='));
  const author = authorArg ? authorArg.replace('--author=', '') : undefined;
  return { key, note, author };
}

/**
 * Attach annotations to drift entries, returning enriched objects.
 */
export function annotateDrift(
  entries: DriftEntry[],
  annotations: AnnotationMap
): Array<DriftEntry & { annotation?: Annotation }> {
  return entries.map(entry => {
    const annotation = annotations[entry.key];
    return annotation ? { ...entry, annotation } : entry;
  });
}

/**
 * Format annotated drift entries as human-readable text.
 */
export function formatAnnotatedReport(
  entries: Array<DriftEntry & { annotation?: Annotation }>
): string {
  if (entries.length === 0) return 'No drift detected.\n';
  const lines: string[] = ['Drift Report (with annotations):', ''];
  for (const entry of entries) {
    lines.push(`  [${entry.kind.toUpperCase()}] ${entry.key}`);
    if (entry.kind === 'changed') {
      lines.push(`    base: ${entry.baseValue}  →  compare: ${entry.compareValue}`);
    } else if (entry.kind === 'added') {
      lines.push(`    added: ${entry.compareValue}`);
    } else if (entry.kind === 'removed') {
      lines.push(`    removed: ${entry.baseValue}`);
    }
    if (entry.annotation) {
      const { note, author, createdAt } = entry.annotation;
      const who = author ? ` (${author})` : '';
      lines.push(`    📝 Note${who} [${createdAt}]: ${note}`);
    }
  }
  return lines.join('\n') + '\n';
}
