import * as fs from 'fs';
import * as path from 'path';
import { loadConfigs } from './loader';
import { computeDrift, hasDrift } from './differ';
import { generateReport } from './reporter';
import { renderOutput } from './formatter';

export interface WatchOptions {
  files: string[];
  labels?: string[];
  format: 'text' | 'json' | 'markdown';
  interval: number; // milliseconds
  onDrift?: (report: string) => void;
  onError?: (err: Error) => void;
}

export interface WatchHandle {
  stop: () => void;
}

export function watchConfigs(options: WatchOptions): WatchHandle {
  const { files, labels, format, interval, onDrift, onError } = options;
  let lastSnapshot: Record<string, string> = {};
  let running = true;

  function readRaw(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return '';
    }
  }

  function captureRaw(): Record<string, string> {
    const snap: Record<string, string> = {};
    for (const f of files) {
      snap[f] = readRaw(f);
    }
    return snap;
  }

  function hasChanged(current: Record<string, string>): boolean {
    for (const f of files) {
      if ((current[f] ?? '') !== (lastSnapshot[f] ?? '')) return true;
    }
    return false;
  }

  async function check() {
    if (!running) return;
    const current = captureRaw();
    if (!hasChanged(current)) return;
    lastSnapshot = current;
    try {
      const configs = loadConfigs(files, labels);
      if (configs.length < 2) return;
      const [base, ...rest] = configs;
      for (const target of rest) {
        const drift = computeDrift(base.data, target.data);
        if (hasDrift(drift)) {
          const report = generateReport(base.label, target.label, drift, format);
          const output = renderOutput(report, format);
          if (onDrift) onDrift(output);
          else process.stdout.write(output + '\n');
        }
      }
    } catch (err) {
      if (onError) onError(err as Error);
    }
  }

  lastSnapshot = captureRaw();
  const timer = setInterval(check, interval);

  return {
    stop: () => {
      running = false;
      clearInterval(timer);
    },
  };
}
