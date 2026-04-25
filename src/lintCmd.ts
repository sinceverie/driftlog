import * as fs from 'fs';
import * as path from 'path';
import { parseConfigFile } from './parser';
import { lintConfig, formatLintReport, parseLintRules, LintRule } from './lint';

export function cmdLint(args: string[]): void {
  const files = args.filter(a => !a.startsWith('--'));
  if (files.length === 0) {
    console.error('Usage: driftlog lint <file> [file2 ...] [--lint-rules=rule1,rule2]');
    console.error('Available rules: no-empty-values, no-numeric-strings, no-duplicate-keys, require-uppercase-keys');
    process.exit(1);
  }

  const rules: LintRule[] = parseLintRules(args);
  const jsonFlag = args.includes('--json');
  let totalViolations = 0;
  const allResults: Record<string, ReturnType<typeof lintConfig>> = {};

  for (const file of files) {
    const resolved = path.resolve(file);
    if (!fs.existsSync(resolved)) {
      console.error(`File not found: ${resolved}`);
      process.exit(1);
    }

    let config: Record<string, string>;
    try {
      config = parseConfigFile(resolved);
    } catch (e: any) {
      console.error(`Failed to parse ${file}: ${e.message}`);
      process.exit(1);
    }

    const violations = lintConfig(config, rules);
    totalViolations += violations.length;
    allResults[file] = violations;

    if (!jsonFlag) {
      console.log(`--- ${file} ---`);
      console.log(formatLintReport(violations));
    }
  }

  if (jsonFlag) {
    console.log(JSON.stringify(allResults, null, 2));
  } else {
    console.log(`Total violations: ${totalViolations}`);
  }

  if (totalViolations > 0) process.exit(1);
}
