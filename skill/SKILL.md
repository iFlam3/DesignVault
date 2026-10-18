---
name: design-vault
description: Consulta el archivo personal de referencias de diseño web del usuario (Design Vault) antes de diseñar una web, landing, portfolio o UI nueva, para basar la dirección visual en referencias reales elegidas por el usuario en lugar de patrones genéricos de IA. Úsala cuando el usuario pida crear o rediseñar una web, pida inspiración, o diga "mira mis referencias" / "usa el vault".
---

# Design Vault

Fuente de referencias (usa la primera que funcione):
1. Local: `VAULT_PATH/CATALOG.md` ← sustituye VAULT_PATH por la ruta del repo al instalar.
2. GitHub: `https://raw.githubusercontent.com/OWNER/REPO/main/CATALOG.md` (repo público), o `gh api` / clonar si es privado.

## Flujo (en este orden, barato → caro)

1. **Lee solo `CATALOG.md`.** Es texto; no abras imágenes todavía.
2. **Elige 2–3 referencias** que encajen con el brief por categoría, estilo y, sobre todo, `standout`.
   Mejor de categorías distintas: una da la estructura, otra la tipografía, otra el color o un detalle.
3. **Abre solo sus `01.ai.webp`** (~800 tokens c/u). Si el catálogo ya describe bien lo que necesitas, sáltate este paso.
4. **Escribe al usuario la dirección antes de codificar**, en 4–6 líneas:
   - qué tomas de cada referencia (por slug) y qué NO,
   - paleta concreta (hex del catálogo, ajustada a la marca),
   - pareja tipográfica concreta,
   - el único gesto memorable de la página.
5. Construye.

## Reglas anti-slop

- Nunca copies una referencia entera. Combina movimientos concretos de varias.
- El brief del usuario manda; las referencias son vocabulario, no plantilla.
- Si ninguna referencia encaja, dilo y propone qué tipo de referencia convendría añadir al vault.
- Evita por defecto: degradado violeta→azul, hero centrado + 3 tarjetas de features con icono, glassmorphism sin motivo,
  Inter en todo, sombras suaves en todo, emojis como iconos, "Unlock the power of…". Úsalos solo si una referencia lo justifica.
