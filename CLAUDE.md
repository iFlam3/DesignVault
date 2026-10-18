# Design Vault — instrucciones para Claude

Repositorio de referencias de diseño web. Cada diseño vive en `library/<slug>/`:
`design.json` (metadatos) + `NN.webp` (galería) + `NN.thumb.webp` + `NN.ai.webp` (recorte barato para ti).
`CATALOG.md` es un índice de texto generado automáticamente. **Nunca lo edites a mano.**

## Regla de oro: gastar tokens solo una vez por imagen

- Para analizar, abre **solo** `NN.ai.webp` (~800 tokens). Nunca `NN.webp` (puede ser una captura de 1600×10000).
- Solo la `01.ai.webp`, salvo que el título/notas sugieran que lo interesante está en otra imagen.
- La paleta ya está calculada localmente: no la deduzcas de la imagen, solo corrígela si es claramente mala.
- Lo que escribas al clasificar es lo que leerás en el futuro en vez de la imagen: que sea concreto.

## "Procesa el inbox" / "clasifica los pendientes"

1. `npm run ingest` (si hay archivos en `inbox/`). No mires las imágenes de `inbox/`.
2. `npm run pending` → lista de slugs con la ruta exacta de la imagen a mirar.
3. Mira cada `ai.webp` indicada.
4. Escribe **un solo** `inbox/classifications.json` con todos:
   ```json
   {
     "<slug>": {
       "category": "<id de taxonomy.json>",
       "styles": ["2-4 de taxonomy.json; puedes añadir uno nuevo si ninguno encaja"],
       "tags": ["elementos concretos: marquee, cursor-custom, nav-lateral, grano, …"],
       "typography": "familia/clasificación + cómo se usa (p.ej. 'serif display gigante 160px + mono 11px en labels')",
       "layout": "estructura del above-the-fold en una línea",
       "standout": "EL movimiento específico que vale la pena robar, en 1 frase",
       "description": "solo si el usuario no escribió notas; 1-2 frases"
     }
   }
   ```
   No sobrescribas `description` ni `title` si el usuario ya los puso.
5. `npm run apply` → aplica, marca como `classified`, regenera `CATALOG.md`, borra el json.
6. Si el repo tiene remoto git: commit `"design-vault: +N referencias"` y push (pregunta antes de hacer push si no se ha pedido).

### Qué es un buen `standout`
- Mal: "Diseño limpio y moderno con buena tipografía."
- Bien: "Titular serif a 18vw cortado por el borde derecho; el resto de la página es texto 13px en dos columnas."
- Bien: "Nav como índice numerado a la izquierda que se queda fijo; cada sección cambia el color de fondo entero."

## Usar el archivo como inspiración

Ver `skill/SKILL.md` (el mismo flujo, instalable como skill global).
