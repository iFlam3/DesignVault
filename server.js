import express from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, LIBRARY, listDesigns, readDesign, createDesign, updateDesign,
  deleteDesign, addImages, removeImage, refreshCatalog,
} from './lib/store.js';

const PORT = process.env.PORT || 3030;
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 30 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// Express 4 no captura promesas rechazadas: este wrapper las manda al handler de errores.
const h = (fn) => (req, res, next) => fn(req, res).catch(next);
const mutate = (fn) => h(async (req, res) => {
  const result = await fn(req);
  await refreshCatalog();
  res.json(result ?? { ok: true });
});

app.use(express.json());
app.use('/library', express.static(LIBRARY, { maxAge: '1h' }));
app.use(express.static(path.join(ROOT, 'public')));

app.get('/api/taxonomy', h(async (_req, res) => {
  res.type('json').send(await fs.readFile(path.join(ROOT, 'taxonomy.json'), 'utf8'));
}));
app.get('/api/designs', h(async (_req, res) => res.json(await listDesigns())));
app.get('/api/designs/:slug', h(async (req, res) => res.json(await readDesign(req.params.slug))));

app.post('/api/designs', upload.array('images'), mutate((req) => {
  if (!req.files?.length) throw Object.assign(new Error('Añade al menos una imagen'), { status: 400 });
  return createDesign(req.body, req.files.map((f) => f.buffer));
}));
app.patch('/api/designs/:slug', mutate((req) => updateDesign(req.params.slug, req.body)));
app.delete('/api/designs/:slug', mutate((req) => deleteDesign(req.params.slug)));
app.post('/api/designs/:slug/images', upload.array('images'), mutate((req) =>
  addImages(req.params.slug, (req.files ?? []).map((f) => f.buffer))));
app.delete('/api/designs/:slug/images/:file', mutate((req) => removeImage(req.params.slug, req.params.file)));

app.use((err, _req, res, _next) => {
  const status = err.status ?? (err.code === 'ENOENT' ? 404 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 404 ? 'No encontrado' : err.message });
});

app.listen(PORT, () => console.log(`Design Vault → http://localhost:${PORT}`));
