/**
 * Introspect an OFL/TTF font: check in-scope glyph coverage (A–Z, a–z, 0–9),
 * key metrics, and report which default glyph variant the font uses for
 * single-story `a` and `g` (these have historical double-story variants that
 * don't match our handwriting conventions).
 *
 * Usage: npx tsx scripts/inspect-font-coverage.ts public/comic-relief.ttf
 */
import opentype from "opentype.js";
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: inspect-font-coverage <path-to-ttf>");
  process.exit(1);
}

const buf = readFileSync(path);
const font = opentype.parse(
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
);

console.log("=== Font ===");
console.log(
  "  family:",
  font.names.fontFamily?.en,
  "/",
  font.names.fontSubfamily?.en,
);
console.log("  unitsPerEm:", font.unitsPerEm);
const os2 = (font.tables as {
  os2?: { sxHeight?: number; sCapHeight?: number };
}).os2;
console.log("  OS/2 sxHeight:", os2?.sxHeight, "  sCapHeight:", os2?.sCapHeight);
console.log("  ascender:", font.ascender, "  descender:", font.descender);

const IN_SCOPE =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

console.log("\n=== Glyph coverage (in-scope 62 chars) ===");
const missing: string[] = [];
for (const ch of IN_SCOPE) {
  const g = font.charToGlyph(ch);
  // opentype.js returns the .notdef glyph (index 0) for unmapped chars.
  if (g.index === 0) missing.push(ch);
}
if (missing.length === 0) {
  console.log("  all 62 present");
} else {
  console.log("  MISSING:", missing.join(", "));
}

console.log("\n=== Default glyph names for a / g (shape variant check) ===");
for (const ch of ["a", "g"]) {
  const g = font.charToGlyph(ch);
  console.log(`  ${ch}: name="${g.name}" idx=${g.index}`);
}

const tables = font.tables as {
  gsub?: { features?: { tag: string }[] };
};
const gsub = tables.gsub;
console.log("\n=== GSUB feature tags ===");
if (gsub?.features) {
  const tags = new Set(gsub.features.map((f) => f.tag));
  console.log(" ", [...tags].sort().join(", "));
} else {
  console.log("  (no GSUB)");
}
