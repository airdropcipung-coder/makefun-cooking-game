// WARUNG BINTANG — Dapur Kilat. Entry for best-cooking-game-20261125-0137.
// Node 22, standard library only. The playable game lives in game/ beside this
// file: static HTML + ES modules that a desktop browser opens offline, with no
// library and no network request. This program is the handoff: it copies game/
// and screenshots/ into /output and writes /output/dossier.json, the summary
// the judge reads, using the vendored make.fun helper.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (inside the grader's container /output is used instead). Serve the game with
// `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

// Fail loudly instead of handing in an empty output: the scorer would refuse
// a missing game or missing screenshots, so refuse here first.
if (!existsSync(join(gameDir, 'index.html'))) {
  console.error('error: game/index.html is missing');
  process.exit(1);
}
if (!existsSync(shotsDir)) {
  console.error('error: screenshots/ is missing');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The scorer's caps, mirrored here so a bad entry fails locally first: at most
// 4 screenshots of at most 256 KiB each; game/ at most 993 files and 48 MiB in
// all, no path under game/ longer than 1000 bytes; the dossier text itself is
// capped separately. Only text_max_bytes shapes bytes; the other limits refuse
// an entry the scorer would refuse. Count the screenshots first: the judge
// needs at least one, and the cover (first by name) is what it sees first.
import { readdirSync } from 'node:fs';
const shotFiles = readdirSync(shotsDir).filter(function (name) {
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
});
if (shotFiles.length < 1 || shotFiles.length > 4) {
  console.error('error: expected 1-4 screenshots, found ' + shotFiles.length);
  process.exit(1);
}

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('wrote ' + outDir + '/dossier.json');
