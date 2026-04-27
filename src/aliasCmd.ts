import { addAlias, removeAlias, listAliases, resolveAlias } from './alias';

export function cmdAliasAdd(args: string[]): void {
  const [name, target] = args;
  if (!name || !target) {
    console.error('Usage: driftlog alias add <name> <target-path>');
    process.exit(1);
  }
  addAlias(name, target);
  console.log(`Alias '${name}' -> '${target}' saved.`);
}

export function cmdAliasRemove(args: string[]): void {
  const [name] = args;
  if (!name) {
    console.error('Usage: driftlog alias remove <name>');
    process.exit(1);
  }
  const removed = removeAlias(name);
  if (removed) {
    console.log(`Alias '${name}' removed.`);
  } else {
    console.error(`Alias '${name}' not found.`);
    process.exit(1);
  }
}

export function cmdAliasList(): void {
  const aliases = listAliases();
  if (aliases.length === 0) {
    console.log('No aliases defined.');
    return;
  }
  console.log('Defined aliases:');
  for (const { name, target } of aliases) {
    console.log(`  ${name.padEnd(20)} -> ${target}`);
  }
}

export function cmdAliasResolve(args: string[]): void {
  const [name] = args;
  if (!name) {
    console.error('Usage: driftlog alias resolve <name>');
    process.exit(1);
  }
  const resolved = resolveAlias(name);
  console.log(resolved);
}
