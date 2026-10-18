// Lista compacta de lo que Claude tiene que analizar: lo justo para decidir qué imagen mirar.
import { listDesigns } from '../lib/store.js';

const pending = (await listDesigns()).filter((d) => d.status === 'pending');
if (!pending.length) {
  console.log('No hay diseños pendientes.');
  process.exit(0);
}
for (const d of pending) {
  const known = [d.category && `cat=${d.category}`, d.styles.length && `estilos=${d.styles.join(',')}`, d.url]
    .filter(Boolean).join(' ');
  console.log(`${d.slug} | "${d.title}" ${known}`);
  if (d.description) console.log(`  notas: ${d.description.replace(/\s+/g, ' ').slice(0, 200)}`);
  console.log(`  mirar: library/${d.slug}/${d.images[0].ai}${d.images.length > 1 ? ` (+${d.images.length - 1} más, solo si hace falta)` : ''}`);
}
console.log(`\n${pending.length} pendientes. Escribe inbox/classifications.json y ejecuta npm run apply.`);
