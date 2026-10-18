import fs from 'node:fs/promises';
import path from 'node:path';

// CATALOG.md es lo que Claude lee para inspirarse: solo texto, ~60 tokens por diseño.
// Las imágenes solo se abren después, y solo las 2–3 referencias elegidas.
export async function writeCatalog(root, designs) {
  const taxonomy = JSON.parse(await fs.readFile(path.join(root, 'taxonomy.json'), 'utf8'));
  const label = { 'sin-categoria': 'Sin categoría', ...Object.fromEntries(taxonomy.categories.map((c) => [c.id, c.label])) };

  const groups = new Map();
  for (const d of designs) {
    const key = d.category || 'sin-categoria';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  const pending = designs.filter((d) => d.status === 'pending').length;
  const lines = [
    '# Catálogo de referencias',
    '',
    `${designs.length} diseños · ${pending} pendientes de análisis · generado automáticamente, no editar a mano.`,
    'Formato: `slug` — título | estilos | paleta → lo que lo hace especial. Imagen para mirar: `library/<slug>/01.ai.webp`.',
    '',
  ];

  for (const [key, list] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${label[key] ?? key}`, '');
    for (const d of list) {
      const bits = [d.styles.join(', ') || '—', d.palette.slice(0, 4).join(' ') || '—'];
      lines.push(`- \`${d.slug}\` — ${d.title} | ${bits.join(' | ')}${d.status === 'pending' ? ' | PENDIENTE' : ''}`);
      if (d.standout) lines.push(`  → ${d.standout}`);
      const detail = [d.typography && `tipo: ${d.typography}`, d.layout && `layout: ${d.layout}`].filter(Boolean).join(' · ');
      if (detail) lines.push(`  ${detail}`);
    }
    lines.push('');
  }

  await fs.writeFile(path.join(root, 'CATALOG.md'), lines.join('\n'));
}
