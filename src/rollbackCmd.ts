import { loadConfigs } from './loader';
import {
  listRollbackTargets,
  resolveRollbackData,
  generateRollbackPatch,
  formatRollbackReport,
  RollbackSource,
} from './rollback';

export function cmdRollbackList(args: string[]): void {
  const source: RollbackSource = args.includes('--baseline') ? 'baseline' : 'snapshot';
  const targets = listRollbackTargets(source);
  if (targets.length === 0) {
    console.log(`No ${source} rollback targets found.`);
    return;
  }
  console.log(`Available ${source} rollback targets:`);
  for (const t of targets) {
    console.log(`  [${t.timestamp}] ${t.name} / ${t.label}  (${t.keys.length} keys)`);
  }
}

export function cmdRollbackPreview(args: string[]): void {
  const source: RollbackSource = args.includes('--baseline') ? 'baseline' : 'snapshot';
  const nameIdx = args.indexOf('--name');
  const labelIdx = args.indexOf('--label');
  const fileIdx = args.indexOf('--file');

  if (nameIdx === -1 || fileIdx === -1) {
    console.error('Usage: rollback preview --name <name> --label <label> --file <path> [--baseline]');
    process.exit(1);
  }

  const name = args[nameIdx + 1];
  const label = labelIdx !== -1 ? args[labelIdx + 1] : 'default';
  const file = args[fileIdx + 1];

  const targetData = resolveRollbackData(source, name, label);
  if (!targetData) {
    console.error(`Rollback target "${name}" / "${label}" not found.`);
    process.exit(1);
  }

  const configs = loadConfigs([file]);
  if (configs.length === 0) {
    console.error(`Could not load config from "${file}".`);
    process.exit(1);
  }

  const current = configs[0].data;
  const patch = generateRollbackPatch(current, targetData);
  process.stdout.write(formatRollbackReport(patch, name));
}
