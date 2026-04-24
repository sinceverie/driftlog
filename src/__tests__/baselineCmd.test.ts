import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { cmdBaselineSave, cmdBaselineDiff, cmdBaselineList, cmdBaselineDelete } from "../baselineCmd";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "driftlog-bcmd-"));
}

function writeTmp(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("baselineCmd", () => {
  let tmpDir: string;
  let logSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("cmdBaselineSave prints confirmation message", () => {
    const envFile = writeTmp(tmpDir, ".env", "HOST=localhost\nPORT=3000\n");
    cmdBaselineSave(envFile, "base");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Baseline "base" saved'));
  });

  test("cmdBaselineDiff reports no drift when identical", () => {
    const envFile = writeTmp(tmpDir, ".env", "HOST=localhost\nPORT=3000\n");
    cmdBaselineSave(envFile, "base");
    logSpy.mockClear();
    cmdBaselineDiff(envFile, "base", "text");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No drift detected"));
  });

  test("cmdBaselineDiff reports drift when values differ", () => {
    const fileA = writeTmp(tmpDir, ".env.a", "HOST=localhost\nPORT=3000\n");
    const fileB = writeTmp(tmpDir, ".env.b", "HOST=localhost\nPORT=4000\n");
    cmdBaselineSave(fileA, "base");
    logSpy.mockClear();
    cmdBaselineDiff(fileB, "base", "text");
    // report should be printed (not the "no drift" message)
    const allOutput = logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(allOutput).not.toContain("No drift detected");
  });

  test("cmdBaselineList shows saved baselines", () => {
    const envFile = writeTmp(tmpDir, ".env", "KEY=val\n");
    cmdBaselineSave(envFile, "mybase");
    logSpy.mockClear();
    cmdBaselineList();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("mybase"));
  });

  test("cmdBaselineDelete removes a baseline", () => {
    const envFile = writeTmp(tmpDir, ".env", "KEY=val\n");
    cmdBaselineSave(envFile, "todel");
    logSpy.mockClear();
    cmdBaselineDelete("todel");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"todel" deleted'));
  });
});
