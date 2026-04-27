import { loadConfigs } from './loader';
import { computeDrift } from './differ';
import { notify, NotifyChannel, NotifyOptions } from './notify';

export function parseNotifyArgs(argv: string[]): {
  files: string[];
  channel: NotifyChannel;
  webhookUrl?: string;
  outputFile?: string;
  minSeverity?: 'low' | 'medium' | 'high';
} {
  const files: string[] = [];
  let channel: NotifyChannel = 'console';
  let webhookUrl: string | undefined;
  let outputFile: string | undefined;
  let minSeverity: 'low' | 'medium' | 'high' | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--channel' && argv[i + 1]) {
      channel = argv[++i] as NotifyChannel;
    } else if (argv[i] === '--webhook-url' && argv[i + 1]) {
      webhookUrl = argv[++i];
    } else if (argv[i] === '--output' && argv[i + 1]) {
      outputFile = argv[++i];
    } else if (argv[i] === '--min-severity' && argv[i + 1]) {
      minSeverity = argv[++i] as 'low' | 'medium' | 'high';
    } else if (!argv[i].startsWith('--')) {
      files.push(argv[i]);
    }
  }

  return { files, channel, webhookUrl, outputFile, minSeverity };
}

export async function cmdNotify(argv: string[]): Promise<void> {
  const args = parseNotifyArgs(argv);

  if (args.files.length < 2) {
    console.error('Usage: driftlog notify <file1> <file2> [options]');
    process.exit(1);
  }

  const configs = await loadConfigs(args.files);
  const [a, b] = configs;
  const entries = computeDrift(a.data, b.data);

  const opts: NotifyOptions = {
    channel: args.channel,
    webhookUrl: args.webhookUrl,
    outputFile: args.outputFile,
    minSeverity: args.minSeverity,
  };

  await notify(entries, opts);
}
