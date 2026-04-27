import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  appendHistoryEntry,
  loadHistory,
  clearHistory,
  formatHistoryEntry,
  buildHistoryEntry,
  HistoryEntry,
} from "../history";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "driftlog-history-"));
}

describe("history", () => {
  it("returns empty array when no history file exists", () => {
    const dir = makeTmpDir();
    expect(loadHistory(dir)).toEqual([]);
  });

  it("appends and loads a history entry", () => {
    const dir = makeTmpDir();
    const entry = buildHistoryEntry("diff", ["a.env", "b.env"], 3, "3 keys differ");
    appendHistoryEntry(entry, dir);
    const loaded = loadHistory(dir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].command).toBe("diff");
    expect(loaded[0].driftCount).toBe(3);
    expect(loaded[0].files).toEqual(["a.env", "b.env"]);
  });

  it("appends multiple entries in order", () => {
    const dir = makeTmpDir();
    const e1 = buildHistoryEntry("diff", ["a.env"], 1, "one diff");
    const e2 = buildHistoryEntry("export", ["b.env"], 0, "clean");
    appendHistoryEntry(e1, dir);
    appendHistoryEntry(e2, dir);
    const loaded = loadHistory(dir);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].command).toBe("diff");
    expect(loaded[1].command).toBe("export");
  });

  it("clears history", () => {
    const dir = makeTmpDir();
    const entry = buildHistoryEntry("diff", ["a.env"], 2, "two diffs");
    appendHistoryEntry(entry, dir);
    clearHistory(dir);
    expect(loadHistory(dir)).toEqual([]);
  });

  it("formatHistoryEntry produces readable string", () => {
    const entry: HistoryEntry = {
      timestamp: "2024-01-01T00:00:00.000Z",
      command: "diff",
      files: ["prod.env", "staging.env"],
      driftCount: 5,
      summary: "5 keys differ",
    };
    const result = formatHistoryEntry(entry);
    expect(result).toContain("diff");
    expect(result).toContain("prod.env");
    expect(result).toContain("5");
    expect(result).toContain("5 keys differ");
  });

  it("buildHistoryEntry sets a timestamp", () => {
    const entry = buildHistoryEntry("lint", ["x.json"], 0, "ok");
    expect(entry.timestamp).toBeTruthy();
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });
});
