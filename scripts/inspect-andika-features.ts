/**
 * One-off investigation: list Andika's OpenType features and any glyph
 * variants for letters with diagonal strokes (A, V, W). Helps decide if
 * we can pick a font variant that's easier to author centerlines for.
 *
 * Run: npx tsx scripts/inspect-andika-features.ts
 */
import opentype from "opentype.js";
import { readFileSync } from "node:fs";

const buf = readFileSync("public/andika.ttf");
const font = opentype.parse(
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
);

console.log("=== Font ===");
console.log(font.names.fontFamily?.en, "/", font.names.fontSubfamily?.en);

const tables = font.tables as { gsub?: { features?: { tag: string }[] } };
const gsub = tables.gsub;
console.log("\n=== GSUB feature tags ===");
if (gsub?.features) {
  const tags = new Set(gsub.features.map((f) => f.tag));
  console.log([...tags].sort().join(", "));
} else {
  console.log("(no GSUB)");
}

console.log("\n=== Default A/V/W glyph names ===");
for (const ch of ["A", "V", "W", "a", "v", "w"]) {
  const g = font.charToGlyph(ch);
  console.log(`${ch}: name="${g.name}" idx=${g.index}`);
}

console.log("\n=== All glyphs whose name starts with A/V/W (case-sensitive) ===");
const allGlyphs = font.glyphs.glyphs as Record<string, { name?: string }>;
const matches: Array<{ idx: string; name: string }> = [];
for (const [idx, glyph] of Object.entries(allGlyphs)) {
  if (glyph.name && /^[AVWavw]([._]|$)/.test(glyph.name)) {
    matches.push({ idx, name: glyph.name });
  }
}
for (const m of matches) console.log(`  idx=${m.idx}: ${m.name}`);
