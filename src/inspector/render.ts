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
  /**
   * Scale factor for dot radius. Useful at small sizePx where the natural
   * font-unit dot would visually dominate the cell. Default 1.
   */
  dotScale?: number;
}

const DEFAULT_STROKE_COLORS = [
  "#1f77b4", "#d62728", "#2ca02c", "#9467bd",
  "#ff7f0e", "#17becf", "#e377c2", "#8c564b",
];

/**
 * Build an <svg> with: filled glyph outline (gray), font-unit grid (light),
 * and the skeleton overlaid with each disjoint sub-path in a distinct color.
 *
 * Coordinate handling:
 * - The skeleton, dots, grid, and baseline are stored in Y-up font units. We
 *   render them inside a `<g transform="scale(1, -1)">` group so Y-up data
 *   displays naturally (baseline at the bottom of the viewport).
 * - The filled glyph from `opentype.js`'s `getPath` is already pre-flipped to
 *   SVG Y-down (apex has negative y, descender has positive y). It's appended
 *   *outside* the flip group (directly on the svg) so it renders in its
 *   native orientation.
 * - The viewBox uses `-maxY` for the y-origin so the visible vertical range
 *   covers `[-maxY, -minY]` — the range that both the flipped Y-up content
 *   and the native Y-down getPath output occupy after their respective transforms.
 */
export function renderGlyph(opts: GlyphRenderOptions): SVGSVGElement {
  const { char, asset, skeleton, dots, sizePx } = opts;
  const showGrid = opts.showGrid ?? true;
  const strokeColors = opts.strokeColors ?? DEFAULT_STROKE_COLORS;

  // Bounding box: glyph extents extended slightly so strokes don't clip.
  // Use FontAsset's tight measurements (max bbox over A-Z/a-z/0-9) rather
  // than the font's linguistic ascender/descender, which reserve diacritic
  // room we never use (~1.7× capHeight for Andika — see font.ts).
  const margin = 80; // font units
  const ascender = asset.ascender;          // positive, tight
  const descender = -asset.descender;       // FontAsset.descender is abs-value; negate to recover Y-up
  const advance = asset.font.charToGlyph(char).advanceWidth ?? asset.font.unitsPerEm * 0.5;
  const minX = -margin;
  const maxX = advance + margin;
  const minY = descender - margin;
  const maxY = ascender + margin;
  const w = maxX - minX;
  const h = maxY - minY;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `${minX} ${-maxY} ${w} ${h}`);
  svg.setAttribute("width", `${sizePx}`);
  svg.setAttribute("height", `${(sizePx * h) / w}`);
  svg.classList.add("inspector-glyph");

  // Filled glyph (already Y-down from opentype.js) goes directly on the svg.
  appendFilledGlyph(svg, asset, char);

  // Y-up content (grid, baseline, skeleton, dots) goes in the flip group.
  const flip = document.createElementNS(SVG_NS, "g");
  flip.setAttribute("transform", "scale(1, -1)");
  svg.appendChild(flip);

  if (showGrid) appendGrid(flip, minX, maxX, minY, maxY);
  appendBaselineMarker(flip, minX, maxX);
  appendSkeleton(flip, skeleton, strokeColors);
  appendDots(flip, dots, opts.dotScale ?? 1);

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

function appendFilledGlyph(parent: SVGElement, asset: FontAsset, char: string) {
  // opentype.js's getPath() returns commands with Y already negated for SVG
  // (apex of glyph has negative y, descender has positive y). We use it as-is
  // and append outside the flip group — see renderGlyph's coord-handling note.
  const path = asset.font.getPath(char, 0, 0, asset.font.unitsPerEm);
  const d = path.toPathData(2);
  const el = document.createElementNS(SVG_NS, "path");
  el.setAttribute("d", d);
  el.classList.add("inspector-outline");
  parent.appendChild(el);
}

function appendSkeleton(parent: SVGGElement, skeleton: SkeletonPath, colors: string[]) {
  // Split the d string on M commands to color each disjoint sub-path differently.
  // dslToD only emits uppercase M, so this is unambiguous for our data.
  const subPaths = skeleton.match(/M[^M]*/g) ?? [];
  const g = document.createElementNS(SVG_NS, "g");
  g.classList.add("inspector-skeleton");
  subPaths.forEach((d, i) => {
    const el = document.createElementNS(SVG_NS, "path");
    el.setAttribute("d", d.trim());
    // Inline fill="none" as a safety baseline so the renderer is correct
    // without inspector.css (default fill would solid-fill closed Q-curve subpaths).
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", colors[i % colors.length] ?? colors[0] ?? "#000");
    el.setAttribute("vector-effect", "non-scaling-stroke");
    g.appendChild(el);
  });
  parent.appendChild(g);
}

function appendDots(parent: SVGGElement, dots: SkeletonDot[], radiusScale: number) {
  if (dots.length === 0) return;
  const g = document.createElementNS(SVG_NS, "g");
  g.classList.add("inspector-dots");
  for (const dot of dots) {
    const el = document.createElementNS(SVG_NS, "circle");
    el.setAttribute("cx", `${dot.cx}`);
    el.setAttribute("cy", `${dot.cy}`);
    el.setAttribute("r", `${dot.r * radiusScale}`);
    g.appendChild(el);
  }
  parent.appendChild(g);
}
