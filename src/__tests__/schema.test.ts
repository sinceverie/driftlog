import { parseSchemaFile, validateAgainstSchema, formatSchemaViolations } from '../schema';

const schema = {
  rules: [
    { key: 'PORT', required: true, type: 'number' as const },
    { key: 'DEBUG', type: 'boolean' as const },
    { key: 'API_URL', required: true, pattern: '^https://' },
  ],
};

describe('parseSchemaFile', () => {
  it('parses valid JSON schema', () => {
    const result = parseSchemaFile(JSON.stringify(schema));
    expect(result.rules).toHaveLength(3);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseSchemaFile('not json')).toThrow('Schema file must be valid JSON');
  });
});

describe('validateAgainstSchema', () => {
  it('returns no violations for valid config', () => {
    const config = { PORT: '8080', DEBUG: 'true', API_URL: 'https://example.com' };
    expect(validateAgainstSchema(config, schema)).toHaveLength(0);
  });

  it('reports missing required key', () => {
    const config = { DEBUG: 'true', API_URL: 'https://example.com' };
    const violations = validateAgainstSchema(config, schema);
    expect(violations.some(v => v.key === 'PORT' && v.rule === 'required')).toBe(true);
  });

  it('reports non-numeric value for number type', () => {
    const config = { PORT: 'abc', API_URL: 'https://example.com' };
    const violations = validateAgainstSchema(config, schema);
    expect(violations.some(v => v.key === 'PORT' && v.rule === 'type')).toBe(true);
  });

  it('reports invalid boolean', () => {
    const config = { PORT: '3000', DEBUG: 'yes', API_URL: 'https://example.com' };
    const violations = validateAgainstSchema(config, schema);
    expect(violations.some(v => v.key === 'DEBUG' && v.rule === 'type')).toBe(true);
  });

  it('reports pattern mismatch', () => {
    const config = { PORT: '3000', API_URL: 'http://example.com' };
    const violations = validateAgainstSchema(config, schema);
    expect(violations.some(v => v.key === 'API_URL' && v.rule === 'pattern')).toBe(true);
  });

  it('ignores optional missing keys', () => {
    const config = { PORT: '3000', API_URL: 'https://example.com' };
    const violations = validateAgainstSchema(config, schema);
    expect(violations.some(v => v.key === 'DEBUG')).toBe(false);
  });
});

describe('formatSchemaViolations', () => {
  it('returns pass message when no violations', () => {
    const out = formatSchemaViolations([], 'prod');
    expect(out).toContain('passed');
  });

  it('formats violations with label and rule', () => {
    const violations = [{ key: 'PORT', rule: 'required', message: 'Key "PORT" is required but missing' }];
    const out = formatSchemaViolations(violations, 'staging');
    expect(out).toContain('[staging]');
    expect(out).toContain('[required]');
    expect(out).toContain('PORT');
  });
});
