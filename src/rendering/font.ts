import opentype from "opentype.js";

export interface FontAsset {
  font: opentype.Font;
  unitsPerEm: number;
  /**
   * Max glyph top above baseline, measured over A–Z, a–z, 0–9. This is NOT
   * the font's linguistic `ascender` metric — that value typically reserves
   * space for stacked diacritics, which we never render, and for fonts like
   * Andika it's ~1.7× capHeight (too tall for our ruled-line geometry).
   */
  ascender: number;
  /**
   * Max glyph extent below baseline (absolute value), measured over the same
   * glyph set. Again tighter than the font's linguistic descender metric.
   */
  descender: number;
  xHeight: number;
  capHeight: number;
}

/** Characters used to derive the effective ascender/descender. */
const MEASUREMENT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function extractAsset(font: opentype.Font): FontAsset {
  const upm = font.unitsPerEm;
  const os2 = (font.tables as { os2?: { sxHeight?: number; sCapHeight?: number } }).os2;
  const xHeight = os2?.sxHeight && os2.sxHeight > 0 ? os2.sxHeight : Math.round(upm * 0.5);
  const capHeight = os2?.sCapHeight && os2.sCapHeight > 0 ? os2.sCapHeight : Math.round(upm * 0.7);

  let maxTop = 0;
  let minBottom = 0;
  for (const ch of MEASUREMENT_GLYPHS) {
    const bb = font.charToGlyph(ch).getBoundingBox();
    if (bb.y2 > maxTop) maxTop = bb.y2;
    if (bb.y1 < minBottom) minBottom = bb.y1;
  }

  return {
    font,
    unitsPerEm: upm,
    ascender: maxTop,
    descender: Math.abs(minBottom),
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
