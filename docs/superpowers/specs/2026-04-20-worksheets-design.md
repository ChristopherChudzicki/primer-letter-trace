# Letter & Number Practice Worksheets — Design

**Date:** 2026-04-20
**Status:** Draft

## 1. Purpose

Generate printable worksheets for a pre-K child (~3yr 11mo) to practice forming capital letters, lowercase letters, and digits. The primary user is a parent configuring sheets for their own child; a secondary goal is that the tool is shareable (anyone can open a URL and generate sheets).

## 2. Success criteria

- The parent can produce a high-quality printable sheet for any set of letters or digits in under 30 seconds.
- Print output is of high physical quality — clean lines, correctly-sized letters on kindergarten-style ruled paper, consistent typography.
- A sheet URL can be shared with anyone; opening that URL reproduces the identical sheet.
- The core letter-formation loop works end-to-end before any optional features (theming, phonics, word mode) are added.

## 3. Scope

### In scope for v1

- Web app, statically hosted.
- Configurable sheet content: user enters space-separated items in a text field. Presets auto-fill the field with common sets (`A–Z`, `a–z`, `Aa–Zz`, `0–9`).
- Two page layouts:
  - **Single-item-per-page**: one item is the focus of a whole page, with a large header and several rows of practice.
  - **Multi-item-per-page**: many items on one page, one row per character.
- Three row styles (user picks one per sheet):
  - **Combo**: demo letter, two traceable letters, then blank copy space.
  - **All-trace**: row of dashed letters to trace.
  - **Demo + blank**: one demo letter, rest of row is blank ruled space for copy.
- Kindergarten-style three-line ruled paper (solid headline, dashed midline, solid baseline, descender space).
- Paper size: US Letter default, A4 available.
- Letter size: three presets — **Small** (~60pt, cap-height ≈ 0.625″), **Medium** (~75pt, cap-height ≈ 0.75″, default), **Large** (~95pt, cap-height ≈ 0.95″).
- Light decorative theming: none / fairy / unicorn / princess. Manifests as ruled-line color, a small corner ornament (inline SVG), and an accent color. No external art assets.
- Shareable URL: the full `SheetConfig` is encoded in query params.
- Printing via the browser's native print dialog (Chrome print-to-PDF is the assumed primary output path).

### Out of scope for v1

- Letter-sound / phonics pictures on the sheet.
- Word- or sentence-specific layouts (the engine accepts arbitrary text; there is no specialized word-practice UI).
- Handwriting directionality arrows (numbered stroke order indicators).
- User-uploaded custom fonts.
- Mixing row styles on a single page.
- Saved sheets, favorites, or accounts.
- Free-form numeric letter-size input (only the three presets are selectable in v1).

## 4. Technical stack

| Piece | Choice | Rationale |
|---|---|---|
| Language | TypeScript | User preference; type safety for config objects. |
| Framework | None — plain DOM | App is a form plus a printable DOM tree. Framework overhead is not earning its weight. |
| Build | Vite | Modern dev server, zero-config TypeScript, simple static build. |
| Letter rendering | `opentype.js` (MIT) | Parse TTF, extract glyph outlines as SVG paths. Gives full control over stroke styling for trace variants. |
| Font | Andika (OFL, SIL International) | Literacy-oriented font: single-story `a`, `g`, `q`; clean shapes; free for any use; bundled with the app. |
| Styling | Plain CSS + `@page` + `@media print` | No framework/design system needed at this scope. |
| Hosting | Static (GitHub Pages or similar) | No backend. |

### Alternatives considered

- **React/Solid/Preact**: rejected. The app's UI is a small form plus a printable DOM; framework reconciliation provides no value for the print path, and the form is simple enough for direct DOM code. If later features (drag-and-drop row editing, template galleries, multi-step wizards) make it earn its weight, a framework can be introduced then — the core letter-rendering logic is framework-agnostic.
- **Server-side PDF via headless Chrome**: rejected. Adds hosting complexity with no quality win over client-side print-to-PDF for this content.
- **LaTeX**: rejected. Excellent typography but poor sharing story; modern browser print output is indistinguishable from LaTeX for this use case.

## 5. Architecture

```
src/
  fonts/            Andika TTF bundled as a static asset
  rendering/        opentype.js wrapper, glyph → SVG path, dash styling
  layout/           Page templates, row templates, ruled-line SVG generator
  theming/          Theme data (colors, corner ornament SVGs)
  ui/               Form controls, URL param sync, preview wiring
  config/           SheetConfig type, URL encode/decode, validation
  styles/           CSS (screen + print)
  main.ts           Entry point
```

`SheetConfig` is the single source of truth. The form writes to it; it is mirrored in the URL; the renderer reads from it.

### `SheetConfig` shape

```ts
type SheetConfig = {
  content: string[]                          // parsed items, e.g. ["Aa", "Bb", "Cc"] or ["1","2","3"]
  layout: "single" | "multi"
  rowStyle: "combo" | "all-trace" | "demo-blank"
  size: "small" | "medium" | "large"         // maps to font-size and, via font metrics, to all ruled-line spacing
  theme: "none" | "fairy" | "unicorn" | "princess"
  paperSize: "letter" | "a4"
}
```

Items are parsed from the user's text input by splitting on whitespace. An "item" can be one character (`"A"`) or several (`"Aa"`, `"abc"`, `"Mom"`).

## 6. Letter rendering pipeline

1. Fetch the Andika TTF once at app startup.
2. Parse with `opentype.js` to obtain a `Font` object. Read its metrics: `unitsPerEm`, `ascender`, `descender`, `xHeight`, `capHeight`.
3. For each character needed: call `font.getPath(char, x, y, size)` and use `path.toSVG()` to produce the `d` attribute of an SVG path.
4. Wrap the path in an `<svg viewBox>` whose coordinate system matches the ruled-line geometry (see below) so letters and ruled lines align exactly.
5. Render modes:
   - **Solid letter**: `<path d="…" fill="currentColor" />`
   - **Traced letter**: `<path d="…" fill="none" stroke="#888" stroke-width="1.5" stroke-dasharray="4 4" />`
   - The path is identical between the two — only the paint style changes. This guarantees pixel-perfect overlay.

### Ruled-line geometry derives from font metrics

Ruled lines are **not** at hardcoded pixel offsets. Instead, for the chosen font size:

- **Baseline** = the font's baseline y-coordinate in the SVG.
- **Midline** = baseline − `xHeight` (in font units, scaled to the rendering size).
- **Headline** = baseline − `capHeight`.
- **Descender line** = baseline + `|descender|`.

This is a deliberate quality-driving decision: the ruled lines are guaranteed to match the font's own metrics, so lowercase `x`-height sits on the midline and capital `A`-height sits on the headline. If the font is ever swapped, ruled lines re-derive automatically.

## 7. Page assembly

### Multi-item-per-page layout

One printable page. One row per *character* in each item.

- Input `content: ["Aa", "Bb", "Cc"]` → 6 rows: `A`, `a`, `B`, `b`, `C`, `c`.
- Each row uses the chosen `rowStyle`.
- The page fits as many rows as vertically possible at the selected letter size. If content exceeds one page, continue on subsequent pages.

### Single-item-per-page layout

One page per item.

- Page header: the item rendered large (e.g., "Aa" displayed prominently at the top of the page).
- Body: multiple practice rows below the header, alternating uppercase and lowercase characters if the item has multiple chars. For a single-char item (e.g., `"A"`), all rows practice that character.
- Each row uses the chosen `rowStyle`.

## 8. Print output

- `@page { size: letter portrait; margin: 0.5in; }` (or `size: a4 portrait` when A4 is selected).
- All physical dimensions in `mm` or `in` — avoid `px` for layout so output is deterministic across devices.
- Screen preview renders the printable DOM at natural physical size with a light chrome (page shadow, subtle background) around each sheet.
- Each sheet is one `<section>`; `page-break-after: always` separates sheets in the print view.
- Browser default print headers/footers (URL, date, page number) are not fully suppressible by CSS in Chrome; the app UI displays a "Printing tips" note telling the user to uncheck "Headers and footers" in the print dialog the first time.

## 9. Theming

Themes are pure data, no external assets:

```ts
type Theme = {
  ruleColor: string       // CSS color for ruled lines
  accentColor: string     // color for the corner ornament
  cornerSvg: string       // inline SVG drawn by hand (star, unicorn horn, fairy wand, crown)
}
```

All corner ornaments are simple vector shapes authored inline. Theme applies at the sheet level (sheet header + ruled-line color + top-right corner); it does not affect individual row structure.

## 10. URL encoding

`SheetConfig` is serialized into URL query params on every UI change so the current URL always reproduces the current sheet. Format:

```
?content=Aa+Bb+Cc&layout=multi&row=combo&size=medium&theme=fairy&paper=letter
```

Encoding is symmetric: on page load, the URL is parsed into a `SheetConfig` that initializes the form. This gives shareability for free — copy URL, send to someone, they see the identical sheet.

## 11. Testing

- **Unit tests**
  - URL encode/decode round-trip for every valid `SheetConfig` variant.
  - Font-metric → ruled-line geometry math.
  - Glyph path generation for A-Z, a-z, 0-9 (verify each returns a non-empty SVG path).
  - Text input parsing (space splitting, whitespace trimming, empty input).
- **Visual regression** (Playwright screenshot tests)
  - One snapshot per combination of `(layout, rowStyle, theme)` at the default size = 2 × 3 × 4 = 24 snapshots, using a fixed sample content string.
  - Plus a size-sweep: default `(layout, rowStyle, theme)` × 3 sizes = 3 extra snapshots to catch size-related layout regressions without exploding the grid.
- **Print validation**
  - Automated PDF-diff is out of scope for v1.
  - README includes a manual checklist: print one sheet per layout on real paper, verify letter sizing, ruled-line alignment, no clipped content, correct paper size.

## 12. Risks & open questions

- **Font licensing**: Andika is OFL; must bundle its OFL license file with the distribution and acknowledge per the license terms.
- **Browser print variance**: Chrome is the reference target. Firefox and Safari may render print slightly differently (especially `@page` margin boxes for suppressing default headers/footers). README will list known differences.
- **First-print UX**: users unfamiliar with print-to-PDF may produce suboptimal output on first try (margins, headers). Mitigated by a short "Printing tips" section in the app UI next to the Print button.
