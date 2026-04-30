import { loadTimeline, filterTimeline, formatTimelineReport, TimelineOptions } from './timeline';

export function parseTimelineArgs(argv: string[]): {
  label?: string;
  since?: string;
  until?: string;
  json?: boolean;
} {
  const opts: { label?: string; since?: string; until?: string; json?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--label' && argv[i + 1]) opts.label = argv[++i];
    else if (argv[i] === '--since' && argv[i + 1]) opts.since = argv[++i];
    else if (argv[i] === '--until' && argv[i + 1]) opts.until = argv[++i];
    else if (argv[i] === '--json') opts.json = true;
  }
  return opts;
}

export function cmdTimelineList(argv: string[]): void {
  const { label, since, until, json } = parseTimelineArgs(argv);
  if (!label) {
    console.error('Error: --label <name> is required');
    process.exit(1);
  }
  const entries = loadTimeline(label);
  const filtered = filterTimeline(entries, { since, until, label } as TimelineOptions);
  if (json) {
    console.log(JSON.stringify(filtered, null, 2));
  } else {
    process.stdout.write(formatTimelineReport(filtered));
  }
}

export function cmdTimelineSummary(argv: string[]): void {
  const { label } = parseTimelineArgs(argv);
  if (!label) {
    console.error('Error: --label <name> is required');
    process.exit(1);
  }
  const entries = loadTimeline(label);
  if (entries.length === 0) {
    console.log('No timeline data for label:', label);
    return;
  }
  const totalAdded = entries.reduce((s, e) => s + e.added, 0);
  const totalRemoved = entries.reduce((s, e) => s + e.removed, 0);
  const totalChanged = entries.reduce((s, e) => s + e.changed, 0);
  console.log(`Timeline summary for "${label}" (${entries.length} snapshots):`);
  console.log(`  Total added:   ${totalAdded}`);
  console.log(`  Total removed: ${totalRemoved}`);
  console.log(`  Total changed: ${totalChanged}`);
  console.log(`  First: ${entries[0].timestamp}`);
  console.log(`  Last:  ${entries[entries.length - 1].timestamp}`);
}
