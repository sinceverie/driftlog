import { loadConfigs } from './loader';
import { computeDrift } from './differ';
import { groupDrift, formatGroupReport, parseGroupArgs, GroupBy } from './group';
import { parseFilterArgs, filterDrift } from './filter';
import { applyIgnore, loadIgnorePatterns, findIgnoreFile } from './ignore';

export async function cmdGroupDiff(args: string[]): Promise<void> {
  if (args.length < 2) {
    console.error('Usage: driftlog group <file1> <file2> [--group-by kind|key|prefix] [--filter <pattern>]');
    process.exit(1);
  }

  const [pathA, pathB] = args;
  const groupBy: GroupBy = parseGroupArgs(args);
  const filterPatterns = parseFilterArgs(args);

  let configs;
  try {
    configs = await loadConfigs([pathA, pathB]);
  } catch (err: any) {
    console.error(`Error loading configs: ${err.message}`);
    process.exit(1);
  }

  const [cfgA, cfgB] = configs;
  let drift = computeDrift(cfgA.data, cfgB.data);

  const ignoreFile = findIgnoreFile(process.cwd());
  if (ignoreFile) {
    const patterns = loadIgnorePatterns(ignoreFile);
    drift = applyIgnore(drift, patterns);
  }

  if (filterPatterns.length > 0) {
    drift = filterDrift(drift, filterPatterns);
  }

  const groups = groupDrift(drift, groupBy);
  process.stdout.write(formatGroupReport(groups, groupBy));
}
