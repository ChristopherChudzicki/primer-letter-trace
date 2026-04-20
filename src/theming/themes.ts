import type { Theme } from "../config/types";

export interface Motif {
  /** Short name for debugging. */
  name: string;
  /** Inline SVG markup. viewBox should be 0 0 48 48. Uses currentColor. */
  svg: string;
  /**
   * Relative visual weight: 1.0 = normal, larger means "prefer more page area
   * to this motif." Used by the placement engine to bias size.
   */
  scale?: number;
  /** Preferred tint: "primary" (larger, more prominent) or "accent" (smaller). */
  tint?: "primary" | "accent";
}

export interface ThemeDef {
  palette: {
    /** Color of the three ruled lines on each row. */
    ruleColor: string;
    /** Larger / more prominent motifs. */
    primary: string;
    /** Smaller / sparkle motifs, and header decoration. */
    accent: string;
  };
  /** Library of motifs available to the placement engine. */
  motifs: Motif[];
  /**
   * Short decorative strip placed under the big word in single-item layout.
   * viewBox should be 0 0 200 12 (wide strip, thin). "" if no decoration.
   */
  headerDecoration: string;
}

// ---------- SVG motif library ----------
// All motifs use viewBox 0 0 48 48, fill="currentColor" where possible so
// they pick up the palette color at placement time.

const STAR_5 = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M24 4l5.6 11.4 12.6 1.8-9.1 8.9 2.2 12.5L24 32.7l-11.3 5.9 2.2-12.5-9.1-8.9 12.6-1.8z"/>
</svg>`;

const SPARKLE_4 = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M24 3 L27 21 L45 24 L27 27 L24 45 L21 27 L3 24 L21 21 Z"/>
</svg>`;

const HEART = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M24 42 C 8 30 4 20 10 13 C 16 6 22 10 24 16 C 26 10 32 6 38 13 C 44 20 40 30 24 42 Z"/>
</svg>`;

const CROWN = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="M4 18l8 6 6-14 6 14 6-14 6 14 8-6-4 22H8z"/>
  <circle fill="currentColor" cx="24" cy="10" r="3"/>
  <circle fill="currentColor" cx="8" cy="14" r="2.5"/>
  <circle fill="currentColor" cx="40" cy="14" r="2.5"/>
</svg>`;

const UNICORN = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- horn -->
  <path fill="currentColor" d="M24 2 L20 16 L28 16 Z"/>
  <!-- ears -->
  <path fill="currentColor" d="M14 16 Q 12 10 16 12 L 18 18 Z"/>
  <!-- head + body silhouette -->
  <path fill="currentColor" d="M18 16 Q 8 18 6 30 L 6 38 L 14 38 L 14 44 L 18 44 L 20 36 L 30 36 L 32 44 L 36 44 L 36 38 L 42 38 L 42 30 Q 42 22 36 20 L 28 16 Z"/>
  <!-- mane -->
  <path fill="currentColor" opacity="0.55" d="M22 18 Q 30 20 34 26 Q 30 22 24 22 Z"/>
  <!-- eye -->
  <circle fill="#fff" cx="14" cy="26" r="1.5"/>
</svg>`;

const FAIRY_WAND = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- stick -->
  <path fill="currentColor" d="M14 42 L 34 14 L 36 16 L 16 44 Z" opacity="0.85"/>
  <!-- star on top -->
  <path fill="currentColor" d="M34 4 L 37 12 L 45 14 L 37 16 L 34 24 L 31 16 L 23 14 L 31 12 Z"/>
  <!-- sparkles -->
  <circle fill="currentColor" cx="42" cy="24" r="1.5"/>
  <circle fill="currentColor" cx="26" cy="8" r="1.5"/>
</svg>`;

const CASTLE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- tower base -->
  <path fill="currentColor" d="M8 42 L 8 20 L 14 20 L 14 14 L 20 14 L 20 20 L 28 20 L 28 14 L 34 14 L 34 20 L 40 20 L 40 42 Z"/>
  <!-- crenellations -->
  <path fill="currentColor" d="M8 20 L 8 16 L 11 16 L 11 20 Z M 18 20 L 18 16 L 22 16 L 22 20 Z M 26 20 L 26 16 L 30 16 L 30 20 Z M 37 20 L 37 16 L 40 16 L 40 20 Z"/>
  <!-- roof peaks -->
  <path fill="currentColor" d="M 13 14 L 17 8 L 21 14 Z M 27 14 L 31 8 L 35 14 Z"/>
  <!-- door -->
  <path fill="#fff" opacity="0.6" d="M 21 42 L 21 32 Q 24 28 27 32 L 27 42 Z"/>
  <!-- flag -->
  <path fill="currentColor" d="M17 8 L 17 2 L 24 4 L 17 6 Z"/>
</svg>`;

const RAINBOW = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" d="M 6 38 A 18 18 0 0 1 42 38"/>
  <path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.6" d="M 12 38 A 12 12 0 0 1 36 38"/>
  <path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.35" d="M 18 38 A 6 6 0 0 1 30 38"/>
</svg>`;

const FLOWER = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <circle fill="currentColor" cx="24" cy="12" r="7"/>
  <circle fill="currentColor" cx="36" cy="20" r="7"/>
  <circle fill="currentColor" cx="32" cy="34" r="7"/>
  <circle fill="currentColor" cx="16" cy="34" r="7"/>
  <circle fill="currentColor" cx="12" cy="20" r="7"/>
  <circle fill="#fff" cx="24" cy="24" r="5"/>
</svg>`;

// Header decoration strip: little stars in a line.
const STAR_TRAIL = `<svg viewBox="0 0 200 12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <g fill="currentColor">
    <path d="M20 6 l1.5 3 3 .5-2.2 2 .6 3L20 13l-2.9 1.5.6-3-2.2-2 3-.5z"/>
    <path d="M50 6 l1 2 2 .3-1.5 1.3.4 2L50 10.8 48.1 11.6l.4-2L47 8.3l2-.3z"/>
    <path d="M100 6 l2 4 4.5.6-3 2.7.8 4L100 15.3l-4.3 2 .8-4-3-2.7 4.5-.6z"/>
    <path d="M150 6 l1 2 2 .3-1.5 1.3.4 2L150 10.8 148.1 11.6l.4-2L147 8.3l2-.3z"/>
    <path d="M180 6 l1.5 3 3 .5-2.2 2 .6 3L180 13l-2.9 1.5.6-3-2.2-2 3-.5z"/>
  </g>
</svg>`;

export const THEMES: Record<Theme, ThemeDef> = {
  none: {
    palette: {
      ruleColor: "#b8b8b8",
      primary: "#b8b8b8",
      accent: "#b8b8b8",
    },
    motifs: [],
    headerDecoration: "",
  },
  enchanted: {
    palette: {
      ruleColor: "#c48cc9",
      primary: "#b760d4",     // stronger purple for big motifs
      accent: "#f4a6d1",      // soft pink for sparkles / trails
    },
    motifs: [
      { name: "unicorn",    svg: UNICORN,     scale: 1.3, tint: "primary" },
      { name: "castle",     svg: CASTLE,      scale: 1.2, tint: "primary" },
      { name: "crown",      svg: CROWN,       scale: 1.0, tint: "primary" },
      { name: "rainbow",    svg: RAINBOW,     scale: 1.1, tint: "primary" },
      { name: "fairy-wand", svg: FAIRY_WAND,  scale: 1.0, tint: "primary" },
      { name: "flower",     svg: FLOWER,      scale: 0.9, tint: "accent" },
      { name: "heart",      svg: HEART,       scale: 0.8, tint: "accent" },
      { name: "star5",      svg: STAR_5,      scale: 0.75, tint: "accent" },
      { name: "sparkle4",   svg: SPARKLE_4,   scale: 0.65, tint: "accent" },
    ],
    headerDecoration: STAR_TRAIL,
  },
};
