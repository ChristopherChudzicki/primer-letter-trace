import type { FontAsset } from "./font";

export interface GlyphSvg {
  pathD: string;
  width: number;
  xMin: number;
  xMax: number;
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
