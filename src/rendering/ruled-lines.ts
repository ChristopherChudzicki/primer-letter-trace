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
  headline: number;
  midline: number;
  baseline: number;
  descenderLine: number;
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
