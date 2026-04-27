import { DriftEntry } from './differ';

export interface PatchOperation {
  op: 'set' | 'unset' | 'rename';
  key: string;
  value?: string;
  newKey?: string;
}

export interface PatchResult {
  applied: PatchOperation[];
  skipped: PatchOperation[];
  output: Record<string, string>;
}

/**
 * Build a patch from drift entries that would make `source` match `target`.
 */
export function buildPatchFromDrift(entries: DriftEntry[]): PatchOperation[] {
  const ops: PatchOperation[] = [];

  for (const entry of entries) {
    if (entry.kind === 'missing') {
      // key exists in target but not source — set it
      ops.push({ op: 'set', key: entry.key, value: entry.targetValue ?? '' });
    } else if (entry.kind === 'extra') {
      // key exists in source but not target — unset it
      ops.push({ op: 'unset', key: entry.key });
    } else if (entry.kind === 'changed') {
      // value differs — set to target value
      ops.push({ op: 'set', key: entry.key, value: entry.targetValue ?? '' });
    }
  }

  return ops;
}

/**
 * Apply a list of patch operations to a config record.
 */
export function applyPatch(
  config: Record<string, string>,
  ops: PatchOperation[]
): PatchResult {
  const output: Record<string, string> = { ...config };
  const applied: PatchOperation[] = [];
  const skipped: PatchOperation[] = [];

  for (const op of ops) {
    if (op.op === 'set') {
      output[op.key] = op.value ?? '';
      applied.push(op);
    } else if (op.op === 'unset') {
      if (op.key in output) {
        delete output[op.key];
        applied.push(op);
      } else {
        skipped.push(op);
      }
    } else if (op.op === 'rename') {
      if (op.key in output && op.newKey) {
        output[op.newKey] = output[op.key];
        delete output[op.key];
        applied.push(op);
      } else {
        skipped.push(op);
      }
    }
  }

  return { applied, skipped, output };
}

/**
 * Format a human-readable summary of a patch result.
 */
export function formatPatchReport(result: PatchResult): string {
  const lines: string[] = [];
  lines.push(`Patch Summary: ${result.applied.length} applied, ${result.skipped.length} skipped`);

  if (result.applied.length > 0) {
    lines.push('\nApplied:');
    for (const op of result.applied) {
      if (op.op === 'set') lines.push(`  [set]    ${op.key} = ${op.value}`);
      else if (op.op === 'unset') lines.push(`  [unset]  ${op.key}`);
      else if (op.op === 'rename') lines.push(`  [rename] ${op.key} -> ${op.newKey}`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push('\nSkipped:');
    for (const op of result.skipped) {
      lines.push(`  [${op.op}] ${op.key} (key not found)`);
    }
  }

  return lines.join('\n');
}
