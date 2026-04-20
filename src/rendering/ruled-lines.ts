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
  // All y-coordinates in CSS px, measured from the top of the row box
  // (y=0 is the top of the row, which is also the ascender line).
  ascenderLine: number;    // tops of b, d, f, h, k, l, t reach here
  headline: number;        // tops of capitals (A, B, C, ...)
  midline: number;         // x-height line (tops of a, c, e, m, ...)
  baseline: number;        // bottoms of letters without descenders
  descenderLine: number;   // bottoms of descenders; also the row bottom
  fontSizePx: number;      // font-size such that rendered cap-height = requested capHeightPx
}

export function computeLines(asset: FontAsset, capHeightPx: number): LineGeometry {
  const fontSizePx = (capHeightPx * asset.unitsPerEm) / asset.capHeight;
  const scale = fontSizePx / asset.unitsPerEm;
  const xHeightPx = asset.xHeight * scale;
  const descenderPx = asset.descender * scale;
  const ascenderPx = asset.ascender * scale;

  // Extra room above the headline for letters whose ascender exceeds cap-height.
  // For Andika, ascender ≈ 1.22 × cap-height, so this is ~22% of cap-height.
  const ascenderOverflow = Math.max(0, ascenderPx - capHeightPx);

  const headline = ascenderOverflow;
  const baseline = headline + capHeightPx;

  return {
    ascenderLine: 0,
    headline,
    midline: headline + capHeightPx - xHeightPx,
    baseline,
    descenderLine: baseline + descenderPx,
    fontSizePx,
  };
}
