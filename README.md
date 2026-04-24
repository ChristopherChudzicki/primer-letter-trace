# primer-letter-trace

Printable letter, number, and handwriting practice sheets for young learners. Try it: **https://christopherchudzicki.github.io/primer-letter-trace/**

<!-- TODO: add screenshot of sample output -->

## Printing tips

For cleanest output:
1. Use **Portrait** orientation.
2. Under **Margins**, choose **None** (the app handles its own 0.5in margins).
3. If your browser shows a **Headers and footers** checkbox, uncheck it. Chrome hides this automatically when `@page { margin: 0 }` is set; Safari leaves it visible.

The app uses physical CSS units (inches, mm) so printed letter sizes match the Small/Medium/Large presets.

## Configuration via URL

Every control is reflected in the URL, so any sheet is shareable. Example:

```
?content=Aa%0ABb%0ACc&demo=1&trace=2&size=medium&theme=enchanted&paper=letter
```

Content is newline-separated (URL-encoded as `%0A`) — one line becomes one row on the printed sheet.

## How it works

The app has three conceptual layers:

1. **Config** (`src/config/`) — a single `SheetConfig` object describes the entire sheet. It's serialized to and from URL query params for shareability.
2. **Rendering** (`src/rendering/`) — loads the Andika TTF at startup via `opentype.js`, extracts font metrics (cap-height, x-height, ascender, descender), and provides primitives for generating SVG glyph paths at any size.
3. **Layout** (`src/layout/`) — composes pages by placing rows of letters on kindergarten-style three-line ruled paper. Ruled-line positions are **derived from the loaded font's metrics**, not hardcoded — so the midline is always at x-height and the headline is always at cap-height, regardless of size preset.

State flow uses a tiny `Store<SheetConfig>` pub/sub (`src/state/store.ts`). Three subscribers observe it: the form (which also pushes updates), the URL (via `history.replaceState`), and the preview renderer.

Trace letters use pre-computed **skeletons** — single-stroke centerlines extracted from each Andika glyph. See "Skeleton pipeline" below.

See `docs/superpowers/specs/2026-04-20-worksheets-design.md` for the full design spec, and `docs/superpowers/plans/2026-04-20-worksheets.md` for the implementation plan.

## Development

Run it locally:

```bash
npm install
npm run dev
```

Open the URL Vite prints. The form on the left controls the sheet; the preview on the right updates live.

### Project layout

```
src/
  config/         SheetConfig types, content parsing, URL codec
  state/          Store<T> pub/sub
  rendering/      Font loading, glyph path extraction, ruled-line geometry
  rendering/skeletons/   AUTO-GENERATED centerline data — do not edit by hand
  theming/        Theme data (colors + inline-SVG ornaments)
  layout/         Row and sheet composition
  ui/             Form binding, preview render, app entry
  styles/         Screen CSS + @page print CSS
  assets/
public/           Static assets served as-is (Andika TTF, OFL license)
scripts/          Build-time and dev tools (skeleton generator, debug viz)
tests/unit/       Vitest
tests/visual/     Playwright screenshot tests
docs/superpowers/ Design spec + implementation plan
```

### Testing

```bash
npm test                 # Unit tests (Vitest)
npm run test:e2e         # Visual regression (Playwright)
npm run test:e2e:update  # Regenerate Playwright snapshots (after intentional rendering changes)
```

Unit tests cover pure logic: URL encode/decode round-trip, content parsing, starter presets, font-metric math, glyph path generation, store subscription. Visual regression covers three representative row variants (demo+trace, demo-only, trace-only) across all four themes plus a 3-size sweep — 15 snapshots in total.

### Skeleton pipeline

Trace letters are rendered as **single-stroke centerlines** — not outline-dashed versions of the filled glyph. The centerlines are extracted offline from the font and committed as `src/rendering/skeletons/andika.ts`.

Pipeline (`scripts/generate-skeletons.ts`):

1. Load the TTF with `opentype.js`.
2. For each glyph (A–Z, a–z, 0–9): rasterize to a 512 × 512 bitmap via `@napi-rs/canvas`.
3. Run `skeleton-tracing-js` (Zhang-Suen thinning + polyline tracing) on the bitmap.
4. Simplify each polyline with Ramer-Douglas-Peucker (`simplify-js`).
5. Prune **spur** polylines (short stubs attached to a junction — artifacts from thinning sharp corners like W's peak). Keep short **junction pieces** (X's center crossing) and short **isolated** strokes (dot on `i`).
6. Emit as a TS module with SVG path strings in font units.

Regenerate on demand:

```bash
npm run generate:skeletons
```

This is a **commit-the-output** pipeline, not a CI-time step. Rerun only when the font is updated or the tuning (raster size, RDP tolerance, spur thresholds) changes.

### Common tasks

**Add a theme.** Add an entry to `THEMES` in `src/theming/themes.ts` (palette + motif library), and add the theme id to the `Theme` union in `src/config/types.ts` and the `THEMES` array in `src/config/url.ts`. Add a radio to the form in `src/ui/form.ts`. Update Playwright test `themes` array, then regenerate snapshots.

**Add a starter preset.** Add a `{key, label, config}` entry to `PRESETS` in `src/config/presets.ts`. The form dropdown and `presetByKey` lookup pick it up automatically. TypeScript ensures the `config` field stays in sync with `SheetConfig`.

**Add a new font.** Place the TTF in `public/`, point `generate-skeletons` at it (or add a second `generate:skeletons:<name>` script), generate into a new `src/rendering/skeletons/<name>.ts`. Teach `row.ts` to select the right skeleton set based on current font. Update `@font-face` in `src/styles/main.css`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build (type-check + Vite bundle)
- `npm run preview` — serve the production build
- `npm test` — unit tests
- `npm run test:watch` — unit tests, watch mode
- `npm run test:e2e` — Playwright visual regression
- `npm run test:e2e:update` — regenerate visual snapshots
- `npm run generate:skeletons` — regenerate centerline skeletons from the bundled font
- `npm run generate:og` — regenerate `public/og.png` from the live dev server (run `npm run dev` first)

## Font credit

This app bundles two fonts, both licensed under the **SIL Open Font License, Version 1.1**:

- **Andika** by SIL International — see `public/andika-OFL.txt`. Used by the worksheet.
- **Comic Relief** by the Comic Relief Project Authors — see `public/comic-relief-OFL.txt`. Available in the inspector for centerline comparison.
