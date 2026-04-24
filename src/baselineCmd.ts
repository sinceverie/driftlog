import { loadConfig } from "./loader";
import {
  saveBaseline,
  loadBaseline,
  listBaselines,
  deleteBaseline,
} from "./baseline";
import { computeDrift, hasDrift } from "./differ";
import { generateReport } from "./reporter";
import { renderOutput } from "./formatter";

export function cmdBaselineSave(filePath: string, name: string): void {
  const { label, data } = loadConfig(filePath);
  saveBaseline(name, label, data);
  console.log(`Baseline "${name}" saved for ${label} (${Object.keys(data).length} keys).`);
}

export function cmdBaselineDiff(
  filePath: string,
  name: string,
  format: string = "text"
): void {
  const { label, data: current } = loadConfig(filePath);
  const entry = loadBaseline(name);
  if (!entry) {
    console.error(`Baseline "${name}" not found.`);
    process.exit(1);
  }
  const drift = computeDrift(entry.data, current);
  if (!hasDrift(drift)) {
    console.log(`No drift detected between baseline "${name}" and ${label}.`);
    return;
  }
  const report = generateReport(
    { label: `baseline:${name}`, data: entry.data },
    { label, data: current },
    drift
  );
  renderOutput(report, format);
}

export function cmdBaselineList(): void {
  const names = listBaselines();
  if (names.length === 0) {
    console.log("No baselines saved.");
    return;
  }
  console.log("Saved baselines:");
  names.forEach((n) => console.log(`  - ${n}`));
}

export function cmdBaselineDelete(name: string): void {
  const removed = deleteBaseline(name);
  if (removed) {
    console.log(`Baseline "${name}" deleted.`);
  } else {
    console.error(`Baseline "${name}" not found.`);
    process.exit(1);
  }
}
