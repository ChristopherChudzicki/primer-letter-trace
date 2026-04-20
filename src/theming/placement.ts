import type { ThemeDef, Motif } from "./themes";
import type { Size } from "../config/types";

export interface PlacedMotif {
  /** Left edge in page-local pixels. */
  x: number;
  /** Top edge in page-local pixels. */
  y: number;
  /** Rendered pixel size (width = height). */
  size: number;
  /** Rotation in degrees, typically small (±12). */
  rotation: number;
  /** SVG color (hex). */
  color: string;
  /** The motif's SVG markup. */
  svg: string;
}

// Base motif size in pixels, scaled by the Size preset.
const BASE_MOTIF_PX: Record<Size, number> = {
  small: 34,
  medium: 42,
  large: 54,
};

const MOTIFS_PER_PAGE: Record<Size, number> = {
  small: 6,
  medium: 5,
  large: 4,
};

/** Simple deterministic hash → 32-bit int (djb2 variant). */
function hash32(str: string): number {
  let h = 5381 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) >>> 0) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG seeded from a 32-bit int. Returns [0, 1). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Candidate placement zones — positions along the page margin where motifs
 * can land without covering practice content. Each zone is a rectangle in
 * page-local coordinates that a motif of the base size should fit inside.
 *
 * Returned zones have exclusive centers in the margin strip around the
 * printable area.
 */
function pageZones(
  pageWidthPx: number,
  pageHeightPx: number,
  marginPx: number,
): Array<{ cx: number; cy: number }> {
  const halfMargin = marginPx / 2;
  // Centers in each margin strip
  return [
    // Corners
    { cx: halfMargin, cy: halfMargin },                                       // top-left
    { cx: pageWidthPx - halfMargin, cy: halfMargin },                         // top-right
    { cx: halfMargin, cy: pageHeightPx - halfMargin },                        // bottom-left
    { cx: pageWidthPx - halfMargin, cy: pageHeightPx - halfMargin },          // bottom-right
    // Edge midpoints
    { cx: pageWidthPx / 2, cy: halfMargin },                                  // top-mid
    { cx: pageWidthPx / 2, cy: pageHeightPx - halfMargin },                   // bottom-mid
    { cx: halfMargin, cy: pageHeightPx / 2 },                                 // left-mid
    { cx: pageWidthPx - halfMargin, cy: pageHeightPx / 2 },                   // right-mid
  ];
}

/**
 * Pick N motifs and place them around the page margins. Seeded by
 * `seedKey` so the same sheet always looks the same.
 */
export function placeMotifs(options: {
  theme: ThemeDef;
  pageWidthPx: number;
  pageHeightPx: number;
  marginPx: number;
  letterSize: Size;
  /** For deterministic placement: same key → same layout. */
  seedKey: string;
  /** Index of this page in a multi-page render (also part of the seed). */
  pageIndex: number;
}): PlacedMotif[] {
  const { theme, pageWidthPx, pageHeightPx, marginPx, letterSize, seedKey, pageIndex } = options;
  if (theme.motifs.length === 0) return [];

  const rand = mulberry32(hash32(`${seedKey}|${pageIndex}`));
  const baseSize = BASE_MOTIF_PX[letterSize];
  const count = MOTIFS_PER_PAGE[letterSize];

  const zones = pageZones(pageWidthPx, pageHeightPx, marginPx);
  // Shuffle zones deterministically so each page uses a unique subset.
  const shuffledZones = [...zones];
  for (let i = shuffledZones.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledZones[i], shuffledZones[j]] = [shuffledZones[j]!, shuffledZones[i]!];
  }

  const chosenZones = shuffledZones.slice(0, count);

  const placements: PlacedMotif[] = [];
  for (const zone of chosenZones) {
    const motif = pickMotif(theme.motifs, rand);
    const scale = motif.scale ?? 1;
    const size = Math.round(baseSize * scale);
    const color = motif.tint === "accent" ? theme.palette.accent : theme.palette.primary;
    const rotation = Math.round((rand() - 0.5) * 24); // ±12°
    placements.push({
      x: Math.round(zone.cx - size / 2),
      y: Math.round(zone.cy - size / 2),
      size,
      rotation,
      color,
      svg: motif.svg,
    });
  }
  return placements;
}

/** Pick a motif weighted by its `scale` (bigger scale ≈ more chance). */
function pickMotif(motifs: Motif[], rand: () => number): Motif {
  if (motifs.length === 0) throw new Error("No motifs to pick");
  const weights = motifs.map((m) => m.scale ?? 1);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < motifs.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return motifs[i]!;
  }
  return motifs[motifs.length - 1]!;
}
