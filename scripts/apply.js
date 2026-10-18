// Aplica en bloque las clasificaciones que escribe Claude (un solo archivo para N diseños):
// { "<slug>": { "category": "...", "styles": [...], "standout": "...", ... }, ... }
import fs from 'node:fs/promises';
import path from 'node:path';
import { INBOX, updateDesign, refreshCatalog } from '../lib/store.js';

const file = process.argv[2] ?? path.join(INBOX, 'classifications.json');
const data = JSON.parse(await fs.readFile(file, 'utf8'));

let ok = 0;
for (const [slug, patch] of Object.entries(data)) {
  try {
    await updateDesign(slug, { status: 'classified', ...patch });
    ok++;
  } catch (err) {
    console.error(`✗ ${slug}: ${err.message}`);
  }
}
await refreshCatalog();
await fs.rm(file);
console.log(`✓ ${ok} diseños clasificados. CATALOG.md actualizado.`);
