import type { FontAsset } from "../rendering/font";
import type { SkeletonPath, SkeletonDot } from "../rendering/skeletons/types";

const SVG_NS = "http://www.w3.org/2000/svg";

export interface GlyphRenderOptions {
  char: string;
  asset: FontAsset;
  /** The skeleton `d` string to overlay (already-merged or baseline-only — caller chooses). */
  skeleton: SkeletonPath;
  /** Solid dots to draw atop the skeleton (e.g., i/j tittles). */
  dots: SkeletonDot[];
  /** Render size in CSS pixels for the SVG element. */
  sizePx: number;
  /** Show the font-unit grid (100-unit intervals). Default true. */
  showGrid?: boolean;
  /** Stroke colors cycled per disjoint sub-path of the skeleton. */
  strokeColors?: string[];
}

const DEFAULT_STROKE_COLORS = [
  "#1f77b4", "#d62728", "#2ca02c", "#9467bd",
  "#ff7f0e", "#17becf", "#e377c2", "#8c564b",
];

/**
 * Build an <svg> with: filled glyph outline (gray), font-unit grid (light),
 * and the skeleton overlaid with each disjoint sub-path in a distinct color.
 * Coordinates are font units throughout; we apply a viewBox + scaleY(-1)
 * transform so Y-up data renders with the baseline at the bottom.
 */
export function renderGlyph(opts: GlyphRenderOptions): SVGSVGElement {
  const { char, asset, skeleton, dots, sizePx } = opts;
  const showGrid = opts.showGrid ?? true;
  const strokeColors = opts.strokeColors ?? DEFAULT_STROKE_COLORS;

  // Bounding box: glyph extents extended slightly so strokes don't clip.
  const margin = 80; // font units
  const ascender = asset.font.ascender;
  const descender = asset.font.descender; // negative
  const advance = asset.font.charToGlyph(char).advanceWidth ?? asset.font.unitsPerEm * 0.5;
  const minX = -margin;
  const maxX = advance + margin;
  const minY = descender - margin;
  const maxY = ascender + margin;
  const w = maxX - minX;
  const h = maxY - minY;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `${minX} ${-maxY} ${w} ${h}`); // -maxY because we flip
  svg.setAttribute("width", `${sizePx}`);
  svg.setAttribute("height", `${(sizePx * h) / w}`);
  svg.classList.add("inspector-glyph");

  const flip = document.createElementNS(SVG_NS, "g");
  flip.setAttribute("transform", "scale(1, -1)");
  svg.appendChild(flip);

  if (showGrid) appendGrid(flip, minX, maxX, minY, maxY);
  appendBaselineMarker(flip, minX, maxX);
  appendFilledGlyph(flip, asset, char);
  appendSkeleton(flip, skeleton, strokeColors);
  appendDots(flip, dots);

  return svg;
}

function appendGrid(parent: SVGGElement, minX: number, maxX: number, minY: number, maxY: number) {
  const STEP = 100;
  const grid = document.createElementNS(SVG_NS, "g");
  grid.classList.add("inspector-grid");
  for (let x = Math.ceil(minX / STEP) * STEP; x <= maxX; x += STEP) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", `${x}`); line.setAttribute("x2", `${x}`);
    line.setAttribute("y1", `${minY}`); line.setAttribute("y2", `${maxY}`);
    grid.appendChild(line);
  }
  for (let y = Math.ceil(minY / STEP) * STEP; y <= maxY; y += STEP) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("y1", `${y}`); line.setAttribute("y2", `${y}`);
    line.setAttribute("x1", `${minX}`); line.setAttribute("x2", `${maxX}`);
    grid.appendChild(line);
  }
  parent.appendChild(grid);
}

function appendBaselineMarker(parent: SVGGElement, minX: number, maxX: number) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", `${minX}`); line.setAttribute("x2", `${maxX}`);
  line.setAttribute("y1", "0"); line.setAttribute("y2", "0");
  line.classList.add("inspector-baseline");
  parent.appendChild(line);
}

function appendFilledGlyph(parent: SVGGElement, asset: FontAsset, char: string) {
  // Use opentype.js to get the glyph's outline at unitsPerEm size, so the
  // path coordinates are already in font units.
  const path = asset.font.getPath(char, 0, 0, asset.font.unitsPerEm);
  const d = path.toPathData(2);
  const el = document.createElementNS(SVG_NS, "path");
  el.setAttribute("d", d);
  el.classList.add("inspector-outline");
  parent.appendChild(el);
}

function appendSkeleton(parent: SVGGElement, skeleton: SkeletonPath, colors: string[]) {
  // Split the d string on M commands to color each disjoint sub-path differently.
  const subPaths = skeleton.match(/M[^M]*/g) ?? [];
  const g = document.createElementNS(SVG_NS, "g");
  g.classList.add("inspector-skeleton");
  subPaths.forEach((d, i) => {
    const el = document.createElementNS(SVG_NS, "path");
    el.setAttribute("d", d.trim());
    el.setAttribute("stroke", colors[i % colors.length]!);
    el.setAttribute("vector-effect", "non-scaling-stroke");
    g.appendChild(el);
  });
  parent.appendChild(g);
}

function appendDots(parent: SVGGElement, dots: SkeletonDot[]) {
  if (dots.length === 0) return;
  const g = document.createElementNS(SVG_NS, "g");
  g.classList.add("inspector-dots");
  for (const dot of dots) {
    const el = document.createElementNS(SVG_NS, "circle");
    el.setAttribute("cx", `${dot.cx}`);
    el.setAttribute("cy", `${dot.cy}`);
    el.setAttribute("r", `${dot.r}`);
    g.appendChild(el);
  }
  parent.appendChild(g);
}
