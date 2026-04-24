#!/usr/bin/env node
import * as path from 'path';
import { parseConfigFile } from './parser';
import { computeDrift } from './differ';
import { generateReport, ReportFormat } from './reporter';

function usage(): void {
  console.error('Usage: driftlog <base-file> <target-file> [--format text|json] [--verbose]');
  process.exit(1);
}

function parseArgs(argv: string[]): {
  baseFile: string;
  targetFile: string;
  format: ReportFormat;
  verbose: boolean;
} {
  const args = argv.slice(2);
  if (args.length < 2) usage();

  const baseFile = args[0];
  const targetFile = args[1];
  let format: ReportFormat = 'text';
  let verbose = false;

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      const f = args[++i];
      if (f !== 'text' && f !== 'json') {
        console.error(`Unknown format: ${f}. Use 'text' or 'json'.`);
        process.exit(1);
      }
      format = f;
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else {
      console.error(`Unknown argument: ${args[i]}`);
      usage();
    }
  }

  return { baseFile, targetFile, format, verbose };
}

async function main(): Promise<void> {
  const { baseFile, targetFile, format, verbose } = parseArgs(process.argv);

  let base: Record<string, string>;
  let target: Record<string, string>;

  try {
    base = parseConfigFile(path.resolve(baseFile));
  } catch (err) {
    console.error(`Failed to parse base file "${baseFile}": ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    target = parseConfigFile(path.resolve(targetFile));
  } catch (err) {
    console.error(`Failed to parse target file "${targetFile}": ${(err as Error).message}`);
    process.exit(1);
  }

  const drifts = computeDrift(base, target);
  const report = generateReport(drifts, baseFile, targetFile, { format, verbose });

  process.stdout.write(report);
  process.exit(drifts.length > 0 ? 1 : 0);
}

main();
