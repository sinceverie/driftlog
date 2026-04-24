import { DriftResult, DriftKind } from './differ';

export type ReportFormat = 'text' | 'json';

export interface ReportOptions {
  format: ReportFormat;
  verbose?: boolean;
}

const KIND_LABELS: Record<DriftKind, string> = {
  added: 'ADDED',
  removed: 'REMOVED',
  changed: 'CHANGED',
};

const KIND_SYMBOLS: Record<DriftKind, string> = {
  added: '+',
  removed: '-',
  changed: '~',
};

export function formatTextReport(
  drifts: DriftResult[],
  baseLabel: string,
  targetLabel: string,
  verbose = false
): string {
  if (drifts.length === 0) {
    return `✓ No drift detected between ${baseLabel} and ${targetLabel}.\n`;
  }

  const lines: string[] = [
    `Drift detected between ${baseLabel} → ${targetLabel} (${drifts.length} change${drifts.length !== 1 ? 's' : ''}):\n`,
  ];

  for (const d of drifts) {
    const symbol = KIND_SYMBOLS[d.kind];
    const label = KIND_LABELS[d.kind];
    if (d.kind === 'changed' && verbose) {
      lines.push(`  ${symbol} [${label}] ${d.key}: ${JSON.stringify(d.baseValue)} → ${JSON.stringify(d.targetValue)}`);
    } else if (d.kind === 'added') {
      lines.push(`  ${symbol} [${label}] ${d.key}${verbose ? ': ' + JSON.stringify(d.targetValue) : ''}`);
    } else if (d.kind === 'removed') {
      lines.push(`  ${symbol} [${label}] ${d.key}${verbose ? ': ' + JSON.stringify(d.baseValue) : ''}`);
    } else {
      lines.push(`  ${symbol} [${label}] ${d.key}`);
    }
  }

  return lines.join('\n') + '\n';
}

export function formatJsonReport(
  drifts: DriftResult[],
  baseLabel: string,
  targetLabel: string
): string {
  const report = {
    base: baseLabel,
    target: targetLabel,
    driftCount: drifts.length,
    hasDrift: drifts.length > 0,
    drifts,
  };
  return JSON.stringify(report, null, 2) + '\n';
}

export function generateReport(
  drifts: DriftResult[],
  baseLabel: string,
  targetLabel: string,
  options: ReportOptions
): string {
  if (options.format === 'json') {
    return formatJsonReport(drifts, baseLabel, targetLabel);
  }
  return formatTextReport(drifts, baseLabel, targetLabel, options.verbose);
}
