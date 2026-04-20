# Worksheets App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static web app that generates printable letter, number, and handwriting practice sheets for a pre-K child. Letters render via `opentype.js` from an OFL-licensed font (Andika), with trace variants produced by applying `stroke-dasharray` to extracted glyph paths. Print output driven by `@page` + physical CSS units.

**Architecture:** One-page Vite app, no framework. A tiny `Store<SheetConfig>` is the single source of truth — the form writes it, the URL mirrors it, the renderer reads it. Letter rendering and ruled-line geometry both derive from the font's own metrics so they stay in sync. Themes are pure data (colors + inline SVG ornaments).

**Tech Stack:** TypeScript, Vite, opentype.js, Vitest (unit), Playwright (visual regression). Andika font (OFL, SIL International) bundled as a static asset.

**Spec reference:** `docs/superpowers/specs/2026-04-20-worksheets-design.md`

---

## File structure

```
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
playwright.config.ts
index.html

public/
  andika.ttf            OFL-licensed font asset
  OFL.txt               Andika license

src/
  main.ts               Entry point — loads font, builds app
  config/
    types.ts            SheetConfig type + enums + DEFAULT_CONFIG
    content.ts          parseContent, PRESETS, presetToText
    url.ts              configFromURL, configToURLParams
  state/
    store.ts            Store<T> — value, set, update, subscribe, run
  rendering/
    font.ts             loadFont, extractAsset (metrics)
    glyph.ts            glyphPath (SVG path data for a char)
    ruled-lines.ts      computeLines, CAP_HEIGHT_PX
  theming/
    themes.ts           THEMES (colors + ornament SVGs)
  layout/
    row.ts              renderRow (three row styles)
    sheet.ts            buildSheets (both layouts)
  ui/
    form.ts             bindForm — form ↔ store wiring
    preview.ts          renderPreview (config → DOM)
    app.ts              startApp — creates store, wires form + URL + preview
  styles/
    main.css            screen styles
    print.css           @page + print overrides

tests/
  unit/
    content.test.ts
    url.test.ts
    store.test.ts
    font.test.ts
    glyph.test.ts
    ruled-lines.test.ts
  visual/
    worksheet.spec.ts   Playwright visual regression
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `src/main.ts`, `public/andika.ttf`, `public/OFL.txt`, `.gitattributes`

- [ ] **Step 1: Initialize npm and install dependencies**

Run:
```bash
cd /Users/cchudzicki/dev/worksheets
npm init -y
npm install --save opentype.js
npm install --save-dev typescript vite vitest @vitest/ui jsdom @types/node @types/opentype.js @playwright/test
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"],
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Write `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  expect: { toHaveScreenshot: { maxDiffPixels: 100 } },
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Worksheets</title>
    <link rel="stylesheet" href="/src/styles/main.css" />
    <link rel="stylesheet" href="/src/styles/print.css" />
  </head>
  <body>
    <aside class="controls" id="controls"></aside>
    <main class="preview" id="preview"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Write placeholder `src/main.ts`**

```ts
console.log("worksheets app loaded");
```

- [ ] **Step 8: Create empty placeholder CSS files**

```bash
mkdir -p src/styles
: > src/styles/main.css
: > src/styles/print.css
```

- [ ] **Step 9: Download Andika font and OFL license**

Run:
```bash
mkdir -p public
curl -L -o public/andika.ttf "https://cdn.jsdelivr.net/fontsource/fonts/andika@latest/latin-400-normal.ttf"
curl -L -o public/OFL.txt "https://openfontlicense.org/documents/OFL.txt"
```

If either URL fails, fall back to manual download from https://software.sil.org/andika/ (TTF) and https://openfontlicense.org (license text). Verify both files exist and `andika.ttf` is > 100kb:

```bash
ls -la public/andika.ttf public/OFL.txt
```

- [ ] **Step 10: Add npm scripts to `package.json`**

Edit `package.json` — replace the `scripts` section with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:update": "playwright test --update-snapshots"
}
```

Also set `"type": "module"` at the top level of `package.json`.

- [ ] **Step 11: Write `.gitattributes`**

```
*.ttf binary
```

- [ ] **Step 12: Verify dev server boots**

Run:
```bash
npm run dev
```

Expected: Vite starts, prints a local URL. Open it — blank page, console should log "worksheets app loaded". Stop the server (Ctrl+C).

- [ ] **Step 13: Verify vitest boots**

Run:
```bash
npm test
```

Expected: "No test files found." (Fine — we haven't written tests yet.)

- [ ] **Step 14: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts index.html src public .gitattributes
git commit -m "feat: initial project scaffold with Vite + TypeScript + Andika font"
```

---

## Task 2: Config types and content parsing

**Files:**
- Create: `src/config/types.ts`, `src/config/content.ts`, `tests/unit/content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/content.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { parseContent, PRESETS, presetToText } from "../../src/config/content";

describe("parseContent", () => {
  test("splits single-space-separated items", () => {
    expect(parseContent("A B C")).toEqual(["A", "B", "C"]);
  });

  test("collapses runs of whitespace", () => {
    expect(parseContent("A  B\tC\n D")).toEqual(["A", "B", "C", "D"]);
  });

  test("trims leading and trailing whitespace", () => {
    expect(parseContent("  A B  ")).toEqual(["A", "B"]);
  });

  test("keeps multi-character items intact", () => {
    expect(parseContent("Aa Bb Cc")).toEqual(["Aa", "Bb", "Cc"]);
  });

  test("returns empty array for empty or whitespace-only input", () => {
    expect(parseContent("")).toEqual([]);
    expect(parseContent("   \t  ")).toEqual([]);
  });
});

describe("presets", () => {
  test("uppercase is A-Z", () => {
    expect(PRESETS.uppercase.join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });

  test("lowercase is a-z", () => {
    expect(PRESETS.lowercase.join("")).toBe("abcdefghijklmnopqrstuvwxyz");
  });

  test("pairs are Aa through Zz", () => {
    expect(PRESETS.pairs[0]).toBe("Aa");
    expect(PRESETS.pairs[25]).toBe("Zz");
    expect(PRESETS.pairs).toHaveLength(26);
  });

  test("digits are 0-9", () => {
    expect(PRESETS.digits).toEqual(["0","1","2","3","4","5","6","7","8","9"]);
  });

  test("presetToText joins with single spaces", () => {
    expect(presetToText("digits")).toBe("0 1 2 3 4 5 6 7 8 9");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `src/config/content` not found.

- [ ] **Step 3: Write `src/config/types.ts`**

```ts
export type Layout = "single" | "multi";
export type RowStyle = "combo" | "all-trace" | "demo-blank";
export type Size = "small" | "medium" | "large";
export type Theme = "none" | "fairy" | "unicorn" | "princess";
export type PaperSize = "letter" | "a4";

export interface SheetConfig {
  content: string[];
  layout: Layout;
  rowStyle: RowStyle;
  size: Size;
  theme: Theme;
  paperSize: PaperSize;
}

export const DEFAULT_CONFIG: SheetConfig = {
  content: ["A", "B", "C"],
  layout: "multi",
  rowStyle: "combo",
  size: "medium",
  theme: "none",
  paperSize: "letter",
};
```

- [ ] **Step 4: Write `src/config/content.ts`**

```ts
export function parseContent(text: string): string[] {
  return text.trim().split(/\s+/).filter((s) => s.length > 0);
}

const UPPERCASE = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const LOWERCASE = Array.from("abcdefghijklmnopqrstuvwxyz");

export const PRESETS = {
  uppercase: UPPERCASE,
  lowercase: LOWERCASE,
  pairs: UPPERCASE.map((u, i) => u + LOWERCASE[i]),
  digits: Array.from("0123456789"),
} as const;

export type PresetKey = keyof typeof PRESETS;

export function presetToText(key: PresetKey): string {
  return PRESETS[key].join(" ");
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test`
Expected: all tests in `content.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add src/config tests/unit/content.test.ts
git commit -m "feat(config): SheetConfig types, content parser, presets"
```

---

## Task 3: URL encoding/decoding

**Files:**
- Create: `src/config/url.ts`, `tests/unit/url.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/url.test.ts`:

```ts
import { describe, test, expect } from "vitest";
import { configFromURL, configToURLParams } from "../../src/config/url";
import { DEFAULT_CONFIG, SheetConfig } from "../../src/config/types";

describe("configFromURL", () => {
  test("returns defaults for a bare URL", () => {
    expect(configFromURL(new URL("http://x/"))).toEqual(DEFAULT_CONFIG);
  });

  test("parses all fields from query string", () => {
    const url = new URL("http://x/?content=A+B+C&layout=single&row=all-trace&size=large&theme=fairy&paper=a4");
    expect(configFromURL(url)).toEqual({
      content: ["A", "B", "C"],
      layout: "single",
      rowStyle: "all-trace",
      size: "large",
      theme: "fairy",
      paperSize: "a4",
    });
  });

  test("ignores invalid enum values and uses defaults", () => {
    const url = new URL("http://x/?layout=banana&size=enormous");
    const config = configFromURL(url);
    expect(config.layout).toBe(DEFAULT_CONFIG.layout);
    expect(config.size).toBe(DEFAULT_CONFIG.size);
  });

  test("empty content falls back to default", () => {
    const url = new URL("http://x/?content=");
    expect(configFromURL(url).content).toEqual(DEFAULT_CONFIG.content);
  });
});

describe("configToURLParams", () => {
  test("round-trips a non-default config", () => {
    const original: SheetConfig = {
      content: ["Aa", "Bb", "Cc"],
      layout: "single",
      rowStyle: "demo-blank",
      size: "large",
      theme: "princess",
      paperSize: "a4",
    };
    const params = configToURLParams(original);
    const url = new URL("http://x/?" + params.toString());
    expect(configFromURL(url)).toEqual(original);
  });

  test("round-trips the default config", () => {
    const params = configToURLParams(DEFAULT_CONFIG);
    const url = new URL("http://x/?" + params.toString());
    expect(configFromURL(url)).toEqual(DEFAULT_CONFIG);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `src/config/url` not found.

- [ ] **Step 3: Write `src/config/url.ts`**

```ts
import {
  SheetConfig, Layout, RowStyle, Size, Theme, PaperSize, DEFAULT_CONFIG,
} from "./types";
import { parseContent } from "./content";

const LAYOUTS: readonly Layout[] = ["single", "multi"] as const;
const ROW_STYLES: readonly RowStyle[] = ["combo", "all-trace", "demo-blank"] as const;
const SIZES: readonly Size[] = ["small", "medium", "large"] as const;
const THEMES: readonly Theme[] = ["none", "fairy", "unicorn", "princess"] as const;
const PAPER_SIZES: readonly PaperSize[] = ["letter", "a4"] as const;

function coerce<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function configFromURL(url: URL): SheetConfig {
  const p = url.searchParams;
  const parsed = parseContent(p.get("content") ?? "");
  return {
    content: parsed.length > 0 ? parsed : DEFAULT_CONFIG.content,
    layout: coerce(p.get("layout"), LAYOUTS, DEFAULT_CONFIG.layout),
    rowStyle: coerce(p.get("row"), ROW_STYLES, DEFAULT_CONFIG.rowStyle),
    size: coerce(p.get("size"), SIZES, DEFAULT_CONFIG.size),
    theme: coerce(p.get("theme"), THEMES, DEFAULT_CONFIG.theme),
    paperSize: coerce(p.get("paper"), PAPER_SIZES, DEFAULT_CONFIG.paperSize),
  };
}

export function configToURLParams(config: SheetConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("content", config.content.join(" "));
  p.set("layout", config.layout);
  p.set("row", config.rowStyle);
  p.set("size", config.size);
  p.set("theme", config.theme);
  p.set("paper", config.paperSize);
  return p;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: all URL tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config/url.ts tests/unit/url.test.ts
git commit -m "feat(config): URL encoding/decoding with round-trip support"
```

---

## Task 4: State store

A tiny pub/sub container for a single immutable value. The form, the URL, and the preview all subscribe to the store; the form and popstate handler push updates into it. This is the core of the app's data flow — the pattern React (and friends) implement internally.

**Files:**
- Create: `src/state/store.ts`, `tests/unit/store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/store.test.ts`:

```ts
import { describe, test, expect, vi } from "vitest";
import { Store } from "../../src/state/store";

describe("Store", () => {
  test("holds initial value", () => {
    const s = new Store({ n: 1 });
    expect(s.value).toEqual({ n: 1 });
  });

  test("set replaces value and notifies subscribers", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    s.subscribe(fn);
    s.set({ n: 2 });
    expect(s.value).toEqual({ n: 2 });
    expect(fn).toHaveBeenCalledWith({ n: 2 });
  });

  test("update merges a partial into the current value", () => {
    const s = new Store({ a: 1, b: 2 });
    s.update({ b: 9 });
    expect(s.value).toEqual({ a: 1, b: 9 });
  });

  test("subscribe returns an unsubscribe function", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    const unsub = s.subscribe(fn);
    s.set({ n: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    s.set({ n: 3 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("run invokes fn immediately with current value, then subscribes", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    s.run(fn);
    expect(fn).toHaveBeenNthCalledWith(1, { n: 1 });
    s.set({ n: 2 });
    expect(fn).toHaveBeenNthCalledWith(2, { n: 2 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("set with the same reference does not notify", () => {
    const s = new Store({ n: 1 });
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(s.value);
    expect(fn).not.toHaveBeenCalled();
  });

  test("multiple subscribers all fire", () => {
    const s = new Store({ n: 1 });
    const a = vi.fn();
    const b = vi.fn();
    s.subscribe(a);
    s.subscribe(b);
    s.set({ n: 2 });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `src/state/store` not found.

- [ ] **Step 3: Write `src/state/store.ts`**

```ts
export type Listener<T> = (value: T) => void;

export class Store<T> {
  private current: T;
  private listeners = new Set<Listener<T>>();

  constructor(initial: T) {
    this.current = initial;
  }

  get value(): T {
    return this.current;
  }

  set(next: T): void {
    if (next === this.current) return;
    this.current = next;
    for (const fn of this.listeners) fn(this.current);
  }

  update(partial: Partial<T>): void {
    this.set({ ...this.current, ...partial });
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  // Convenience: invoke fn with current value immediately, then subscribe for future changes.
  run(fn: Listener<T>): () => void {
    fn(this.current);
    return this.subscribe(fn);
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: all store tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/state tests/unit/store.test.ts
git commit -m "feat(state): Store<T> pub/sub container"
```

---

## Task 5: Font loading and metric extraction

**Files:**
- Create: `src/rendering/font.ts`, `tests/unit/font.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/font.test.ts`:

```ts
import { describe, test, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { extractAsset, FontAsset } from "../../src/rendering/font";

let asset: FontAsset;

beforeAll(() => {
  const buf = readFileSync("public/andika.ttf");
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const font = opentype.parse(ab);
  asset = extractAsset(font);
});

describe("extractAsset", () => {
  test("exposes unitsPerEm", () => {
    expect(asset.unitsPerEm).toBeGreaterThan(0);
  });

  test("ascender >= capHeight", () => {
    expect(asset.ascender).toBeGreaterThanOrEqual(asset.capHeight);
  });

  test("xHeight < capHeight", () => {
    expect(asset.xHeight).toBeLessThan(asset.capHeight);
  });

  test("descender is positive (absolute value)", () => {
    expect(asset.descender).toBeGreaterThan(0);
  });

  test("capHeight is positive", () => {
    expect(asset.capHeight).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `src/rendering/font` not found.

- [ ] **Step 3: Write `src/rendering/font.ts`**

```ts
import opentype from "opentype.js";

export interface FontAsset {
  font: opentype.Font;
  unitsPerEm: number;
  ascender: number;
  descender: number; // stored as positive value (absolute)
  xHeight: number;
  capHeight: number;
}

export function extractAsset(font: opentype.Font): FontAsset {
  const upm = font.unitsPerEm;
  const os2 = (font.tables as { os2?: { sxHeight?: number; sCapHeight?: number } }).os2;
  const xHeight = os2?.sxHeight && os2.sxHeight > 0 ? os2.sxHeight : Math.round(upm * 0.5);
  const capHeight = os2?.sCapHeight && os2.sCapHeight > 0 ? os2.sCapHeight : Math.round(upm * 0.7);
  return {
    font,
    unitsPerEm: upm,
    ascender: font.ascender,
    descender: Math.abs(font.descender),
    xHeight,
    capHeight,
  };
}

export async function loadFont(url: string): Promise<FontAsset> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return extractAsset(opentype.parse(buffer));
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: all font tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rendering/font.ts tests/unit/font.test.ts
git commit -m "feat(rendering): font loading + metric extraction"
```

---

## Task 6: Glyph rendering

**Files:**
- Create: `src/rendering/glyph.ts`, `tests/unit/glyph.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/glyph.test.ts`:

```ts
import { describe, test, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { extractAsset, FontAsset } from "../../src/rendering/font";
import { glyphPath } from "../../src/rendering/glyph";

let asset: FontAsset;

beforeAll(() => {
  const buf = readFileSync("public/andika.ttf");
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  asset = extractAsset(opentype.parse(ab));
});

describe("glyphPath", () => {
  test("returns a non-empty SVG path for a capital letter", () => {
    const g = glyphPath(asset, "A", 100);
    expect(g.pathD.length).toBeGreaterThan(0);
    expect(g.pathD).toMatch(/^[MmLlCcZz]/);
  });

  test("returns a positive advance width", () => {
    const g = glyphPath(asset, "A", 100);
    expect(g.width).toBeGreaterThan(0);
  });

  test("covers A-Z, a-z, 0-9", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
    for (const c of chars) {
      const g = glyphPath(asset, c, 100);
      expect(g.pathD.length, `missing glyph for ${c}`).toBeGreaterThan(0);
    }
  });

  test("scales with sizePx", () => {
    const small = glyphPath(asset, "A", 50);
    const large = glyphPath(asset, "A", 100);
    expect(large.width).toBeCloseTo(small.width * 2, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `src/rendering/glyph` not found.

- [ ] **Step 3: Write `src/rendering/glyph.ts`**

```ts
import type { FontAsset } from "./font";

export interface GlyphSvg {
  pathD: string;
  width: number; // advance width in px at this size
  xMin: number;  // ink left edge in px relative to origin
  xMax: number;  // ink right edge in px
}

export function glyphPath(asset: FontAsset, char: string, sizePx: number, x = 0, y = 0): GlyphSvg {
  const path = asset.font.getPath(char, x, y, sizePx);
  const bb = path.getBoundingBox();
  const glyph = asset.font.charToGlyph(char);
  const advance = (glyph.advanceWidth ?? asset.unitsPerEm * 0.5) * (sizePx / asset.unitsPerEm);
  return {
    pathD: path.toPathData(3),
    width: advance,
    xMin: bb.x1 - x,
    xMax: bb.x2 - x,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: all glyph tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rendering/glyph.ts tests/unit/glyph.test.ts
git commit -m "feat(rendering): glyph path extraction via opentype.js"
```

---

## Task 7: Ruled-line geometry

**Files:**
- Create: `src/rendering/ruled-lines.ts`, `tests/unit/ruled-lines.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/ruled-lines.test.ts`:

```ts
import { describe, test, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { extractAsset, FontAsset } from "../../src/rendering/font";
import { computeLines, CAP_HEIGHT_PX } from "../../src/rendering/ruled-lines";

let asset: FontAsset;
beforeAll(() => {
  const buf = readFileSync("public/andika.ttf");
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  asset = extractAsset(opentype.parse(ab));
});

describe("CAP_HEIGHT_PX presets", () => {
  test("small < medium < large", () => {
    expect(CAP_HEIGHT_PX.small).toBeLessThan(CAP_HEIGHT_PX.medium);
    expect(CAP_HEIGHT_PX.medium).toBeLessThan(CAP_HEIGHT_PX.large);
  });

  test("medium is 72px (0.75 inch at 96dpi)", () => {
    expect(CAP_HEIGHT_PX.medium).toBe(72);
  });
});

describe("computeLines", () => {
  test("headline at y=0, baseline at requested cap-height", () => {
    const geom = computeLines(asset, 72);
    expect(geom.headline).toBe(0);
    expect(geom.baseline).toBeCloseTo(72, 1);
  });

  test("midline sits between headline and baseline", () => {
    const geom = computeLines(asset, 72);
    expect(geom.midline).toBeGreaterThan(geom.headline);
    expect(geom.midline).toBeLessThan(geom.baseline);
  });

  test("descender line is below baseline", () => {
    const geom = computeLines(asset, 72);
    expect(geom.descenderLine).toBeGreaterThan(geom.baseline);
  });

  test("fontSizePx produces the requested rendered cap-height", () => {
    const geom = computeLines(asset, 72);
    const renderedCap = geom.fontSizePx * (asset.capHeight / asset.unitsPerEm);
    expect(renderedCap).toBeCloseTo(72, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `src/rendering/ruled-lines` not found.

- [ ] **Step 3: Write `src/rendering/ruled-lines.ts`**

```ts
import type { FontAsset } from "./font";
import type { Size } from "../config/types";

// Cap-height in CSS pixels. At 96 CSS px/inch:
//   small:  60px ≈ 0.625"
//   medium: 72px = 0.750"  (default)
//   large:  91px ≈ 0.948"
export const CAP_HEIGHT_PX: Record<Size, number> = {
  small: 60,
  medium: 72,
  large: 91,
};

export interface LineGeometry {
  // All y-coordinates in CSS px, measured from the top of the row box (y=0 is headline).
  headline: number;
  midline: number;
  baseline: number;
  descenderLine: number;
  // Font-size (in CSS px) such that rendered cap-height equals the requested capHeightPx.
  fontSizePx: number;
}

export function computeLines(asset: FontAsset, capHeightPx: number): LineGeometry {
  const fontSizePx = (capHeightPx * asset.unitsPerEm) / asset.capHeight;
  const scale = fontSizePx / asset.unitsPerEm;
  const xHeightPx = asset.xHeight * scale;
  const descenderPx = asset.descender * scale;

  return {
    headline: 0,
    midline: capHeightPx - xHeightPx,
    baseline: capHeightPx,
    descenderLine: capHeightPx + descenderPx,
    fontSizePx,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: all ruled-line tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rendering/ruled-lines.ts tests/unit/ruled-lines.test.ts
git commit -m "feat(rendering): ruled-line geometry derived from font metrics"
```

---

## Task 8: Theming

**Files:**
- Create: `src/theming/themes.ts`

- [ ] **Step 1: Write `src/theming/themes.ts`**

```ts
import type { Theme } from "../config/types";

export interface ThemeDef {
  ruleColor: string;
  accentColor: string;
  cornerSvg: string; // inline SVG markup, or "" for no ornament
}

// Inline SVG ornaments authored by hand — no external assets. Each uses a 48x48 viewBox.
const STAR = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path fill="currentColor" d="M24 4l5.6 11.4 12.6 1.8-9.1 8.9 2.2 12.5L24 32.7l-11.3 5.9 2.2-12.5-9.1-8.9 12.6-1.8z" />
</svg>`;

const UNICORN_HORN = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path fill="currentColor" d="M24 4L18 44h12z"/>
  <path fill="#fff" opacity="0.5" d="M24 8l-3 18h6z"/>
</svg>`;

const CROWN = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path fill="currentColor" d="M4 18l8 6 6-14 6 14 6-14 6 14 8-6-4 22H8z"/>
  <circle fill="currentColor" cx="24" cy="10" r="3"/>
</svg>`;

export const THEMES: Record<Theme, ThemeDef> = {
  none: {
    ruleColor: "#b8b8b8",
    accentColor: "#b8b8b8",
    cornerSvg: "",
  },
  fairy: {
    ruleColor: "#c48cc9",
    accentColor: "#e6a5ea",
    cornerSvg: STAR,
  },
  unicorn: {
    ruleColor: "#8aa8d0",
    accentColor: "#f4b5c7",
    cornerSvg: UNICORN_HORN,
  },
  princess: {
    ruleColor: "#d46f87",
    accentColor: "#f4c56e",
    cornerSvg: CROWN,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/theming/themes.ts
git commit -m "feat(theming): theme data with inline-SVG corner ornaments"
```

---

## Task 9: Row rendering

Row rendering produces SVG DOM that is verified end-to-end by the Playwright visual tests in Task 14. No unit tests at this layer — the interesting logic (metric math, glyph paths) is covered at its source.

**Files:**
- Create: `src/layout/row.ts`

- [ ] **Step 1: Write `src/layout/row.ts`**

```ts
import type { FontAsset } from "../rendering/font";
import { glyphPath } from "../rendering/glyph";
import { computeLines, CAP_HEIGHT_PX } from "../rendering/ruled-lines";
import type { RowStyle, Size } from "../config/types";

const SVG_NS = "http://www.w3.org/2000/svg";
// Horizontal spacing between letter slots, in em-widths of the font.
const LETTER_GAP_EM = 0.35;

interface RowOptions {
  asset: FontAsset;
  char: string;
  rowStyle: RowStyle;
  size: Size;
  widthPx: number;      // total row width available
  ruleColor: string;
}

export function renderRow(opts: RowOptions): SVGSVGElement {
  const capPx = CAP_HEIGHT_PX[opts.size];
  const geom = computeLines(opts.asset, capPx);

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${opts.widthPx} ${geom.descenderLine}`);
  svg.setAttribute("width", `${opts.widthPx}`);
  svg.setAttribute("height", `${geom.descenderLine}`);
  svg.classList.add("row");

  // Ruled lines — headline + baseline solid, midline dashed.
  appendLine(svg, 0, geom.headline, opts.widthPx, geom.headline, opts.ruleColor, "solid");
  appendLine(svg, 0, geom.midline,  opts.widthPx, geom.midline,  opts.ruleColor, "dashed");
  appendLine(svg, 0, geom.baseline, opts.widthPx, geom.baseline, opts.ruleColor, "solid");

  // Compute slot sizing from one glyph measurement.
  const sample = glyphPath(opts.asset, opts.char, geom.fontSizePx);
  const gapPx = geom.fontSizePx * LETTER_GAP_EM;
  const slotWidth = sample.width + gapPx;
  const slotsAvailable = Math.max(1, Math.floor(opts.widthPx / slotWidth));

  // Kind of content in each slot, based on row style.
  let slots: Array<"solid" | "dashed" | "blank"> = [];
  switch (opts.rowStyle) {
    case "combo":
      slots = ["solid", "dashed", "dashed"];
      while (slots.length < slotsAvailable) slots.push("blank");
      break;
    case "all-trace":
      slots = new Array(slotsAvailable).fill("dashed");
      break;
    case "demo-blank":
      slots = ["solid"];
      while (slots.length < slotsAvailable) slots.push("blank");
      break;
  }

  slots.slice(0, slotsAvailable).forEach((kind, i) => {
    if (kind === "blank") return;
    const x = i * slotWidth;
    const path = glyphPath(opts.asset, opts.char, geom.fontSizePx, x, geom.baseline);
    appendGlyph(svg, path.pathD, kind);
  });

  return svg;
}

function appendLine(
  svg: SVGSVGElement,
  x1: number, y1: number, x2: number, y2: number,
  color: string, style: "solid" | "dashed",
): void {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", `${x1}`);
  line.setAttribute("y1", `${y1}`);
  line.setAttribute("x2", `${x2}`);
  line.setAttribute("y2", `${y2}`);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "1.2");
  if (style === "dashed") {
    line.setAttribute("stroke-dasharray", "5 4");
  }
  svg.appendChild(line);
}

function appendGlyph(svg: SVGSVGElement, d: string, kind: "solid" | "dashed"): void {
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", d);
  if (kind === "solid") {
    p.setAttribute("fill", "currentColor");
  } else {
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#888");
    p.setAttribute("stroke-width", "1.5");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("stroke-dasharray", "4 4");
  }
  svg.appendChild(p);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layout/row.ts
git commit -m "feat(layout): row rendering for combo, all-trace, demo-blank styles"
```

---

## Task 10: Sheet composition

**Files:**
- Create: `src/layout/sheet.ts`

- [ ] **Step 1: Write `src/layout/sheet.ts`**

```ts
import type { FontAsset } from "../rendering/font";
import type { SheetConfig, PaperSize } from "../config/types";
import { renderRow } from "./row";
import { computeLines, CAP_HEIGHT_PX } from "../rendering/ruled-lines";
import { glyphPath } from "../rendering/glyph";
import { THEMES, ThemeDef } from "../theming/themes";

// Printable area in CSS pixels (96 px = 1 inch).
const PAPER_DIMENSIONS: Record<PaperSize, { widthPx: number; heightPx: number }> = {
  letter: { widthPx: 8.5 * 96, heightPx: 11 * 96 },
  a4:     { widthPx: 210 / 25.4 * 96, heightPx: 297 / 25.4 * 96 },
};
const MARGIN_PX = 0.5 * 96;          // 48px
const ROW_SPACING_PX = 0.25 * 96;    // 24px between rows
const HEADER_ROOM_SINGLE_PX = 96;    // 1 inch for the large header on single-item pages

const SVG_NS = "http://www.w3.org/2000/svg";

export function buildSheets(asset: FontAsset, config: SheetConfig): HTMLElement[] {
  const theme = THEMES[config.theme];
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const printableWidth = paper.widthPx - 2 * MARGIN_PX;
  const printableHeight = paper.heightPx - 2 * MARGIN_PX;

  if (config.content.length === 0) return [];

  if (config.layout === "multi") {
    // Flatten to chars: "Aa Bb" -> ["A","a","B","b"], each gets one row.
    const chars = config.content.flatMap((item) => Array.from(item));
    return buildMultiLayout(asset, config, theme, chars, printableWidth, printableHeight, paper);
  }
  return buildSingleLayout(asset, config, theme, printableWidth, printableHeight, paper);
}

function buildMultiLayout(
  asset: FontAsset,
  config: SheetConfig,
  theme: ThemeDef,
  chars: string[],
  printableWidth: number,
  printableHeight: number,
  paper: { widthPx: number; heightPx: number },
): HTMLElement[] {
  const rowHeight = singleRowHeight(asset, config.size);
  const rowStride = rowHeight + ROW_SPACING_PX;
  const rowsPerPage = Math.max(1, Math.floor(printableHeight / rowStride));

  const pages: HTMLElement[] = [];
  for (let i = 0; i < chars.length; i += rowsPerPage) {
    const chunk = chars.slice(i, i + rowsPerPage);
    const page = createPage(config.paperSize);
    const content = pageContentArea(page);
    for (const ch of chunk) {
      const row = renderRow({
        asset, char: ch, rowStyle: config.rowStyle, size: config.size,
        widthPx: printableWidth, ruleColor: theme.ruleColor,
      });
      row.style.marginBottom = `${ROW_SPACING_PX}px`;
      content.appendChild(row);
    }
    applyThemeChrome(page, theme);
    pages.push(page);
  }
  return pages;
}

function buildSingleLayout(
  asset: FontAsset,
  config: SheetConfig,
  theme: ThemeDef,
  printableWidth: number,
  printableHeight: number,
  paper: { widthPx: number; heightPx: number },
): HTMLElement[] {
  const rowHeight = singleRowHeight(asset, config.size);
  const rowStride = rowHeight + ROW_SPACING_PX;
  const rowsPerPage = Math.max(1, Math.floor((printableHeight - HEADER_ROOM_SINGLE_PX) / rowStride));

  const pages: HTMLElement[] = [];
  for (const item of config.content) {
    const page = createPage(config.paperSize);
    const content = pageContentArea(page);

    const header = renderHeader(asset, item, printableWidth);
    header.style.marginBottom = `${ROW_SPACING_PX}px`;
    content.appendChild(header);

    const itemChars = Array.from(item);
    for (let r = 0; r < rowsPerPage; r++) {
      const ch = itemChars[r % itemChars.length];
      if (!ch) continue;
      const row = renderRow({
        asset, char: ch, rowStyle: config.rowStyle, size: config.size,
        widthPx: printableWidth, ruleColor: theme.ruleColor,
      });
      row.style.marginBottom = `${ROW_SPACING_PX}px`;
      content.appendChild(row);
    }
    applyThemeChrome(page, theme);
    pages.push(page);
  }
  return pages;
}

function singleRowHeight(asset: FontAsset, size: SheetConfig["size"]): number {
  const geom = computeLines(asset, CAP_HEIGHT_PX[size]);
  return geom.descenderLine;
}

function createPage(paperSize: PaperSize): HTMLElement {
  const paper = PAPER_DIMENSIONS[paperSize];
  const page = document.createElement("section");
  page.classList.add("sheet");
  page.dataset.paper = paperSize;
  page.style.width = `${paper.widthPx}px`;
  page.style.height = `${paper.heightPx}px`;
  return page;
}

function pageContentArea(page: HTMLElement): HTMLElement {
  const content = document.createElement("div");
  content.classList.add("sheet__content");
  content.style.position = "absolute";
  content.style.top = `${MARGIN_PX}px`;
  content.style.left = `${MARGIN_PX}px`;
  content.style.right = `${MARGIN_PX}px`;
  content.style.bottom = `${MARGIN_PX}px`;
  page.appendChild(content);
  return content;
}

function renderHeader(asset: FontAsset, item: string, widthPx: number): SVGSVGElement {
  const headerCap = HEADER_ROOM_SINGLE_PX - 16;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${widthPx} ${HEADER_ROOM_SINGLE_PX}`);
  svg.setAttribute("width", `${widthPx}`);
  svg.setAttribute("height", `${HEADER_ROOM_SINGLE_PX}`);
  svg.classList.add("header");

  const fontSize = (headerCap * asset.unitsPerEm) / asset.capHeight;
  const widths = Array.from(item).map((c) => glyphPath(asset, c, fontSize).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  let cursorX = (widthPx - totalWidth) / 2;

  Array.from(item).forEach((c, idx) => {
    const g = glyphPath(asset, c, fontSize, cursorX, headerCap + 8);
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", g.pathD);
    p.setAttribute("fill", "currentColor");
    svg.appendChild(p);
    cursorX += widths[idx] ?? 0;
  });
  return svg;
}

function applyThemeChrome(page: HTMLElement, theme: ThemeDef): void {
  if (!theme.cornerSvg) return;
  const corner = document.createElement("div");
  corner.classList.add("sheet__corner");
  corner.style.position = "absolute";
  corner.style.top = `${MARGIN_PX / 2}px`;
  corner.style.right = `${MARGIN_PX / 2}px`;
  corner.style.width = "48px";
  corner.style.height = "48px";
  corner.style.color = theme.accentColor;
  corner.innerHTML = theme.cornerSvg;
  page.appendChild(corner);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layout/sheet.ts
git commit -m "feat(layout): multi-item and single-item page composition"
```

---

## Task 11: Form UI + screen CSS

The form subscribes to the store for updates (so the back button or preset clicks reflect in the UI) and pushes updates into the store on user input.

**Files:**
- Create: `src/ui/form.ts`, `src/styles/main.css`

- [ ] **Step 1: Write `src/ui/form.ts`**

```ts
import type { SheetConfig } from "../config/types";
import type { Store } from "../state/store";
import { parseContent, presetToText, PresetKey } from "../config/content";

export function bindForm(root: HTMLElement, store: Store<SheetConfig>): void {
  root.innerHTML = FORM_HTML;

  const contentField = root.querySelector<HTMLTextAreaElement>("#content")!;
  const layoutGroup = root.querySelectorAll<HTMLInputElement>("input[name='layout']");
  const rowGroup = root.querySelectorAll<HTMLInputElement>("input[name='row']");
  const sizeGroup = root.querySelectorAll<HTMLInputElement>("input[name='size']");
  const themeGroup = root.querySelectorAll<HTMLInputElement>("input[name='theme']");
  const paperGroup = root.querySelectorAll<HTMLInputElement>("input[name='paper']");
  const presetButtons = root.querySelectorAll<HTMLButtonElement>("button[data-preset]");
  const printButton = root.querySelector<HTMLButtonElement>("#print-btn")!;

  // Store → form (fires immediately with current value, then on every store change).
  store.run((config) => {
    // Only write the textarea if its parsed content differs — preserves the user's
    // whitespace/cursor when the source of the change IS the textarea.
    const desired = config.content.join(" ");
    if (parseContent(contentField.value).join(" ") !== desired) {
      contentField.value = desired;
    }
    setRadio(layoutGroup, config.layout);
    setRadio(rowGroup, config.rowStyle);
    setRadio(sizeGroup, config.size);
    setRadio(themeGroup, config.theme);
    setRadio(paperGroup, config.paperSize);
  });

  // Form → store.
  contentField.addEventListener("input", () => {
    store.update({ content: parseContent(contentField.value) });
  });

  bindRadioGroup(layoutGroup, (v) => store.update({ layout: v as SheetConfig["layout"] }));
  bindRadioGroup(rowGroup,    (v) => store.update({ rowStyle: v as SheetConfig["rowStyle"] }));
  bindRadioGroup(sizeGroup,   (v) => store.update({ size: v as SheetConfig["size"] }));
  bindRadioGroup(themeGroup,  (v) => store.update({ theme: v as SheetConfig["theme"] }));
  bindRadioGroup(paperGroup,  (v) => store.update({ paperSize: v as SheetConfig["paperSize"] }));

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset as PresetKey | undefined;
      if (!preset) return;
      store.update({ content: parseContent(presetToText(preset)) });
    });
  });

  printButton.addEventListener("click", () => window.print());
}

function bindRadioGroup(
  group: NodeListOf<HTMLInputElement>,
  onChange: (value: string) => void,
): void {
  group.forEach((el) => {
    el.addEventListener("change", () => {
      if (el.checked) onChange(el.value);
    });
  });
}

function setRadio(group: NodeListOf<HTMLInputElement>, value: string): void {
  group.forEach((el) => {
    el.checked = el.value === value;
  });
}

const FORM_HTML = `
  <h1>Worksheets</h1>
  <form id="config-form">
    <label class="field">
      <span class="field__label">Content</span>
      <textarea id="content" rows="3" spellcheck="false"></textarea>
      <div class="presets">
        <button type="button" data-preset="uppercase">A–Z</button>
        <button type="button" data-preset="lowercase">a–z</button>
        <button type="button" data-preset="pairs">Aa–Zz</button>
        <button type="button" data-preset="digits">0–9</button>
      </div>
    </label>

    <fieldset class="field">
      <legend>Page layout</legend>
      <label><input type="radio" name="layout" value="multi" /> Multiple items per page</label>
      <label><input type="radio" name="layout" value="single" /> One item per page</label>
    </fieldset>

    <fieldset class="field">
      <legend>Row style</legend>
      <label><input type="radio" name="row" value="combo" /> Combo (demo + trace + blank)</label>
      <label><input type="radio" name="row" value="all-trace" /> All trace</label>
      <label><input type="radio" name="row" value="demo-blank" /> Demo + blank</label>
    </fieldset>

    <fieldset class="field">
      <legend>Letter size</legend>
      <label><input type="radio" name="size" value="small" /> Small</label>
      <label><input type="radio" name="size" value="medium" /> Medium</label>
      <label><input type="radio" name="size" value="large" /> Large</label>
    </fieldset>

    <fieldset class="field">
      <legend>Theme</legend>
      <label><input type="radio" name="theme" value="none" /> None</label>
      <label><input type="radio" name="theme" value="fairy" /> Fairy</label>
      <label><input type="radio" name="theme" value="unicorn" /> Unicorn</label>
      <label><input type="radio" name="theme" value="princess" /> Princess</label>
    </fieldset>

    <fieldset class="field">
      <legend>Paper</legend>
      <label><input type="radio" name="paper" value="letter" /> US Letter</label>
      <label><input type="radio" name="paper" value="a4" /> A4</label>
    </fieldset>
  </form>

  <button id="print-btn" type="button" class="print-btn">Print</button>
  <p class="tip">
    Tip: in the print dialog, uncheck <em>Headers and footers</em> and
    set margins to <em>None</em> or <em>Default</em> for cleanest output.
  </p>
`;
```

- [ ] **Step 2: Write `src/styles/main.css`**

```css
@font-face {
  font-family: "Andika";
  src: url("/andika.ttf") format("truetype");
  font-display: swap;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f3f1ec;
  color: #222;
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 100vh;
}

.controls {
  padding: 20px;
  background: #fff;
  border-right: 1px solid #e4e1d8;
  overflow-y: auto;
}

.controls h1 { font-size: 22px; margin: 0 0 16px; }

.field { display: block; margin: 0 0 18px; padding: 0; border: none; }
.field legend, .field__label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  display: block;
}
.field label { display: block; font-size: 14px; margin: 4px 0; }
.field input[type="radio"] { margin-right: 6px; }

textarea {
  width: 100%;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 14px;
  padding: 8px;
  border: 1px solid #d6d3ca;
  border-radius: 4px;
  resize: vertical;
}

.presets { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.presets button {
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #d6d3ca;
  background: #faf8f3;
  border-radius: 4px;
  cursor: pointer;
}
.presets button:hover { background: #f0ede5; }

.print-btn {
  width: 100%;
  padding: 10px;
  background: #2b4a85;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.print-btn:hover { background: #1f3a6e; }

.tip { font-size: 12px; color: #666; margin-top: 10px; line-height: 1.4; }

.preview { padding: 24px; overflow-y: auto; }

.sheet {
  background: #fff;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 0 auto 24px;
  overflow: hidden;
}

.sheet__content > .row,
.sheet__content > .header { display: block; }
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/form.ts src/styles/main.css
git commit -m "feat(ui): form binding via store + screen styling"
```

---

## Task 12: Preview wiring and app

**Files:**
- Create: `src/ui/preview.ts`, `src/ui/app.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Write `src/ui/preview.ts`**

```ts
import type { FontAsset } from "../rendering/font";
import type { SheetConfig } from "../config/types";
import { buildSheets } from "../layout/sheet";

export function renderPreview(root: HTMLElement, asset: FontAsset, config: SheetConfig): void {
  root.replaceChildren(...buildSheets(asset, config));
}
```

- [ ] **Step 2: Write `src/ui/app.ts`**

```ts
import { loadFont } from "../rendering/font";
import { bindForm } from "./form";
import { renderPreview } from "./preview";
import { configFromURL, configToURLParams } from "../config/url";
import type { SheetConfig } from "../config/types";
import { Store } from "../state/store";

export async function startApp(): Promise<void> {
  const controls = document.getElementById("controls");
  const preview = document.getElementById("preview");
  if (!controls || !preview) throw new Error("DOM roots missing");

  preview.textContent = "Loading font…";
  const asset = await loadFont("/andika.ttf");

  const store = new Store<SheetConfig>(configFromURL(new URL(window.location.href)));

  // Subscriber 1: URL + body data-paper attribute mirror the store.
  store.run((config) => {
    document.body.dataset.paper = config.paperSize;
    const params = configToURLParams(config);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  });

  // Subscriber 2: preview re-renders on every store change.
  store.run((config) => {
    renderPreview(preview, asset, config);
  });

  // popstate (back/forward): parse the URL and push into the store.
  window.addEventListener("popstate", () => {
    store.set(configFromURL(new URL(window.location.href)));
  });

  // Form reads from + writes to the store.
  bindForm(controls, store);
}
```

- [ ] **Step 3: Replace `src/main.ts`**

```ts
import { startApp } from "./ui/app";

startApp().catch((err) => {
  console.error(err);
  const preview = document.getElementById("preview");
  if (preview) {
    preview.innerHTML = `<pre style="color:red;padding:20px">${String(err)}</pre>`;
  }
});
```

- [ ] **Step 4: Manually verify**

Run:
```bash
npm run dev
```

Open the URL. Expected:
- Form appears on the left with default values (content "A B C", Multi, Combo, Medium, None, Letter).
- Preview renders one sheet with 3 combo rows (A, B, C) on a US Letter–sized page.
- Clicking a preset fills the content field and re-renders.
- Changing any radio re-renders.
- URL updates as controls change.
- Reloading the URL restores the same sheet.
- Browser back/forward buttons restore prior states.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/ui/preview.ts src/ui/app.ts src/main.ts
git commit -m "feat(ui): wire form, preview, and URL via Store<SheetConfig>"
```

---

## Task 13: Print CSS

**Files:**
- Modify: `src/styles/print.css`

- [ ] **Step 1: Write `src/styles/print.css`**

```css
/* Physical paper size via @page. Body has data-paper set by the app on every store change. */
@page { margin: 0.5in; }

@media print {
  html, body {
    background: #fff;
    margin: 0;
  }

  body { display: block; }

  .controls { display: none; }

  .preview { padding: 0; overflow: visible; }

  .sheet {
    box-shadow: none;
    margin: 0;
    break-after: page;
    page-break-after: always;
  }

  .sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
```

- [ ] **Step 2: Manually verify print output**

Run:
```bash
npm run dev
```

Open the URL, then open the browser print preview (Cmd-P / Ctrl-P). Expected:
- Only the sheet(s) appear in the preview — no form, no sidebar, no background.
- Paper is US Letter (or A4 when selected) — sheet content fills the page with 0.5in margin.
- Multi-item sheets with many chars span multiple pages.
- Single-item layout with multiple items prints one page per item.
- No unwanted spillover or clipping.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/styles/print.css
git commit -m "feat(styles): print CSS with @page rules and page breaks"
```

---

## Task 14: Visual regression tests

**Files:**
- Create: `tests/visual/worksheet.spec.ts`

- [ ] **Step 1: Write `tests/visual/worksheet.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import type { SheetConfig } from "../../src/config/types";

const SAMPLE_CONTENT = "Aa Bb Cc";

function urlFor(partial: Partial<SheetConfig>): string {
  const params = new URLSearchParams();
  params.set("content", partial.content?.join(" ") ?? SAMPLE_CONTENT);
  params.set("layout", partial.layout ?? "multi");
  params.set("row", partial.rowStyle ?? "combo");
  params.set("size", partial.size ?? "medium");
  params.set("theme", partial.theme ?? "none");
  params.set("paper", partial.paperSize ?? "letter");
  return `/?${params.toString()}`;
}

const layouts: SheetConfig["layout"][] = ["multi", "single"];
const rowStyles: SheetConfig["rowStyle"][] = ["combo", "all-trace", "demo-blank"];
const themes: SheetConfig["theme"][] = ["none", "fairy", "unicorn", "princess"];
const sizes: SheetConfig["size"][] = ["small", "medium", "large"];

// 2 × 3 × 4 = 24 snapshots at medium size.
for (const layout of layouts) {
  for (const rowStyle of rowStyles) {
    for (const theme of themes) {
      const name = `${layout}-${rowStyle}-${theme}`;
      test(`renders ${name}`, async ({ page }) => {
        await page.goto(urlFor({ layout, rowStyle, theme }));
        await page.waitForFunction(() => document.querySelectorAll(".sheet").length > 0);
        await page.waitForFunction(
          () => document.querySelector(".sheet svg.row path, .sheet svg.header path") !== null,
        );
        const preview = page.locator("#preview");
        await expect(preview).toHaveScreenshot(`${name}.png`);
      });
    }
  }
}

// Plus 3 size-sweep snapshots using defaults for the other axes.
for (const size of sizes) {
  test(`size sweep: ${size}`, async ({ page }) => {
    await page.goto(urlFor({ size }));
    await page.waitForFunction(() => document.querySelector(".sheet svg.row path") !== null);
    const preview = page.locator("#preview");
    await expect(preview).toHaveScreenshot(`size-${size}.png`);
  });
}
```

- [ ] **Step 2: Install Playwright browsers**

Run:
```bash
npx playwright install chromium
```

- [ ] **Step 3: Generate initial snapshots**

Run:
```bash
npm run test:e2e:update
```

Expected: 27 snapshot images created under `tests/visual/worksheet.spec.ts-snapshots/`. First run also confirms the app builds and serves correctly.

- [ ] **Step 4: Re-run tests to verify stability**

Run:
```bash
npm run test:e2e
```

Expected: all 27 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/visual
git commit -m "test(visual): Playwright snapshots for layout × rowStyle × theme × size"
```

---

## Task 15: README and printing tips

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

Literal file content (use a triple-backtick fence where shown):

```
# Worksheets

A static web app that generates printable letter, number, and handwriting practice sheets for young learners.

## Quick start

[triple-backtick]bash
npm install
npm run dev
[triple-backtick]

Open the URL Vite prints. The form on the left controls the sheet; the preview on the right updates live. Click **Print** (or Cmd-P / Ctrl-P) to open the browser print dialog.

## Printing tips

For cleanest output in Chrome:
1. In the print dialog, open **More settings**.
2. Under **Margins**, choose **Default** (or **None**).
3. Uncheck **Headers and footers**.
4. Choose **Background graphics** if you want theme colors to print.

The app uses physical CSS units (inches, mm) so printed letter sizes match the Small/Medium/Large presets.

## Configuration via URL

Every control is reflected in the URL, so any sheet is shareable. Example:

[triple-backtick]
?content=Aa+Bb+Cc&layout=multi&row=combo&size=medium&theme=fairy&paper=letter
[triple-backtick]

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — serve the production build
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — visual regression tests (Playwright)
- `npm run test:e2e:update` — regenerate Playwright snapshots

## Font credit

This app bundles **Andika** by SIL International, licensed under the **SIL Open Font License, Version 1.1**. See `public/OFL.txt` for the full license.
```

Replace every `[triple-backtick]` with three literal backtick characters when writing the file.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage, printing tips, and font credit"
```

---

## Self-review checklist

Run through this after all tasks are complete:

1. **Spec coverage** — every in-scope feature from the spec is implemented:
   - Content text field + presets (Tasks 2, 11)
   - Two page layouts (Task 10)
   - Three row styles (Task 9)
   - Kindergarten three-line ruled paper (Tasks 7, 9)
   - US Letter / A4 paper sizes (Tasks 10, 13)
   - Small / Medium / Large size presets (Task 7)
   - Four themes (Task 8)
   - Shareable URL via Store (Tasks 3, 4, 12)
   - Print via browser (Task 13)
   - Unit tests for config round-trip, store, metrics math, glyph generation, content parsing (Tasks 2, 3, 4, 5, 6, 7)
   - Visual regression for layout × rowStyle × theme (24) + size sweep (3) = 27 snapshots (Task 14)
   - README with printing tips (Task 15)

2. **No placeholders** — every task's code blocks are complete and runnable.

3. **Type consistency** — `FontAsset`, `LineGeometry`, `GlyphSvg`, `SheetConfig`, `ThemeDef`, `Store<T>` names are identical across tasks that reference them.
