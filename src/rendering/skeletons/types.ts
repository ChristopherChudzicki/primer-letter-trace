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
 * font units. The origin is the glyph baseline; y grows downward to match
 * opentype.js conventions (top of glyph has smaller y).
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
