import { DriftEntry } from './differ';
import { computeSeverity } from './score';

export type NotifyChannel = 'console' | 'webhook' | 'file';

export interface NotifyOptions {
  channel: NotifyChannel;
  webhookUrl?: string;
  outputFile?: string;
  minSeverity?: 'low' | 'medium' | 'high';
}

export interface NotifyPayload {
  timestamp: string;
  totalDrift: number;
  severity: 'low' | 'medium' | 'high';
  entries: DriftEntry[];
}

export function buildPayload(entries: DriftEntry[]): NotifyPayload {
  const severity = computeSeverity(entries);
  return {
    timestamp: new Date().toISOString(),
    totalDrift: entries.length,
    severity,
    entries,
  };
}

export function severityRank(s: 'low' | 'medium' | 'high'): number {
  return s === 'high' ? 2 : s === 'medium' ? 1 : 0;
}

export async function sendWebhook(url: string, payload: NotifyPayload): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Webhook request failed: ${res.status} ${res.statusText}`);
  }
}

export async function notify(
  entries: DriftEntry[],
  opts: NotifyOptions
): Promise<void> {
  const payload = buildPayload(entries);
  const min = opts.minSeverity ?? 'low';
  if (severityRank(payload.severity) < severityRank(min)) return;

  if (opts.channel === 'webhook') {
    if (!opts.webhookUrl) throw new Error('webhookUrl required for webhook channel');
    await sendWebhook(opts.webhookUrl, payload);
  } else if (opts.channel === 'file') {
    const fs = await import('fs');
    const dest = opts.outputFile ?? 'drift-notify.json';
    fs.writeFileSync(dest, JSON.stringify(payload, null, 2));
  } else {
    const line = `[driftlog notify] ${payload.timestamp} severity=${payload.severity} drift=${payload.totalDrift}`;
    console.log(line);
  }
}
