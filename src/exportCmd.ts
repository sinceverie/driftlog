import { loadConfigs } from './loader';
import { computeDrift } from './differ';
import { exportReport, resolveExportFormat, ExportFormat } from './export';

export interface ExportCmdArgs {
  files: string[];
  labels: string[];
  output: string;
  format?: ExportFormat;
}

export function parseExportArgs(argv: string[]): ExportCmdArgs {
  const files: string[] = [];
  const labels: string[] = [];
  let output = '';
  let format: ExportFormat | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--label' && argv[i + 1]) {
      labels.push(argv[++i]);
    } else if ((argv[i] === '--output' || argv[i] === '-o') && argv[i + 1]) {
      output = argv[++i];
    } else if (argv[i] === '--format' && argv[i + 1]) {
      format = argv[++i] as ExportFormat;
    } else if (!argv[i].startsWith('--')) {
      files.push(argv[i]);
    }
  }

  if (files.length < 2) throw new Error('export requires two config file paths');
  if (!output) throw new Error('export requires --output <path>');

  return { files, labels, output, format };
}

export async function cmdExport(argv: string[]): Promise<void> {
  const args = parseExportArgs(argv);
  const configs = await loadConfigs(args.files, args.labels);
  if (configs.length < 2) throw new Error('Could not load both configs');

  const [a, b] = configs;
  const drift = computeDrift(a.data, b.data);
  const format = args.format ?? resolveExportFormat(args.output);

  exportReport(drift, [a.label, b.label], {
    outputPath: args.output,
    format,
  });

  console.log(`Report exported to ${args.output} (${format})`);
}
