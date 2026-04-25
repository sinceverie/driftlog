import { DriftEntry } from './differ';

export type SchemaRule = {
  key: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  pattern?: string;
};

export type SchemaConfig = {
  rules: SchemaRule[];
};

export type SchemaViolation = {
  key: string;
  rule: string;
  message: string;
};

export function parseSchemaFile(raw: string): SchemaConfig {
  try {
    return JSON.parse(raw) as SchemaConfig;
  } catch {
    throw new Error('Schema file must be valid JSON');
  }
}

export function validateAgainstSchema(
  config: Record<string, string>,
  schema: SchemaConfig
): SchemaViolation[] {
  const violations: SchemaViolation[] = [];

  for (const rule of schema.rules) {
    const value = config[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      violations.push({ key: rule.key, rule: 'required', message: `Key "${rule.key}" is required but missing` });
      continue;
    }

    if (value === undefined) continue;

    if (rule.type === 'number' && isNaN(Number(value))) {
      violations.push({ key: rule.key, rule: 'type', message: `Key "${rule.key}" must be a number, got "${value}"` });
    }

    if (rule.type === 'boolean' && value !== 'true' && value !== 'false') {
      violations.push({ key: rule.key, rule: 'type', message: `Key "${rule.key}" must be a boolean, got "${value}"` });
    }

    if (rule.pattern) {
      const re = new RegExp(rule.pattern);
      if (!re.test(value)) {
        violations.push({ key: rule.key, rule: 'pattern', message: `Key "${rule.key}" value "${value}" does not match pattern ${rule.pattern}` });
      }
    }
  }

  return violations;
}

export function formatSchemaViolations(violations: SchemaViolation[], label: string): string {
  if (violations.length === 0) return `[${label}] Schema validation passed.\n`;
  const lines = [`[${label}] Schema violations (${violations.length}):`];
  for (const v of violations) {
    lines.push(`  [${v.rule}] ${v.message}`);
  }
  return lines.join('\n') + '\n';
}
