import type { FontAsset } from "../rendering/font";
import { glyphPath } from "../rendering/glyph";
import { computeLines, CAP_HEIGHT_PX } from "../rendering/ruled-lines";
import type { Size, TraceCount } from "../config/types";
import ANDIKA_SKELETONS from "../rendering/skeletons/andika";
import type { SkeletonSet } from "../rendering/skeletons/types";

const SVG_NS = "http://www.w3.org/2000/svg";
// Extra horizontal space BETWEEN repetitions of a word on the same row.
// Within a word, letters follow their natural advance widths (no extra gap).
const SLOT_GAP_EM = 0.5;

// Single skeleton set for now. When we add more fonts we'll pick based on the
// font in use; the rest of the code just takes whichever SkeletonSet matches.
const SKELETONS: SkeletonSet = ANDIKA_SKELETONS;

interface RowOptions {
  asset: FontAsset;
  /** The content of this row — may be a single letter, a whole word, or "" (blank row). */
  line: string;
  /** Render a solid demo glyph at the start of the row. */
  showDemo: boolean;
  /** Number of dashed trace slots after the demo (before blanks fill the rest). */
  traceCount: TraceCount;
  size: Size;
  widthPx: number;
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

  appendLine(svg, 0, geom.headline, opts.widthPx, geom.headline, opts.ruleColor, "solid");
  appendLine(svg, 0, geom.midline, opts.widthPx, geom.midline, opts.ruleColor, "dashed");
  appendLine(svg, 0, geom.baseline, opts.widthPx, geom.baseline, opts.ruleColor, "solid");

  // Blank line: just ruled lines, no letters.
  if (opts.line === "") return svg;

  const lineWidth = computeLineWidth(opts.asset, opts.line, geom.fontSizePx);
  const slotGap = geom.fontSizePx * SLOT_GAP_EM;
  const slotWidth = lineWidth + slotGap;
  // How many slots will fit across the row. 1 minimum — if a word is wider
  // than the printable width, we still show it (user opted into overflow).
  const slotsThatFit = Math.max(1, Math.floor(opts.widthPx / slotWidth));

  // Functional slots always render (a demo + the requested number of trace
  // copies), even for wide words that overflow the row. Remaining width is
  // filled with blank slots for free-copy space.
  const slots: Array<"solid" | "dashed" | "blank"> = [];
  if (opts.showDemo) slots.push("solid");
  for (let i = 0; i < opts.traceCount; i++) slots.push("dashed");
  while (slots.length < slotsThatFit) slots.push("blank");

  slots.forEach((kind, i) => {
    if (kind === "blank") return;
    const startX = i * slotWidth;
    renderLineAt(svg, opts.asset, opts.line, geom.fontSizePx, startX, geom.baseline, kind);
  });

  return svg;
}

/** Sum of advance widths for all characters of the line at the given font-size. */
function computeLineWidth(asset: FontAsset, line: string, fontSizePx: number): number {
  let total = 0;
  for (const char of Array.from(line)) {
    total += glyphPath(asset, char, fontSizePx).width;
  }
  return total;
}

/**
 * Render each character of `line` starting at `startX` on `baselineY`.
 * Kind = "solid": filled glyph only.
 * Kind = "dashed": pale ghost fill + dashed centerline skeleton on top.
 */
function renderLineAt(
  svg: SVGSVGElement,
  asset: FontAsset,
  line: string,
  fontSizePx: number,
  startX: number,
  baselineY: number,
  kind: "solid" | "dashed",
): void {
  let cursorX = startX;
  for (const char of Array.from(line)) {
    const g = glyphPath(asset, char, fontSizePx, cursorX, baselineY);
    if (kind === "solid") {
      appendFilledGlyph(svg, g.pathD, "currentColor");
    } else {
      appendFilledGlyph(svg, g.pathD, "rgba(0, 0, 0, 0.13)");
      appendSkeleton(svg, char, fontSizePx, cursorX, baselineY);
    }
    cursorX += g.width;
  }
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

function appendFilledGlyph(svg: SVGSVGElement, d: string, fill: string): void {
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", d);
  p.setAttribute("fill", fill);
  svg.appendChild(p);
}

function appendSkeleton(
  svg: SVGSVGElement,
  char: string,
  fontSizePx: number,
  originX: number,
  baselineY: number,
): void {
  const skelData = SKELETONS.skeletons[char];
  const dotData = SKELETONS.dots[char];
  if (!skelData && !dotData) return;

  const scale = fontSizePx / SKELETONS.meta.unitsPerEm;
  const transform = `translate(${originX}, ${baselineY}) scale(${scale}, ${-scale})`;

  if (skelData) {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", skelData);
    p.setAttribute("transform", transform);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#888");
    p.setAttribute("stroke-width", "1.5");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("stroke-dasharray", "4 4");
    p.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(p);
  }

  if (dotData) {
    // Solid filled circle — tittle on i/j. Rendered in font units and
    // transformed with the skeleton so the radius scales with font-size.
    // Shrunk below the raw detected radius so the dot sits comfortably
    // inside the ghost fill rather than covering it.
    for (const dot of dotData) {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", `${dot.cx}`);
      c.setAttribute("cy", `${dot.cy}`);
      c.setAttribute("r", `${dot.r * 0.55}`);
      c.setAttribute("transform", transform);
      c.setAttribute("fill", "#888");
      svg.appendChild(c);
    }
  }
}
