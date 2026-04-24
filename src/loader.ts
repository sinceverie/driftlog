import * as fs from 'fs';
import * as path from 'path';
import { parseConfigFile } from './parser';

export interface LoadedConfig {
  filePath: string;
  label: string;
  data: Record<string, string>;
}

export class ConfigLoadError extends Error {
  constructor(public filePath: string, message: string) {
    super(`Failed to load config "${filePath}": ${message}`);
    this.name = 'ConfigLoadError';
  }
}

export function resolveLabel(filePath: string, override?: string): string {
  if (override) return override;
  return path.basename(filePath, path.extname(filePath));
}

export function loadConfig(filePath: string, labelOverride?: string): LoadedConfig {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new ConfigLoadError(filePath, 'file not found');
  }

  let raw: string;
  try {
    raw = fs.readFileSync(resolved, 'utf-8');
  } catch (err: any) {
    throw new ConfigLoadError(filePath, err.message);
  }

  let data: Record<string, string>;
  try {
    data = parseConfigFile(raw, resolved);
  } catch (err: any) {
    throw new ConfigLoadError(filePath, `parse error — ${err.message}`);
  }

  return {
    filePath: resolved,
    label: resolveLabel(filePath, labelOverride),
    data,
  };
}

export function loadConfigs(
  entries: Array<{ filePath: string; label?: string }>
): LoadedConfig[] {
  if (entries.length < 2) {
    throw new Error('At least two config files are required to compute drift.');
  }
  return entries.map(({ filePath, label }) => loadConfig(filePath, label));
}
