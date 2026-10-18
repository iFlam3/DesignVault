import path from 'node:path';
import sharp from 'sharp';

sharp.cache(false);

const open = (input) => sharp(input, { limitInputPixels: false }).rotate();

// Tres derivados por imagen:
//  NN.webp        → versión optimizada para la galería (máx 1600px ancho)
//  NN.thumb.webp  → miniatura 4:3 recortada desde arriba
//  NN.ai.webp     → recorte pensado para que Claude lo mire gastando pocos tokens
//                   (~900x675 ≈ 800 tokens, frente a ~1600+ de una captura completa)
export async function processImage(input, dir, n) {
  const meta = await open(input).metadata();
  const w = meta.autoOrient?.width ?? meta.width;
  const h = meta.autoOrient?.height ?? meta.height;

  const file = `${n}.webp`;
  const thumb = `${n}.thumb.webp`;
  const ai = `${n}.ai.webp`;

  const full = await open(input)
    .resize({ width: 1600, height: 16000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(dir, file));

  await open(input)
    .resize({ width: 640, height: 480, fit: 'cover', position: 'top' })
    .webp({ quality: 72 })
    .toFile(path.join(dir, thumb));

  // Captura de página completa de escritorio: solo interesa el "above the fold".
  // Cualquier otra cosa (móvil, detalle, sección): la imagen entera reducida.
  const isFullPage = h > w * 1.5 && w >= 900;
  const aiPipe = isFullPage
    ? open(input).extract({ left: 0, top: 0, width: w, height: Math.round(w * 0.75) }).resize({ width: 900 })
    : open(input).resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true });
  await aiPipe.webp({ quality: 70 }).toFile(path.join(dir, ai));

  return { image: { file, thumb, ai, width: full.width, height: full.height }, palette: await extractPalette(input) };
}

// Paleta calculada localmente: Claude nunca gasta tokens en averiguar colores.
export async function extractPalette(input, max = 6) {
  const { data } = await open(input)
    .resize(64, 64, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
    buckets.set(key, b);
  }

  const picked = [];
  for (const b of [...buckets.values()].sort((a, z) => z.n - a.n)) {
    const c = [b.r / b.n, b.g / b.n, b.b / b.n];
    if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 48)) picked.push(c);
    if (picked.length === max) break;
  }
  return picked.map((c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''));
}
