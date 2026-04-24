import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Profile {
  name: string;
  files: string[];
  format?: string;
  labels?: string[];
}

export function getProfileDir(): string {
  return path.join(os.homedir(), '.driftlog', 'profiles');
}

export function getProfilePath(name: string): string {
  return path.join(getProfileDir(), `${name}.json`);
}

export function saveProfile(name: string, profile: Profile): void {
  const dir = getProfileDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getProfilePath(name), JSON.stringify(profile, null, 2), 'utf-8');
}

export function loadProfile(name: string): Profile {
  const filePath = getProfilePath(name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile '${name}' not found.`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Profile;
}

export function listProfiles(): string[] {
  const dir = getProfileDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''));
}

export function deleteProfile(name: string): void {
  const filePath = getProfilePath(name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile '${name}' not found.`);
  }
  fs.unlinkSync(filePath);
}
