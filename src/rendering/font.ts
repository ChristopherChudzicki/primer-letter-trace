import opentype from "opentype.js";

export interface FontAsset {
  font: opentype.Font;
  unitsPerEm: number;
  ascender: number;
  descender: number;
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
