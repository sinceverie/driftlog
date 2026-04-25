import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseSchemaArgs } from '../schemaCmd';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'driftlog-schema-'));
}

function writeTmp(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('parseSchemaArgs', () => {
  it('parses files and schema path', () => {
    const result = parseSchemaArgs(['a.env', 'b.env', '--schema', 'schema.json']);
    expect(result.files).toEqual(['a.env', 'b.env']);
    expect(result.schemaPath).toBe('schema.json');
    expect(result.json).toBe(false);
  });

  it('parses --json flag', () => {
    const result = parseSchemaArgs(['a.env', '--schema', 'schema.json', '--json']);
    expect(result.json).toBe(true);
  });

  it('throws if --schema is missing', () => {
    expect(() => parseSchemaArgs(['a.env'])).toThrow('--schema');
  });

  it('throws if no files provided', () => {
    expect(() => parseSchemaArgs(['--schema', 'schema.json'])).toThrow('At least one config file');
  });
});

describe('cmdSchemaValidate integration', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it('exits 0 when all configs pass schema', async () => {
    const schema = { rules: [{ key: 'PORT', required: true, type: 'number' }] };
    const schemaFile = writeTmp(dir, 'schema.json', JSON.stringify(schema));
    const envFile = writeTmp(dir, '.env', 'PORT=3000\n');

    const { cmdSchemaValidate } = await import('../schemaCmd');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await cmdSchemaValidate([envFile, '--schema', schemaFile]);

    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
    writeSpy.mockRestore();
  });
});
