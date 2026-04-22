// Shared types for generated skeleton modules.

export interface SkeletonMeta {
  /** Original font filename this skeleton set was derived from. */
  sourceFont: string;
  /** Font's units-per-em — all skeleton coordinates are in these units. */
  unitsPerEm: number;
  /** Font metrics echoed from the source, for convenience. */
  capHeight: number;
  xHeight: number;
  ascender: number;
  descender: number;
  /** When this file was generated (ISO 8601). */
  generatedAt: string;
}

/**
 * A skeleton path for one character, expressed as an SVG `d` attribute in
 * font units. The origin is the glyph baseline; y grows upward (cap-height
 * is positive, descender is negative). The renderer flips Y at draw time
 * with a `scale(s, -s)` transform.
 */
export type SkeletonPath = string;

/**
 * A solid dot — rendered as a filled circle rather than a dashed stroke.
 * Used for small round components like the tittle on i/j, which thinning
 * collapses to a point and which visually read as "dots" to the learner.
 */
export interface SkeletonDot {
  cx: number;
  cy: number;
  /** Radius in font units. */
  r: number;
}

export interface SkeletonSet {
  meta: SkeletonMeta;
  skeletons: Record<string, SkeletonPath>;
  /** Solid dots per glyph (e.g., i, j). Optional per char. */
  dots: Record<string, SkeletonDot[]>;
}

// ── Hand-authorable DSL ────────────────────────────────────────────────────
// `SkeletonPath` (above) is the runtime/serialized form. The DSL below is
// the structured form humans (and LLMs) author in `andika-overrides.ts`.
// `dsl.ts` converts between them.

/** A point in font units, [x, y] with y growing upward. */
export type Point = readonly [x: number, y: number];

/** A single drawing command within a continuous stroke. */
export type Segment =
  | { type: "line"; to: Point }
  | { type: "qcurve"; control: Point; to: Point };

/**
 * A continuous pen-down stroke: one starting point, then a sequence of
 * line/curve segments. Disjoint pieces of a glyph are separate strokes.
 */
export interface Stroke {
  start: Point;
  segments: Segment[];
}

/**
 * A hand-authored skeleton for one glyph. Outer `strokes` array order
 * captures stroke order (first array element = first stroke drawn). The
 * v1 renderer ignores order, but later work (numbered indicators,
 * animation) can read it directly.
 */
export interface GlyphSkeleton {
  strokes: Stroke[];
  /** Solid dots, same shape as the runtime form. Optional per glyph. */
  dots?: SkeletonDot[];
}

/** Per-character override map. Keys are single-character strings. */
export type SkeletonOverrides = Record<string, GlyphSkeleton>;
