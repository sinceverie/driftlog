import { loadConfigs } from './loader';
import { computeDrift } from './differ';
import { buildFullReport, writeFullReport, ReportOptions } from './report';
import { applyIgnore, loadIgnorePatterns } from './ignore';
import { applyTransforms, parseTransformArgs } from './transform';

export interface ReportArgs {
  files: string[];
  format: 'text' | 'markdown' | 'json';
  output?: string;
  suggestions: boolean;
  score: boolean;
  ignore: boolean;
  transforms: string[];
}

export function parseReportArgs(argv: string[]): ReportArgs {
  const args: ReportArgs = {
    files: [],
    format: 'text',
    output: undefined,
    suggestions: false,
    score: false,
    ignore: true,
    transforms: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--format' || a === '-f') args.format = argv[++i] as ReportArgs['format'];
    else if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--suggestions') args.suggestions = true;
    else if (a === '--score') args.score = true;
    else if (a === '--no-ignore') args.ignore = false;
    else if (a === '--transform') args.transforms.push(argv[++i]);
    else args.files.push(a);
  }
  return args;
}

export async function cmdReport(argv: string[]): Promise<void> {
  const args = parseReportArgs(argv);
  if (args.files.length < 2) {
    console.error('Usage: driftlog report <file1> <file2> [options]');
    process.exit(1);
  }

  const configs = await loadConfigs(args.files);
  const [a, b] = configs;
  let entries = computeDrift(a.data, b.data);

  if (args.ignore) {
    const patterns = loadIgnorePatterns(process.cwd());
    entries = applyIgnore(entries, patterns);
  }

  if (args.transforms.length > 0) {
    const transforms = parseTransformArgs(args.transforms);
    entries = entries.map(e => ({
      ...e,
      valueA: applyTransforms(e.key, e.valueA, transforms),
      valueB: applyTransforms(e.key, e.valueB, transforms),
    }));
  }

  const opts: ReportOptions = {
    format: args.format,
    includeSuggestions: args.suggestions,
    includeScore: args.score,
    outputPath: args.output,
  };

  const report = buildFullReport(entries, [a.label, b.label], opts);

  if (args.output) {
    writeFullReport(report, args.output);
    console.log(`Report written to ${args.output}`);
  } else {
    console.log(report.body);
    if (report.score) {
      console.log(`\nDrift Score: ${report.score.score} (${report.score.severity})`);
    }
    if (report.suggestions) {
      console.log(`\nSuggestions:\n${report.suggestions}`);
    }
  }
}
