import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  cmdPluginAdd,
  cmdPluginList,
  cmdPluginShow,
  cmdPluginDelete,
} from "../pluginCmd";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "driftlog-plugincmd-test-"));
}

function writeTmp(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("cmdPluginAdd", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("registers a plugin from a local JS file", () => {
    const pluginFile = writeTmp(
      tmpDir,
      "myplugin.js",
      `module.exports = { name: 'myplugin', version: '1.0.0', description: 'A test plugin' };`
    );
    const output = cmdPluginAdd([pluginFile], { pluginDir: tmpDir });
    expect(output).toContain("myplugin");
    expect(output).toContain("registered");
  });

  it("returns an error if file does not exist", () => {
    const output = cmdPluginAdd(["/nonexistent/plugin.js"], { pluginDir: tmpDir });
    expect(output).toMatch(/not found|error|cannot/i);
  });

  it("returns an error if no path is provided", () => {
    const output = cmdPluginAdd([], { pluginDir: tmpDir });
    expect(output).toMatch(/usage|path required/i);
  });
});

describe("cmdPluginList", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns a message when no plugins are registered", () => {
    const output = cmdPluginList([], { pluginDir: tmpDir });
    expect(output).toMatch(/no plugins|empty/i);
  });

  it("lists registered plugins after adding one", () => {
    const pluginFile = writeTmp(
      tmpDir,
      "listplugin.js",
      `module.exports = { name: 'listplugin', version: '0.1.0', description: 'List test plugin' };`
    );
    cmdPluginAdd([pluginFile], { pluginDir: tmpDir });
    const output = cmdPluginList([], { pluginDir: tmpDir });
    expect(output).toContain("listplugin");
  });
});

describe("cmdPluginShow", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("shows details of a registered plugin", () => {
    const pluginFile = writeTmp(
      tmpDir,
      "showplugin.js",
      `module.exports = { name: 'showplugin', version: '2.0.0', description: 'Show test plugin' };`
    );
    cmdPluginAdd([pluginFile], { pluginDir: tmpDir });
    const output = cmdPluginShow(["showplugin"], { pluginDir: tmpDir });
    expect(output).toContain("showplugin");
    expect(output).toContain("2.0.0");
  });

  it("returns an error for unknown plugin", () => {
    const output = cmdPluginShow(["ghost"], { pluginDir: tmpDir });
    expect(output).toMatch(/not found|unknown/i);
  });
});

describe("cmdPluginDelete", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes a registered plugin", () => {
    const pluginFile = writeTmp(
      tmpDir,
      "delplugin.js",
      `module.exports = { name: 'delplugin', version: '1.0.0', description: 'Delete test plugin' };`
    );
    cmdPluginAdd([pluginFile], { pluginDir: tmpDir });
    const output = cmdPluginDelete(["delplugin"], { pluginDir: tmpDir });
    expect(output).toContain("delplugin");
    expect(output).toMatch(/deleted|removed/i);
    const listOutput = cmdPluginList([], { pluginDir: tmpDir });
    expect(listOutput).not.toContain("delplugin");
  });

  it("returns an error when deleting a non-existent plugin", () => {
    const output = cmdPluginDelete(["ghost"], { pluginDir: tmpDir });
    expect(output).toMatch(/not found|unknown/i);
  });
});
