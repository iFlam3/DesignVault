# Design Vault

Archivo local de referencias de diseño web (título, descripción, fotos, categoría y estilos),
pensado para que Claude lo use como fuente de inspiración real en vez de generar diseño genérico.

```bash
npm install
npm run dev        # http://localhost:3030
```

## Añadir diseños

**Opción A — carpeta `inbox/` (recomendada para lotes)**

```
inbox/
  stripe-pricing.png              → 1 diseño, título "stripe pricing"
  stripe-pricing.txt              → notas opcionales (url, "categoria: x", lo que te gustó)
  Linear home/                    → 1 diseño con varias imágenes
    01.png  02.png  notes.txt
```

```bash
npm run ingest     # optimiza a WebP, genera miniaturas, recortes para IA y paleta. 0 tokens.
```

Luego a Claude: **"clasifica los pendientes"**.

**Opción B — la web**: botón *Añadir diseño*. También queda como pendiente.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run ingest` | `inbox/` → `library/` (los originales van a `inbox/_processed/`, ignorado por git) |
| `npm run pending` | Lista compacta de pendientes para Claude |
| `npm run apply` | Aplica `inbox/classifications.json` y regenera `CATALOG.md` |
| `npm run catalog` | Regenera `CATALOG.md` |

## Usarlo desde otros proyectos

Copia `skill/SKILL.md` a `~/.claude/skills/design-vault/SKILL.md` y sustituye `VAULT_PATH`
(y/o `OWNER/REPO` si lo subes a GitHub).

## En la nube (GitHub)

Las imágenes se guardan ya optimizadas (~150–400 KB por diseño), así que caben de sobra en un repo normal
sin Git LFS. Sube capturas a `inbox/` desde la web de GitHub, abre una sesión de Claude Code en la nube
sobre el repo y pide "procesa el inbox": instala, ingesta, clasifica, hace commit y push.
