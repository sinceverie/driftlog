import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  saveBaseline,
  loadBaseline,
  listBaselines,
  deleteBaseline,
  getBaselineDir,
} from "../baseline";
import { ConfigMap } from "../loader";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "driftlog-baseline-"));
}

describe("baseline", () => {
  let originalCwd: () => string;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    originalCwd = process.cwd.bind(process);
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const sampleData: ConfigMap = { HOST: "localhost", PORT: "3000" };

  test("saveBaseline creates a JSON file", () => {
    saveBaseline("prod", "production", sampleData);
    const filePath = path.join(tmpDir, ".driftlog", "baselines", "prod.json");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("loadBaseline returns saved entry", () => {
    saveBaseline("prod", "production", sampleData);
    const entry = loadBaseline("prod");
    expect(entry).not.toBeNull();
    expect(entry!.label).toBe("production");
    expect(entry!.data).toEqual(sampleData);
    expect(entry!.timestamp).toBeTruthy();
  });

  test("loadBaseline returns null for missing baseline", () => {
    expect(loadBaseline("nonexistent")).toBeNull();
  });

  test("listBaselines returns all saved names", () => {
    saveBaseline("prod", "production", sampleData);
    saveBaseline("staging", "staging", sampleData);
    const names = listBaselines();
    expect(names).toContain("prod");
    expect(names).toContain("staging");
  });

  test("listBaselines returns empty array when none exist", () => {
    expect(listBaselines()).toEqual([]);
  });

  test("deleteBaseline removes the file and returns true", () => {
    saveBaseline("prod", "production", sampleData);
    const result = deleteBaseline("prod");
    expect(result).toBe(true);
    expect(loadBaseline("prod")).toBeNull();
  });

  test("deleteBaseline returns false for missing baseline", () => {
    expect(deleteBaseline("ghost")).toBe(false);
  });
});
