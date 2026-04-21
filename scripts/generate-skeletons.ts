/**
 * Font-agnostic skeleton generator.
 *
 * Reads an OFL/TTF font, rasterizes each requested glyph, runs Zhang-Suen
 * thinning + polyline tracing (via skeleton-tracing-js), simplifies the
 * polylines (simplify-js), and writes a TypeScript module exporting a
 * `SkeletonSet` for use at runtime.
 *
 * Usage:
 *   npm run generate:skeletons -- \
 *     --font public/andika.ttf \
 *     --output src/rendering/skeletons/andika.ts \
 *     [--chars "ABC…"] \
 *     [--raster-size 512] \
 *     [--simplify-tolerance 1.5]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import opentype from "opentype.js";
// @ts-expect-error — skeleton-tracing-js ships without types
import TraceSkeleton from "skeleton-tracing-js";
// @ts-expect-error — simplify-js ships without types
import simplify from "simplify-js";

const DEFAULT_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

interface Args {
  font: string;
  output: string;
  chars: string;
  rasterSize: number;
  simplifyTolerance: number;
}

function parseArgs(argv: string[]): Args {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  if (!args.font || !args.output) {
    console.error(
      "Usage: generate-skeletons --font <ttf> --output <ts> [--chars STR] [--raster-size N] [--simplify-tolerance N]",
    );
    process.exit(1);
  }
  return {
    font: args.font,
    output: args.output,
    chars: args.chars ?? DEFAULT_CHARS,
    rasterSize: args["raster-size"] ? Number(args["raster-size"]) : 512,
    simplifyTolerance: args["simplify-tolerance"]
      ? Number(args["simplify-tolerance"])
      : 1.5,
  };
}

/** Rasterize a single glyph to a binary Uint8Array (1 = ink, 0 = empty).
 *
 * The glyph is rendered at a font-size chosen so its em-box fits the raster
 * comfortably, then centered. The returned info includes the transform
 * (scale + translation) so we can map skeleton pixels back to font units.
 */
function rasterizeGlyph(
  font: opentype.Font,
  char: string,
  rasterSize: number,
): {
  imageData: { data: Uint8ClampedArray; width: number; height: number };
  toFontUnits: (px: [number, number]) => [number, number];
} {
  // Font-size in pixels such that the em-height is ~80% of the raster —
  // leaves margin for glyph overshoot + thinning boundary effects.
  const emPx = rasterSize * 0.8;
  const scale = emPx / font.unitsPerEm;

  // Place the glyph baseline at y = rasterSize * 0.8 (leaves 20% below for descenders
  // and 0% above; the ascender fits within 80%).
  const baselineY = rasterSize * 0.8;
  // Horizontally, center the glyph's advance width in the raster.
  const glyph = font.charToGlyph(char);
  const advance = (glyph.advanceWidth ?? font.unitsPerEm * 0.5) * scale;
  const originX = (rasterSize - advance) / 2;

  const canvas = createCanvas(rasterSize, rasterSize);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, rasterSize, rasterSize);
  ctx.fillStyle = "#fff";

  const path = font.getPath(char, originX, baselineY, emPx);
  // opentype.js draws with path.fill (default: "black"), which would paint
  // black on our black background. Set white explicitly.
  path.fill = "#fff";
  path.stroke = null;
  path.draw(ctx as unknown as CanvasRenderingContext2D);

  const raw = ctx.getImageData(0, 0, rasterSize, rasterSize);
  // skeleton-tracing-js expects a Uint8ClampedArray in ImageData-like shape.
  // Convert to our own copy to be safe across runtimes.
  const imageData = {
    data: new Uint8ClampedArray(raw.data.buffer.slice(0)),
    width: rasterSize,
    height: rasterSize,
  };

  // Inverse transform: pixel (px, py) → (font_x, font_y)
  // Our rasterizer:   font_x * scale + originX  = px
  //                   baselineY - font_y * scale = py   (y-flip)
  // So:   font_x = (px - originX) / scale
  //       font_y = (baselineY - py) / scale
  const toFontUnits = (p: [number, number]): [number, number] => {
    const [px, py] = p;
    return [(px - originX) / scale, (baselineY - py) / scale];
  };

  return { imageData, toFontUnits };
}

interface Polyline {
  points: [number, number][];
}

function traceSkeleton(imageData: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}): Polyline[] {
  // skeleton-tracing-js's fromImageData treats any non-zero red channel as ink.
  const result = TraceSkeleton.fromImageData(imageData) as {
    polylines: [number, number][][];
  };
  return result.polylines.map((pts) => ({ points: pts }));
}

function simplifyPolyline(
  polyline: Polyline,
  tolerancePx: number,
): Polyline {
  if (polyline.points.length < 3) return polyline;
  const asObjs = polyline.points.map(([x, y]) => ({ x, y }));
  const simpler = simplify(asObjs, tolerancePx, true) as { x: number; y: number }[];
  return { points: simpler.map((p) => [p.x, p.y]) };
}

/** Total Euclidean length of a polyline. */
function polylineLength(p: Polyline): number {
  let sum = 0;
  for (let i = 1; i < p.points.length; i++) {
    const prev = p.points[i - 1]!;
    const curr = p.points[i]!;
    sum += Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
  }
  return sum;
}

/** True if the given endpoint of polyline is within `tol` of any endpoint of `others`. */
function endpointHasNeighbor(
  endpoint: [number, number],
  others: Polyline[],
  tol: number,
): boolean {
  for (const other of others) {
    const start = other.points[0]!;
    const end = other.points[other.points.length - 1]!;
    if (Math.hypot(endpoint[0] - start[0], endpoint[1] - start[1]) < tol) return true;
    if (Math.hypot(endpoint[0] - end[0], endpoint[1] - end[1]) < tol) return true;
  }
  return false;
}

type EndpointClass = "isolated" | "spur" | "junction";

/**
 * Classify a short polyline by its endpoint connectivity to other polylines:
 * - `junction`: both ends coincide with other polylines' endpoints (e.g., the
 *   crossing segment at the center of an X — must be kept to connect arms).
 * - `spur`: exactly one end is connected; the other end dangles (e.g., the
 *   Y-spike artifact at the top of W).
 * - `isolated`: neither end is connected (e.g., the dot on i or j).
 */
function classifyEndpoints(
  p: Polyline,
  allPolylines: Polyline[],
  tol: number,
): EndpointClass {
  const others = allPolylines.filter((other) => other !== p);
  const start = p.points[0]!;
  const end = p.points[p.points.length - 1]!;
  const startConnected = endpointHasNeighbor(start, others, tol);
  const endConnected = endpointHasNeighbor(end, others, tol);
  if (startConnected && endConnected) return "junction";
  if (startConnected || endConnected) return "spur";
  return "isolated";
}

/**
 * Drop short spur polylines that dangle off a junction (thinning artifacts).
 * Keep short junction pieces (crossings like X's center) and short isolated
 * strokes (dots on i/j).
 */
function pruneSpurs(
  polylines: Polyline[],
  minLengthUnits: number,
  connectToleranceUnits: number,
): Polyline[] {
  return polylines.filter((p) => {
    if (polylineLength(p) >= minLengthUnits) return true;
    return classifyEndpoints(p, polylines, connectToleranceUnits) !== "spur";
  });
}

interface Component {
  /** Centroid in pixel space. */
  cx: number;
  cy: number;
  /** Pixel-space bounding box. */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** Pixel count. */
  size: number;
}

/** Label ink pixels with 4-connected components; return per-component stats. */
function findComponents(imageData: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}): Component[] {
  const { data, width, height } = imageData;
  const labels = new Int32Array(width * height);
  const out: Component[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (data[idx * 4]! < 128) continue;
      if (labels[idx] !== 0) continue;

      labels[idx] = out.length + 1;
      const stack: [number, number][] = [[x, y]];
      let sumX = 0, sumY = 0, count = 0;
      let minX = x, maxX = x, minY = y, maxY = y;

      while (stack.length) {
        const [px, py] = stack.pop()!;
        sumX += px; sumY += py; count++;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (labels[ni] !== 0) continue;
          if (data[ni * 4]! < 128) continue;
          labels[ni] = out.length + 1;
          stack.push([nx, ny]);
        }
      }
      out.push({ cx: sumX / count, cy: sumY / count, minX, maxX, minY, maxY, size: count });
    }
  }
  return out;
}

/** True if `pt` falls inside the component's bounding box. */
function pointInComponent(pt: [number, number], c: Component): boolean {
  const [x, y] = pt;
  return x >= c.minX && x <= c.maxX && y >= c.minY && y <= c.maxY;
}

/**
 * For each connected ink component not covered by any existing polyline,
 * emit a short horizontal segment centered on its centroid — enough to show
 * as a dashed mark under the ghost fill (the tittle on i / j, for example).
 * Without this step, skeleton-tracing-js drops small round components
 * because thinning collapses them to a single pixel.
 */
function addMissingComponentMarkers(
  polylines: Polyline[],
  components: Component[],
): Polyline[] {
  const extra: Polyline[] = [];
  for (const c of components) {
    const covered = polylines.some((p) => p.points.some((pt) => pointInComponent(pt, c)));
    if (covered) continue;
    // Short horizontal dash spanning ~60% of the component's width so it
    // reads as a mark inside the ghost fill rather than an isolated dot.
    const halfSpan = Math.max(2, (c.maxX - c.minX) * 0.3);
    extra.push({
      points: [
        [c.cx - halfSpan, c.cy],
        [c.cx + halfSpan, c.cy],
      ],
    });
  }
  return [...polylines, ...extra];
}

/** Map pixel-space polylines back to font units. */
function mapToFontUnits(
  polyline: Polyline,
  toFontUnits: (p: [number, number]) => [number, number],
): Polyline {
  return { points: polyline.points.map(toFontUnits) };
}

/** Build an SVG `d` string from one or more polylines. */
function polylinesToSvgPath(polylines: Polyline[], decimals = 2): string {
  const parts: string[] = [];
  const fmt = (n: number): string => n.toFixed(decimals).replace(/\.?0+$/, "");
  for (const poly of polylines) {
    if (poly.points.length === 0) continue;
    const first = poly.points[0]!;
    parts.push(`M ${fmt(first[0])} ${fmt(first[1])}`);
    for (let i = 1; i < poly.points.length; i++) {
      const p = poly.points[i]!;
      parts.push(`L ${fmt(p[0])} ${fmt(p[1])}`);
    }
  }
  return parts.join(" ");
}

function extractOs2(font: opentype.Font) {
  const os2 = (font.tables as { os2?: { sxHeight?: number; sCapHeight?: number } }).os2;
  return {
    xHeight:
      os2?.sxHeight && os2.sxHeight > 0
        ? os2.sxHeight
        : Math.round(font.unitsPerEm * 0.5),
    capHeight:
      os2?.sCapHeight && os2.sCapHeight > 0
        ? os2.sCapHeight
        : Math.round(font.unitsPerEm * 0.7),
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Loading font: ${args.font}`);
  const buf = readFileSync(args.font);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const font = opentype.parse(ab);
  const os2 = extractOs2(font);

  const skeletons: Record<string, string> = {};
  const chars = Array.from(args.chars);
  console.log(`Processing ${chars.length} glyphs @ ${args.rasterSize}px raster…`);

  for (const char of chars) {
    const { imageData, toFontUnits } = rasterizeGlyph(
      font,
      char,
      args.rasterSize,
    );
    const raw = traceSkeleton(imageData);
    // Add markers for any connected ink component missed by the tracer
    // (e.g., tittles on i / j — small round blobs that thin to a point).
    const components = findComponents(imageData);
    const withMarkers = addMissingComponentMarkers(raw, components);
    if (withMarkers.length === 0) {
      console.warn(`  ${JSON.stringify(char)}: no skeleton found — skipping`);
      continue;
    }
    const markerCount = withMarkers.length - raw.length;
    const simplified = withMarkers.map((p) => simplifyPolyline(p, args.simplifyTolerance));
    const inFontUnits = simplified.map((p) => mapToFontUnits(p, toFontUnits));
    // Prune spur artifacts from thinning at sharp junctions. Thresholds in
    // font units; ~8% of em length is typical for junction spurs.
    const minLengthUnits = font.unitsPerEm * 0.08;
    const connectToleranceUnits = font.unitsPerEm * 0.02;
    const pruned = pruneSpurs(inFontUnits, minLengthUnits, connectToleranceUnits);
    const prunedCount = inFontUnits.length - pruned.length;
    skeletons[char] = polylinesToSvgPath(pruned);
    const pointCount = pruned.reduce((n, p) => n + p.points.length, 0);
    const strokes = pruned.length;
    const notes: string[] = [];
    if (prunedCount > 0) notes.push(`pruned ${prunedCount} spur${prunedCount === 1 ? "" : "s"}`);
    if (markerCount > 0) notes.push(`added ${markerCount} component marker${markerCount === 1 ? "" : "s"}`);
    const noteStr = notes.length ? ` (${notes.join("; ")})` : "";
    console.log(
      `  ${JSON.stringify(char)}: ${strokes} stroke${strokes === 1 ? "" : "s"}, ${pointCount} points${noteStr}`,
    );
  }

  const output = renderModule({
    sourceFont: basename(args.font),
    unitsPerEm: font.unitsPerEm,
    capHeight: os2.capHeight,
    xHeight: os2.xHeight,
    ascender: font.ascender,
    descender: font.descender,
    generatedAt: new Date().toISOString(),
    skeletons,
  });
  writeFileSync(args.output, output);
  console.log(`Wrote ${Object.keys(skeletons).length} skeletons to ${args.output}`);
}

function renderModule(data: {
  sourceFont: string;
  unitsPerEm: number;
  capHeight: number;
  xHeight: number;
  ascender: number;
  descender: number;
  generatedAt: string;
  skeletons: Record<string, string>;
}): string {
  const entries = Object.entries(data.skeletons)
    .map(([char, path]) => `  ${JSON.stringify(char)}: ${JSON.stringify(path)},`)
    .join("\n");
  return `// AUTO-GENERATED by scripts/generate-skeletons.ts — do not edit by hand.
// Source: ${data.sourceFont}
// Generated: ${data.generatedAt}
import type { SkeletonSet } from "./types";

const SET: SkeletonSet = {
  meta: {
    sourceFont: ${JSON.stringify(data.sourceFont)},
    unitsPerEm: ${data.unitsPerEm},
    capHeight: ${data.capHeight},
    xHeight: ${data.xHeight},
    ascender: ${data.ascender},
    descender: ${data.descender},
    generatedAt: ${JSON.stringify(data.generatedAt)},
  },
  skeletons: {
${entries}
  },
};

export default SET;
`;
}

main();
