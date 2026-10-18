// Procesa inbox/ sin gastar un solo token:
//   inbox/stripe-pricing.png            → un diseño, título "stripe pricing"
//   inbox/stripe-pricing.txt            → (opcional) notas para esa imagen
//   inbox/Linear home/*.png + notes.txt → un diseño con varias imágenes
// notes.txt: una línea con http… se guarda como url, "categoria: x" fija la categoría,
// el resto pasa a la descripción. Los originales se mueven a inbox/_processed/.
import fs from 'node:fs/promises';
import path from 'node:path';
import { INBOX, createDesign, refreshCatalog } from '../lib/store.js';

const IMG = /\.(png|jpe?g|webp|avif|gif|tiff?)$/i;
const SKIP = new Set(['_processed', 'classifications.json', 'README.md', '.gitkeep']);

function parseNotes(text) {
  const out = { description: [] };
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (/^https?:\/\//.test(t) && !out.url) out.url = t;
    else if (/^categor[ií]a\s*:/i.test(t)) out.category = t.split(':')[1].trim();
    else if (/^estilos?\s*:/i.test(t)) out.styles = t.split(':')[1];
    else out.description.push(line);
  }
  out.description = out.description.join('\n').trim();
  return out;
}

const readText = (p) => fs.readFile(p, 'utf8').catch(() => '');
const titleFrom = (name) => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

await fs.mkdir(INBOX, { recursive: true });
const entries = (await fs.readdir(INBOX, { withFileTypes: true })).filter((e) => !SKIP.has(e.name));
const jobs = [];

for (const e of entries) {
  const p = path.join(INBOX, e.name);
  if (e.isDirectory()) {
    const files = (await fs.readdir(p)).sort();
    const images = files.filter((f) => IMG.test(f)).map((f) => path.join(p, f));
    if (!images.length) continue;
    const notes = files.find((f) => /\.(txt|md)$/i.test(f));
    jobs.push({ title: e.name, images, notes: notes ? await readText(path.join(p, notes)) : '', move: [p] });
  } else if (IMG.test(e.name)) {
    const side = p.replace(/\.[^.]+$/, '.txt');
    const notes = await readText(side);
    jobs.push({ title: titleFrom(e.name), images: [p], notes, move: notes ? [p, side] : [p] });
  }
}

if (!jobs.length) {
  console.log('inbox/ vacío: nada que procesar.');
  process.exit(0);
}

const done = path.join(INBOX, '_processed', new Date().toISOString().replace(/[:.]/g, '-'));
await fs.mkdir(done, { recursive: true });

for (const job of jobs) {
  try {
    const buffers = await Promise.all(job.images.map((f) => fs.readFile(f)));
    const d = await createDesign({ title: job.title, ...parseNotes(job.notes) }, buffers);
    for (const m of job.move) await fs.rename(m, path.join(done, path.basename(m)));
    console.log(`✓ ${d.slug} (${d.images.length} img)`);
  } catch (err) {
    console.error(`✗ ${job.title}: ${err.message}`);
  }
}

await refreshCatalog();
console.log('\nListo. Pide a Claude: "clasifica los pendientes".');
