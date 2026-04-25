import fs from 'fs';
import path from 'path';
import { loadConfigs } from './loader';
import { parseSchemaFile, validateAgainstSchema, formatSchemaViolations } from './schema';

export function parseSchemaArgs(argv: string[]): { files: string[]; schemaPath: string; json: boolean } {
  const files: string[] = [];
  let schemaPath = '';
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--schema' && argv[i + 1]) {
      schemaPath = argv[++i];
    } else if (argv[i] === '--json') {
      json = true;
    } else {
      files.push(argv[i]);
    }
  }

  if (!schemaPath) throw new Error('--schema <path> is required for schema validation');
  if (files.length === 0) throw new Error('At least one config file must be provided');

  return { files, schemaPath, json };
}

export async function cmdSchemaValidate(argv: string[]): Promise<void> {
  const { files, schemaPath, json } = parseSchemaArgs(argv);

  const rawSchema = fs.readFileSync(path.resolve(schemaPath), 'utf-8');
  const schema = parseSchemaFile(rawSchema);

  const configs = loadConfigs(files);
  let hasViolations = false;

  const results: Array<{ label: string; violations: ReturnType<typeof validateAgainstSchema> }> = [];

  for (const { label, config } of configs) {
    const violations = validateAgainstSchema(config, schema);
    if (violations.length > 0) hasViolations = true;
    results.push({ label, violations });
  }

  if (json) {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  } else {
    for (const { label, violations } of results) {
      process.stdout.write(formatSchemaViolations(violations, label));
    }
  }

  if (hasViolations) process.exit(1);
}
