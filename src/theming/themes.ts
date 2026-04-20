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

// ---------- Dinosaur motifs ----------

const T_REX = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Body: big head + stout torso, tail whipping back, short arms, two legs. -->
  <path fill="currentColor" d="M4 30 Q 10 18 22 16 L 28 10 Q 32 6 36 8 Q 40 10 38 14 L 34 18 Q 40 20 42 26 Q 43 30 40 34 L 34 36 L 32 44 L 28 44 L 28 38 L 22 38 L 22 44 L 18 44 L 18 36 Q 10 34 4 30 Z"/>
  <!-- tiny arm -->
  <path fill="currentColor" d="M26 26 L 30 28 L 30 32 L 28 32 L 28 30 L 26 30 Z"/>
  <!-- eye -->
  <circle fill="#fff" cx="34" cy="13" r="1.3"/>
  <!-- teeth -->
  <path fill="#fff" d="M30 15 L 31 17 L 32 15 Z M 33 15 L 34 17 L 35 15 Z"/>
</svg>`;

const BRONTO = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Long-neck: sweeping neck + round body + tail, four stumpy legs. -->
  <path fill="currentColor" d="M6 34 Q 4 26 10 22 Q 20 20 24 26 Q 28 34 40 32 Q 46 30 44 26 Q 40 30 32 26 Q 26 18 20 12 Q 14 6 10 10 Q 12 14 16 16 Q 20 20 18 24 Q 10 22 6 28 Z"/>
  <!-- legs -->
  <path fill="currentColor" d="M10 30 L 10 42 L 14 42 L 14 30 Z M 20 32 L 20 42 L 24 42 L 24 32 Z M 30 32 L 30 42 L 34 42 L 34 32 Z"/>
  <!-- eye -->
  <circle fill="#fff" cx="13" cy="11" r="1.2"/>
</svg>`;

const TRICERATOPS = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Body + big-frill head + three horns. -->
  <path fill="currentColor" d="M6 32 Q 4 22 12 20 L 28 20 Q 36 20 40 16 Q 44 12 44 20 Q 44 26 40 28 Q 38 32 34 32 Q 36 38 32 40 L 30 40 L 28 34 L 18 34 L 16 40 L 14 40 Q 10 38 10 32 Z"/>
  <!-- horns -->
  <path fill="currentColor" d="M34 16 L 32 10 L 38 12 Z M 42 14 L 44 8 L 46 14 Z"/>
  <path fill="currentColor" d="M38 20 L 36 26 L 40 26 Z"/>
  <!-- eye -->
  <circle fill="#fff" cx="36" cy="22" r="1.2"/>
</svg>`;

const STEGOSAURUS = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Low body, small head, spikey plates along the back, clubbed tail. -->
  <path fill="currentColor" d="M4 30 Q 2 24 10 22 L 18 20 Q 22 18 26 20 L 36 22 Q 42 22 44 28 Q 44 34 40 34 L 38 40 L 34 40 L 34 34 L 14 34 L 14 40 L 10 40 L 10 34 Q 4 34 4 30 Z"/>
  <!-- head -->
  <path fill="currentColor" d="M2 26 L 8 26 L 8 30 L 2 30 Z"/>
  <!-- plates -->
  <path fill="currentColor" d="M10 22 L 14 12 L 18 22 Z M 18 20 L 22 8 L 26 20 Z M 26 20 L 30 10 L 34 22 Z M 34 22 L 38 14 L 42 24 Z"/>
  <!-- eye -->
  <circle fill="#fff" cx="4" cy="27" r="1"/>
</svg>`;

const PTERO = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Pterodactyl: broad wings in a flat-V silhouette with head crest. -->
  <path fill="currentColor" d="M4 28 Q 16 12 24 20 Q 32 12 44 28 Q 38 24 32 24 Q 28 22 24 26 Q 20 22 16 24 Q 10 24 4 28 Z"/>
  <!-- head/crest -->
  <path fill="currentColor" d="M24 20 L 20 14 L 26 16 L 30 18 L 28 22 Z"/>
</svg>`;

const VOLCANO = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Mountain triangle with crater notch and lava drips. -->
  <path fill="currentColor" d="M4 42 L 18 16 L 22 20 L 26 14 L 30 20 L 44 42 Z"/>
  <!-- lava splash -->
  <path fill="currentColor" d="M18 10 L 20 4 L 22 12 Z M 26 4 L 28 12 L 24 10 Z"/>
  <!-- smoke / lava drip -->
  <circle fill="currentColor" cx="22" cy="8" r="1.5"/>
  <circle fill="currentColor" cx="28" cy="9" r="1.2"/>
</svg>`;

const FERN = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Simple palm-fern silhouette: central stem with symmetric leaflets. -->
  <path fill="currentColor" d="M23 44 L 23 8 L 25 8 L 25 44 Z"/>
  <!-- leaflets (narrow ovals sweeping outward) -->
  <path fill="currentColor" d="M24 10 Q 12 10 4 20 Q 14 18 24 14 Z"/>
  <path fill="currentColor" d="M24 10 Q 36 10 44 20 Q 34 18 24 14 Z"/>
  <path fill="currentColor" d="M24 18 Q 10 20 2 30 Q 14 26 24 22 Z"/>
  <path fill="currentColor" d="M24 18 Q 38 20 46 30 Q 34 26 24 22 Z"/>
  <path fill="currentColor" d="M24 26 Q 12 30 4 40 Q 16 34 24 30 Z"/>
  <path fill="currentColor" d="M24 26 Q 36 30 44 40 Q 32 34 24 30 Z"/>
</svg>`;

const EGG = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Dino egg: tall oval with a zigzag crack. -->
  <path fill="currentColor" d="M24 4 Q 10 8 10 28 Q 10 44 24 44 Q 38 44 38 28 Q 38 8 24 4 Z"/>
  <!-- crack -->
  <path fill="#fff" opacity="0.75" d="M18 20 L 22 22 L 20 26 L 26 26 L 24 30 L 30 30"
        stroke="#fff" stroke-width="1.2" stroke-linejoin="miter"/>
</svg>`;

const FOOTPRINT = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- 3-toed theropod track. -->
  <path fill="currentColor" d="M24 8 Q 20 10 20 14 L 22 22 L 18 20 Q 14 20 14 26 L 18 30 L 20 28 L 22 32 L 20 42 L 28 42 L 26 32 L 28 28 L 30 30 L 34 26 Q 34 20 30 20 L 26 22 L 28 14 Q 28 10 24 8 Z"/>
</svg>`;

const BONE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Classic two-knob bone. -->
  <path fill="currentColor" d="M8 14 Q 4 14 4 18 Q 4 22 8 22 L 10 22 L 38 26 L 40 26 Q 44 26 44 30 Q 44 34 40 34 Q 44 38 40 40 Q 36 42 34 38 L 32 38 L 12 32 Q 10 36 6 34 Q 2 32 4 28 Q 0 24 4 22 Q 4 18 8 18 Q 8 14 12 14 Q 16 14 14 18 L 14 20 Z"/>
</svg>`;

// Footprint trail — 3-toed theropod tracks alternating left/right.
const FOOTPRINT_TRAIL = `<svg viewBox="0 0 200 12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <g fill="currentColor">
    <!-- each track is a small triangle of toes + pad; drawn at various x. -->
    <g transform="translate(10 6)">
      <circle cx="-2" cy="-2" r="0.9"/><circle cx="0" cy="-3" r="0.9"/><circle cx="2" cy="-2" r="0.9"/>
      <ellipse cx="0" cy="1.2" rx="1.8" ry="1.2"/>
    </g>
    <g transform="translate(45 7)">
      <circle cx="-2" cy="-2" r="0.9"/><circle cx="0" cy="-3" r="0.9"/><circle cx="2" cy="-2" r="0.9"/>
      <ellipse cx="0" cy="1.2" rx="1.8" ry="1.2"/>
    </g>
    <g transform="translate(80 5)">
      <circle cx="-2" cy="-2" r="0.9"/><circle cx="0" cy="-3" r="0.9"/><circle cx="2" cy="-2" r="0.9"/>
      <ellipse cx="0" cy="1.2" rx="1.8" ry="1.2"/>
    </g>
    <g transform="translate(115 7)">
      <circle cx="-2" cy="-2" r="0.9"/><circle cx="0" cy="-3" r="0.9"/><circle cx="2" cy="-2" r="0.9"/>
      <ellipse cx="0" cy="1.2" rx="1.8" ry="1.2"/>
    </g>
    <g transform="translate(150 6)">
      <circle cx="-2" cy="-2" r="0.9"/><circle cx="0" cy="-3" r="0.9"/><circle cx="2" cy="-2" r="0.9"/>
      <ellipse cx="0" cy="1.2" rx="1.8" ry="1.2"/>
    </g>
    <g transform="translate(185 7)">
      <circle cx="-2" cy="-2" r="0.9"/><circle cx="0" cy="-3" r="0.9"/><circle cx="2" cy="-2" r="0.9"/>
      <ellipse cx="0" cy="1.2" rx="1.8" ry="1.2"/>
    </g>
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
  dinosaurs: {
    palette: {
      ruleColor: "#8ba885",     // muted sage
      primary: "#4a7a4c",       // forest green for big dinos
      accent: "#c87035",         // terracotta for accents (volcano, footprints)
    },
    motifs: [
      { name: "t-rex",        svg: T_REX,        scale: 1.3, tint: "primary" },
      { name: "bronto",       svg: BRONTO,       scale: 1.3, tint: "primary" },
      { name: "triceratops",  svg: TRICERATOPS,  scale: 1.2, tint: "primary" },
      { name: "stegosaurus",  svg: STEGOSAURUS,  scale: 1.2, tint: "primary" },
      { name: "pterodactyl",  svg: PTERO,        scale: 1.0, tint: "primary" },
      { name: "volcano",      svg: VOLCANO,      scale: 1.0, tint: "accent" },
      { name: "fern",         svg: FERN,         scale: 0.9, tint: "primary" },
      { name: "egg",          svg: EGG,          scale: 0.75, tint: "accent" },
      { name: "footprint",    svg: FOOTPRINT,    scale: 0.7, tint: "accent" },
      { name: "bone",         svg: BONE,         scale: 0.75, tint: "accent" },
    ],
    headerDecoration: FOOTPRINT_TRAIL,
  },
};
