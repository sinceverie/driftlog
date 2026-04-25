import {
  saveTemplate,
  loadTemplate,
  listTemplates,
  deleteTemplate,
  validateAgainstTemplate,
  DriftTemplate,
} from './template';
import { loadConfig } from './loader';

export function cmdTemplateSave(name: string, filePath: string, description?: string): void {
  const config = loadConfig(filePath);
  const keys = Object.keys(config.data);
  const template: DriftTemplate = {
    name,
    description,
    keys,
    requiredKeys: keys,
    createdAt: new Date().toISOString(),
  };
  saveTemplate(template);
  console.log(`Template "${name}" saved with ${keys.length} keys.`);
}

export function cmdTemplateList(): void {
  const names = listTemplates();
  if (names.length === 0) {
    console.log('No templates saved.');
    return;
  }
  console.log('Saved templates:');
  names.forEach(n => console.log(`  - ${n}`));
}

export function cmdTemplateShow(name: string): void {
  const template = loadTemplate(name);
  if (!template) {
    console.error(`Template "${name}" not found.`);
    process.exit(1);
  }
  console.log(JSON.stringify(template, null, 2));
}

export function cmdTemplateDelete(name: string): void {
  const deleted = deleteTemplate(name);
  if (!deleted) {
    console.error(`Template "${name}" not found.`);
    process.exit(1);
  }
  console.log(`Template "${name}" deleted.`);
}

export function cmdTemplateValidate(name: string, filePath: string): void {
  const template = loadTemplate(name);
  if (!template) {
    console.error(`Template "${name}" not found.`);
    process.exit(1);
  }
  const config = loadConfig(filePath);
  const missing = validateAgainstTemplate(Object.keys(config.data), template);
  if (missing.length === 0) {
    console.log(`✔ Config satisfies template "${name}".`);
  } else {
    console.log(`✖ Missing required keys for template "${name}":`);
    missing.forEach(k => console.log(`  - ${k}`));
    process.exit(1);
  }
}
