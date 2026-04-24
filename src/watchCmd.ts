import { watchConfigs, WatchOptions } from './watch';

export interface WatchCmdArgs {
  files: string[];
  labels?: string[];
  format?: 'text' | 'json' | 'markdown';
  interval?: number;
}

export function cmdWatch(args: WatchCmdArgs): void {
  const { files, labels, format = 'text', interval = 2000 } = args;

  if (files.length < 2) {
    console.error('watch requires at least two config files');
    process.exit(1);
  }

  console.log(
    `Watching ${files.length} file(s) every ${interval}ms — press Ctrl+C to stop.`
  );

  const opts: WatchOptions = {
    files,
    labels,
    format,
    interval,
    onDrift: (report) => {
      console.log(`\n[drift detected @ ${new Date().toISOString()}]`);
      console.log(report);
    },
    onError: (err) => {
      console.error('[watch error]', err.message);
    },
  };

  const handle = watchConfigs(opts);

  process.on('SIGINT', () => {
    handle.stop();
    console.log('\nWatch stopped.');
    process.exit(0);
  });
}
