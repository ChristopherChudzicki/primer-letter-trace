import type { FontAsset } from "../rendering/font";
import { glyphPath } from "../rendering/glyph";
import { computeLines, CAP_HEIGHT_PX } from "../rendering/ruled-lines";
import type { RowStyle, Size } from "../config/types";

const SVG_NS = "http://www.w3.org/2000/svg";
const LETTER_GAP_EM = 0.35;

interface RowOptions {
  asset: FontAsset;
  char: string;
  rowStyle: RowStyle;
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

  const sample = glyphPath(opts.asset, opts.char, geom.fontSizePx);
  const gapPx = geom.fontSizePx * LETTER_GAP_EM;
  const slotWidth = sample.width + gapPx;
  const slotsAvailable = Math.max(1, Math.floor(opts.widthPx / slotWidth));

  let slots: Array<"solid" | "dashed" | "blank"> = [];
  switch (opts.rowStyle) {
    case "combo":
      slots = ["solid", "dashed", "dashed"];
      while (slots.length < slotsAvailable) slots.push("blank");
      break;
    case "all-trace":
      slots = new Array(slotsAvailable).fill("dashed");
      break;
    case "demo-blank":
      slots = ["solid"];
      while (slots.length < slotsAvailable) slots.push("blank");
      break;
  }

  slots.slice(0, slotsAvailable).forEach((kind, i) => {
    if (kind === "blank") return;
    const x = i * slotWidth;
    const path = glyphPath(opts.asset, opts.char, geom.fontSizePx, x, geom.baseline);
    appendGlyph(svg, path.pathD, kind);
  });

  return svg;
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

function appendGlyph(svg: SVGSVGElement, d: string, kind: "solid" | "dashed"): void {
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", d);
  if (kind === "solid") {
    p.setAttribute("fill", "currentColor");
  } else {
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#888");
    p.setAttribute("stroke-width", "1.5");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("stroke-dasharray", "4 4");
  }
  svg.appendChild(p);
}
