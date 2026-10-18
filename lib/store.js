import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processImage } from './images.js';
import { writeCatalog } from './catalog.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LIBRARY = path.join(ROOT, 'library');
export const INBOX = path.join(ROOT, 'inbox');

const EDITABLE = ['title', 'description', 'url', 'category', 'styles', 'tags', 'palette', 'typography', 'layout', 'standout', 'status'];
const LISTS = ['styles', 'tags', 'palette'];

export function slugify(s) {
  return (
    String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'design'
  );
}

function dirOf(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw Object.assign(new Error('slug inválido'), { status: 400 });
  return path.join(LIBRARY, slug);
}

const exists = (p) => fs.access(p).then(() => true, () => false);

function normalize(patch) {
  const out = {};
  for (const k of EDITABLE) {
    if (!(k in patch)) continue;
    let v = patch[k];
    if (LISTS.includes(k)) {
      v = Array.isArray(v) ? v : String(v ?? '').split(',');
      v = [...new Set(v.map((x) => String(x).trim()).filter(Boolean))];
    } else {
      v = String(v ?? '').trim();
    }
    out[k] = v;
  }
  if (out.status && !['pending', 'classified'].includes(out.status)) delete out.status;
  return out;
}

export async function listDesigns() {
  await fs.mkdir(LIBRARY, { recursive: true });
  const entries = await fs.readdir(LIBRARY, { withFileTypes: true });
  const designs = await Promise.all(
    entries.filter((e) => e.isDirectory()).map((e) => readDesign(e.name).catch(() => null)),
  );
  return designs.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readDesign(slug) {
  return JSON.parse(await fs.readFile(path.join(dirOf(slug), 'design.json'), 'utf8'));
}

async function writeDesign(design) {
  design.updatedAt = new Date().toISOString();
  await fs.writeFile(path.join(dirOf(design.slug), 'design.json'), JSON.stringify(design, null, 2) + '\n');
  return design;
}

export async function refreshCatalog() {
  await writeCatalog(ROOT, await listDesigns());
}

export async function createDesign(fields, buffers) {
  const data = normalize(fields);
  if (!data.title) throw Object.assign(new Error('El título es obligatorio'), { status: 400 });

  await fs.mkdir(LIBRARY, { recursive: true });
  const base = slugify(data.title);
  let slug = base;
  for (let i = 2; await exists(path.join(LIBRARY, slug)); i++) slug = `${base}-${i}`;
  await fs.mkdir(dirOf(slug));

  const now = new Date().toISOString();
  const design = {
    slug,
    title: '',
    description: '',
    url: '',
    category: '',
    styles: [],
    tags: [],
    palette: [],
    typography: '',
    layout: '',
    standout: '',
    status: 'pending',
    images: [],
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  try {
    await addImageBuffers(design, buffers);
  } catch (err) {
    await fs.rm(dirOf(slug), { recursive: true, force: true });
    throw err;
  }
  return writeDesign(design);
}

async function addImageBuffers(design, buffers) {
  let next = Math.max(0, ...design.images.map((im) => parseInt(im.file, 10) || 0)) + 1;
  for (const buf of buffers) {
    const n = String(next++).padStart(2, '0');
    const { image, palette } = await processImage(buf, dirOf(design.slug), n);
    design.images.push(image);
    if (!design.palette.length) design.palette = palette;
  }
}

export async function addImages(slug, buffers) {
  const design = await readDesign(slug);
  await addImageBuffers(design, buffers);
  return writeDesign(design);
}

export async function removeImage(slug, file) {
  const design = await readDesign(slug);
  const img = design.images.find((im) => im.file === file);
  if (!img) throw Object.assign(new Error('Imagen no encontrada'), { status: 404 });
  design.images = design.images.filter((im) => im !== img);
  for (const f of [img.file, img.thumb, img.ai]) await fs.rm(path.join(dirOf(slug), f), { force: true });
  return writeDesign(design);
}

export async function updateDesign(slug, patch) {
  const design = await readDesign(slug);
  return writeDesign({ ...design, ...normalize(patch) });
}

export async function deleteDesign(slug) {
  await fs.rm(dirOf(slug), { recursive: true, force: true });
}
