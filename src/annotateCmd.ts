import fs from 'fs';
import path from 'path';
import { Annotation, AnnotationMap, parseAnnotationArgs } from './annotate';

const ANNOTATIONS_FILE = path.join(process.cwd(), '.driftlog', 'annotations.json');

function ensureDir(): void {
  const dir = path.dirname(ANNOTATIONS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAnnotations(): AnnotationMap {
  if (!fs.existsSync(ANNOTATIONS_FILE)) return {};
  return JSON.parse(fs.readFileSync(ANNOTATIONS_FILE, 'utf8')) as AnnotationMap;
}

function writeAnnotations(map: AnnotationMap): void {
  ensureDir();
  fs.writeFileSync(ANNOTATIONS_FILE, JSON.stringify(map, null, 2) + '\n');
}

export function cmdAnnotateAdd(args: string[]): void {
  const { key, note, author } = parseAnnotationArgs(args);
  const map = readAnnotations();
  const annotation: Annotation = {
    key,
    note,
    author,
    createdAt: new Date().toISOString(),
  };
  map[key] = annotation;
  writeAnnotations(map);
  console.log(`Annotation saved for key: ${key}`);
}

export function cmdAnnotateList(): void {
  const map = readAnnotations();
  const entries = Object.values(map);
  if (entries.length === 0) {
    console.log('No annotations found.');
    return;
  }
  for (const a of entries) {
    const who = a.author ? ` (${a.author})` : '';
    console.log(`  ${a.key}${who} [${a.createdAt}]: ${a.note}`);
  }
}

export function cmdAnnotateRemove(args: string[]): void {
  const key = args[0];
  if (!key) throw new Error('Usage: annotate remove <key>');
  const map = readAnnotations();
  if (!map[key]) {
    console.log(`No annotation found for key: ${key}`);
    return;
  }
  delete map[key];
  writeAnnotations(map);
  console.log(`Annotation removed for key: ${key}`);
}

export function cmdAnnotateJson(): void {
  const map = readAnnotations();
  console.log(JSON.stringify(map, null, 2));
}
