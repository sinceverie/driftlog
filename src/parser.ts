import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export type ConfigRecord = Record<string, unknown>;

export type SupportedFormat = 'json' | 'yaml' | 'env';

function detectFormat(filePath: string): SupportedFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  if (ext === '.env' || path.basename(filePath).startsWith('.env')) return 'env';
  throw new Error(`Unsupported file format: ${ext}`);
}

function parseEnv(content: string): ConfigRecord {
  const result: ConfigRecord = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

export function parseConfigFile(filePath: string): ConfigRecord {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const format = detectFormat(filePath);

  switch (format) {
    case 'json':
      return JSON.parse(content) as ConfigRecord;
    case 'yaml':
      return yaml.load(content) as ConfigRecord;
    case 'env':
      return parseEnv(content);
    default:
      throw new Error(`Unhandled format: ${format}`);
  }
}
