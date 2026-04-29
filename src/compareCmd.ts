import * as path from 'path';
import { loadConfigs } from './loader';
import { computeDrift } from './differ';
import { buildCompareTable, formatCompareTable, CompareOptions } from './compare';

export interface CompareArgs {
  files: string[];
  showEqual: boolean;
  onlyKeys: string[];
  json: boolean;
}

export function parseCompareArgs(argv: string[]): CompareArgs {
  const args: CompareArgs = { files: [], showEqual: false, onlyKeys: [], json: false };
  const rest = argv.slice();

  while (rest.length) {
    const arg = rest.shift()!;
    if (arg === '--show-equal') {
      args.showEqual = true;
    } else if (arg === '--keys' && rest.length) {
      args.onlyKeys = rest.shift()!.split(',').map((k) => k.trim());
    } else if (arg === '--json') {
      args.json = true;
    } else {
      args.files.push(arg);
    }
  }

  return args;
}

export async function cmdCompare(argv: string[]): Promise<void> {
  const args = parseCompareArgs(argv);

  if (args.files.length !== 2) {
    console.error('Usage: driftlog compare <file1> <file2> [--show-equal] [--keys k1,k2] [--json]');
    process.exit(1);
  }

  const [left, right] = await loadConfigs(args.files);
  const entries = computeDrift(left.data, right.data);

  const labels: [string, string] = [
    path.basename(args.files[0]),
    path.basename(args.files[1]),
  ];

  const opts: CompareOptions = {
    labels,
    showEqual: args.showEqual,
    onlyKeys: args.onlyKeys.length ? args.onlyKeys : undefined,
  };

  const rows = buildCompareTable(entries, left.data, right.data, opts);

  if (args.json) {
    console.log(JSON.stringify({ labels, rows }, null, 2));
  } else {
    console.log(formatCompareTable(rows, labels));
  }
}
