import { saveProfile, loadProfile, listProfiles, deleteProfile, Profile } from './profile';

export function cmdProfileSave(args: string[]): void {
  const name = args[0];
  if (!name) throw new Error('Usage: driftlog profile save <name> --files <f1> <f2> [--labels <l1> <l2>]');

  const filesIdx = args.indexOf('--files');
  const labelsIdx = args.indexOf('--labels');

  if (filesIdx === -1) throw new Error('--files is required');

  const filesEnd = labelsIdx !== -1 ? labelsIdx : args.length;
  const files = args.slice(filesIdx + 1, filesEnd);
  const labels = labelsIdx !== -1 ? args.slice(labelsIdx + 1) : undefined;

  if (files.length === 0) throw new Error('At least one file must be specified with --files');

  const profile: Profile = { name, files, labels };
  saveProfile(name, profile);
  console.log(`Profile '${name}' saved with ${files.length} file(s).`);
}

export function cmdProfileShow(args: string[]): void {
  const name = args[0];
  if (!name) throw new Error('Usage: driftlog profile show <name>');
  const profile = loadProfile(name);
  console.log(JSON.stringify(profile, null, 2));
}

export function cmdProfileList(): void {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    console.log('No profiles saved.');
  } else {
    console.log('Saved profiles:');
    profiles.forEach(p => console.log(`  - ${p}`));
  }
}

export function cmdProfileDelete(args: string[]): void {
  const name = args[0];
  if (!name) throw new Error('Usage: driftlog profile delete <name>');
  deleteProfile(name);
  console.log(`Profile '${name}' deleted.`);
}
