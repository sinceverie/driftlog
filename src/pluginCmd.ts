/**
 * pluginCmd.ts
 * CLI command handlers for managing driftlog plugins.
 * Plugins are simple JS/TS modules that export a transform or reporter hook.
 */

import * as fs from "fs";
import * as path from "path";
import {
  getPluginDir,
  getPluginPath,
  savePlugin,
  loadPlugin,
  listPlugins,
  deletePlugin,
  PluginManifest,
} from "./plugin";

/** Register a new plugin from a local file path */
export function cmdPluginAdd(args: string[]): void {
  const [name, filePath] = args;
  if (!name || !filePath) {
    console.error("Usage: driftlog plugin add <name> <path-to-plugin>");
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Plugin file not found: ${absPath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(absPath, "utf8");
  const manifest: PluginManifest = {
    name,
    source,
    registeredAt: new Date().toISOString(),
    originPath: absPath,
  };

  savePlugin(manifest);
  console.log(`Plugin "${name}" registered successfully.`);
}

/** List all registered plugins */
export function cmdPluginList(): void {
  const plugins = listPlugins();
  if (plugins.length === 0) {
    console.log("No plugins registered.");
    return;
  }
  console.log("Registered plugins:");
  for (const p of plugins) {
    console.log(`  - ${p.name}  (registered: ${p.registeredAt})`);
    if (p.originPath) {
      console.log(`    origin: ${p.originPath}`);
    }
  }
}

/** Show details and source of a registered plugin */
export function cmdPluginShow(args: string[]): void {
  const [name] = args;
  if (!name) {
    console.error("Usage: driftlog plugin show <name>");
    process.exit(1);
  }

  const plugin = loadPlugin(name);
  if (!plugin) {
    console.error(`Plugin "${name}" not found.`);
    process.exit(1);
  }

  console.log(`Plugin: ${plugin.name}`);
  console.log(`Registered: ${plugin.registeredAt}`);
  if (plugin.originPath) {
    console.log(`Origin: ${plugin.originPath}`);
  }
  console.log("\n--- Source ---");
  console.log(plugin.source);
}

/** Remove a registered plugin by name */
export function cmdPluginDelete(args: string[]): void {
  const [name] = args;
  if (!name) {
    console.error("Usage: driftlog plugin delete <name>");
    process.exit(1);
  }

  const removed = deletePlugin(name);
  if (!removed) {
    console.error(`Plugin "${name}" not found.`);
    process.exit(1);
  }
  console.log(`Plugin "${name}" removed.`);
}
