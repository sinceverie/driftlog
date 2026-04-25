import { addEnvGroup, removeEnvGroup, loadEnvGroups, findGroup } from './env';

export function cmdEnvGroupAdd(args: string[]): void {
  const name = args[0];
  const files = args.slice(1);
  if (!name || files.length === 0) {
    console.error('Usage: driftlog env-group add <name> <file1> [file2 ...]');
    process.exit(1);
  }
  addEnvGroup(name, files);
  console.log(`Env group "${name}" saved with ${files.length} file(s).`);
}

export function cmdEnvGroupList(args: string[]): void {
  const groups = loadEnvGroups();
  if (groups.length === 0) {
    console.log('No env groups defined.');
    return;
  }
  for (const g of groups) {
    console.log(`${g.name}: ${g.files.join(', ')}`);
  }
}

export function cmdEnvGroupShow(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.error('Usage: driftlog env-group show <name>');
    process.exit(1);
  }
  const group = findGroup(name);
  if (!group) {
    console.error(`Env group "${name}" not found.`);
    process.exit(1);
  }
  console.log(`Group: ${group.name}`);
  group.files.forEach((f, i) => console.log(`  [${i}] ${f}`));
}

export function cmdEnvGroupRemove(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.error('Usage: driftlog env-group remove <name>');
    process.exit(1);
  }
  const removed = removeEnvGroup(name);
  if (removed) {
    console.log(`Env group "${name}" removed.`);
  } else {
    console.error(`Env group "${name}" not found.`);
    process.exit(1);
  }
}
