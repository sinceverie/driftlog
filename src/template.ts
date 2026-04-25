import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DriftTemplate {
  name: string;
  description?: string;
  keys: string[];
  requiredKeys?: string[];
  createdAt: string;
}

export function getTemplateDir(): string {
  return path.join(os.homedir(), '.driftlog', 'templates');
}

export function getTemplatePath(name: string): string {
  return path.join(getTemplateDir(), `${name}.json`);
}

export function saveTemplate(template: DriftTemplate, dir?: string): void {
  const templateDir = dir ?? getTemplateDir();
  fs.mkdirSync(templateDir, { recursive: true });
  const filePath = path.join(templateDir, `${template.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
}

export function loadTemplate(name: string, dir?: string): DriftTemplate | null {
  const filePath = path.join(dir ?? getTemplateDir(), `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as DriftTemplate;
}

export function listTemplates(dir?: string): string[] {
  const templateDir = dir ?? getTemplateDir();
  if (!fs.existsSync(templateDir)) return [];
  return fs.readdirSync(templateDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''));
}

export function deleteTemplate(name: string, dir?: string): boolean {
  const filePath = path.join(dir ?? getTemplateDir(), `${name}.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function validateAgainstTemplate(
  keys: string[],
  template: DriftTemplate
): string[] {
  const required = template.requiredKeys ?? template.keys;
  return required.filter(k => !keys.includes(k));
}
