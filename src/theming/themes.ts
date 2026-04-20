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
  <!-- T-Rex profile facing right: tail sweeps left, body leans forward over
       two powerful hind legs, arched neck carries a big boxy head with jaw
       open to the right, tiny arm curls against the chest. -->
  <path fill="currentColor" d="M2 30 Q 8 24 18 22 Q 24 20 26 16 Q 26 8 34 8 L 44 10 L 46 14 L 40 16 L 42 18 L 34 20 Q 28 20 28 24 Q 32 28 34 30 Q 30 32 30 36 L 32 44 L 28 44 L 26 36 L 20 36 L 22 44 L 18 44 L 16 36 Q 10 34 6 32 Z"/>
  <!-- eye -->
  <circle fill="#fff" cx="40" cy="12" r="1.2"/>
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
  <!-- Classic dumbbell bone: two round knobs per end, straight shaft between. -->
  <g fill="currentColor">
    <circle cx="10" cy="20" r="6"/>
    <circle cx="10" cy="28" r="6"/>
    <circle cx="38" cy="20" r="6"/>
    <circle cx="38" cy="28" r="6"/>
    <rect x="10" y="20" width="28" height="8"/>
  </g>
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

// ---------- Vehicle motifs (cars + planes + trains + boats) ----------

const CAR = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Sedan body: low front/back with cabin in the middle. -->
  <path fill="currentColor" d="M2 34 L 8 26 Q 12 24 18 24 L 30 24 Q 34 24 38 26 L 46 34 L 46 38 L 2 38 Z"/>
  <!-- Windshield + rear window (white translucent) -->
  <path fill="#fff" opacity="0.55" d="M12 26 L 16 23 L 24 23 L 24 29 L 12 29 Z"/>
  <path fill="#fff" opacity="0.55" d="M26 23 L 32 23 L 36 26 L 36 29 L 26 29 Z"/>
  <!-- Wheels -->
  <circle fill="currentColor" cx="14" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="14" cy="40" r="1.5"/>
  <circle fill="currentColor" cx="34" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="34" cy="40" r="1.5"/>
</svg>`;

const TRUCK = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Pickup truck: cab + longer bed. -->
  <path fill="currentColor" d="M2 38 L 2 22 L 10 22 L 14 16 L 22 16 L 22 38 Z"/>
  <path fill="currentColor" d="M22 22 L 46 22 L 46 38 L 22 38 Z"/>
  <!-- Cab window -->
  <path fill="#fff" opacity="0.55" d="M11 22 L 14 18 L 20 18 L 20 22 Z"/>
  <!-- Wheels -->
  <circle fill="currentColor" cx="10" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="10" cy="40" r="1.5"/>
  <circle fill="currentColor" cx="36" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="36" cy="40" r="1.5"/>
</svg>`;

const BUS = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Long rectangular body with a row of windows. -->
  <path fill="currentColor" d="M4 12 L 44 12 Q 46 12 46 14 L 46 38 L 2 38 L 2 14 Q 2 12 4 12 Z"/>
  <path fill="#fff" opacity="0.55" d="M5 16 L 12 16 L 12 22 L 5 22 Z"/>
  <path fill="#fff" opacity="0.55" d="M14 16 L 21 16 L 21 22 L 14 22 Z"/>
  <path fill="#fff" opacity="0.55" d="M23 16 L 30 16 L 30 22 L 23 22 Z"/>
  <path fill="#fff" opacity="0.55" d="M32 16 L 43 16 L 43 22 L 32 22 Z"/>
  <!-- Door -->
  <path fill="#fff" opacity="0.35" d="M38 24 L 43 24 L 43 36 L 38 36 Z"/>
  <!-- Wheels -->
  <circle fill="currentColor" cx="12" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="12" cy="40" r="1.5"/>
  <circle fill="currentColor" cx="36" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="36" cy="40" r="1.5"/>
</svg>`;

const RACE_CAR = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Low streamlined body with a rear spoiler. -->
  <path fill="currentColor" d="M2 34 Q 6 28 14 26 L 34 26 Q 42 26 44 32 L 46 32 L 46 36 L 6 36 L 2 34 Z"/>
  <!-- Cockpit -->
  <path fill="#fff" opacity="0.6" d="M18 28 L 28 28 L 28 32 L 18 32 Z"/>
  <!-- Spoiler -->
  <path fill="currentColor" d="M40 26 L 46 22 L 46 28 L 42 28 Z"/>
  <!-- Wheels -->
  <circle fill="currentColor" cx="10" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="10" cy="40" r="1.5"/>
  <circle fill="currentColor" cx="38" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="38" cy="40" r="1.5"/>
</svg>`;

const AIRPLANE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Side view: fuselage, swept wings, tail fin. -->
  <path fill="currentColor" d="M2 26 Q 4 22 12 22 L 40 24 Q 46 24 46 28 Q 46 30 40 30 L 12 30 Q 4 30 2 26 Z"/>
  <!-- Tail fin -->
  <path fill="currentColor" d="M38 14 L 44 14 L 46 24 L 38 24 Z"/>
  <!-- Wings (top + bottom pair) -->
  <path fill="currentColor" d="M18 24 L 30 14 L 34 14 L 26 24 Z"/>
  <path fill="currentColor" d="M18 28 L 26 28 L 32 36 L 28 36 Z"/>
  <!-- Cockpit window -->
  <circle fill="#fff" opacity="0.7" cx="40" cy="26" r="1.4"/>
</svg>`;

const TRAIN = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Locomotive: boiler (left), cab (right), smokestack + steam puff on top. -->
  <path fill="currentColor" d="M4 34 L 4 20 Q 4 16 10 16 L 28 16 L 28 34 Z"/>
  <path fill="currentColor" d="M28 14 L 44 14 Q 46 14 46 16 L 46 34 L 28 34 Z"/>
  <!-- Smokestack -->
  <path fill="currentColor" d="M8 16 L 8 6 L 14 6 L 14 16 Z"/>
  <circle fill="#fff" opacity="0.7" cx="11" cy="4" r="2"/>
  <!-- Cab windows -->
  <path fill="#fff" opacity="0.55" d="M30 18 L 44 18 L 44 26 L 30 26 Z"/>
  <!-- Wheels -->
  <circle fill="currentColor" cx="12" cy="38" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="12" cy="38" r="1.3"/>
  <circle fill="currentColor" cx="24" cy="38" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="24" cy="38" r="1.3"/>
  <circle fill="currentColor" cx="38" cy="38" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="38" cy="38" r="1.3"/>
</svg>`;

const FIRE_TRUCK = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Box-shape body with a ladder angled up off the back. -->
  <path fill="currentColor" d="M2 38 L 2 22 L 12 22 L 14 18 L 22 18 L 22 22 L 46 22 L 46 38 Z"/>
  <!-- Diagonal ladder bars -->
  <path fill="currentColor" d="M24 22 L 24 20 L 46 10 L 46 12 Z"/>
  <path fill="currentColor" d="M28 16 L 28 14 L 46 6 L 46 8 Z"/>
  <!-- Cab window -->
  <path fill="#fff" opacity="0.55" d="M4 24 L 18 24 L 18 30 L 4 30 Z"/>
  <!-- Siren light dot -->
  <circle fill="#fff" opacity="0.9" cx="18" cy="16" r="1.2"/>
  <!-- Wheels -->
  <circle fill="currentColor" cx="12" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="12" cy="40" r="1.5"/>
  <circle fill="currentColor" cx="36" cy="40" r="4"/>
  <circle fill="#fff" opacity="0.9" cx="36" cy="40" r="1.5"/>
</svg>`;

const HELICOPTER = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Rotor blade (wide thin bar) -->
  <path fill="currentColor" d="M2 10 L 46 10 L 46 13 L 2 13 Z"/>
  <!-- Rotor mast -->
  <path fill="currentColor" d="M22 13 L 26 13 L 26 18 L 22 18 Z"/>
  <!-- Body + tail boom -->
  <path fill="currentColor" d="M6 22 Q 6 18 12 18 L 30 18 Q 38 20 40 26 L 46 28 L 46 30 L 40 30 Q 36 34 28 34 L 12 34 Q 4 32 4 26 Q 4 22 6 22 Z"/>
  <!-- Cockpit window -->
  <path fill="#fff" opacity="0.6" d="M8 22 L 22 22 L 22 30 L 8 30 Z"/>
  <!-- Skids -->
  <path fill="currentColor" d="M6 38 L 38 38 L 38 40 L 6 40 Z"/>
  <path fill="currentColor" d="M10 34 L 12 38 L 10 38 Z"/>
  <path fill="currentColor" d="M30 34 L 34 38 L 32 38 Z"/>
</svg>`;

const SAILBOAT = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Hull -->
  <path fill="currentColor" d="M2 34 L 46 34 L 40 44 L 8 44 Z"/>
  <!-- Mast -->
  <path fill="currentColor" d="M23 6 L 25 6 L 25 32 L 23 32 Z"/>
  <!-- Mainsail (big triangle to right) -->
  <path fill="currentColor" d="M25 8 L 40 32 L 25 32 Z"/>
  <!-- Jib (smaller triangle to left) -->
  <path fill="currentColor" opacity="0.7" d="M23 12 L 12 32 L 23 32 Z"/>
  <!-- Water wavelets -->
  <path fill="currentColor" opacity="0.4" d="M0 40 Q 4 38 8 40 Q 12 42 16 40 L 16 41 Q 12 43 8 41 Q 4 39 0 41 Z"/>
</svg>`;

const TRAFFIC_LIGHT = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Post -->
  <path fill="currentColor" d="M22 36 L 26 36 L 26 46 L 22 46 Z"/>
  <!-- Housing -->
  <path fill="currentColor" d="M14 6 Q 14 4 16 4 L 32 4 Q 34 4 34 6 L 34 34 Q 34 36 32 36 L 16 36 Q 14 36 14 34 Z"/>
  <!-- Lights (three lenses) -->
  <circle fill="#fff" opacity="0.9" cx="24" cy="11" r="3"/>
  <circle fill="#fff" opacity="0.9" cx="24" cy="20" r="3"/>
  <circle fill="#fff" opacity="0.9" cx="24" cy="29" r="3"/>
</svg>`;

const CONE = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <!-- Traffic cone: base, cone, reflective stripe. -->
  <path fill="currentColor" d="M6 40 L 42 40 L 42 44 L 6 44 Z"/>
  <path fill="currentColor" d="M20 8 L 28 8 L 38 40 L 10 40 Z"/>
  <path fill="#fff" opacity="0.75" d="M14 26 L 34 26 L 35 30 L 13 30 Z"/>
</svg>`;

// Header decoration strip: a row of tiny vehicles.
const VEHICLE_TRAIL = `<svg viewBox="0 0 200 12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <g fill="currentColor">
    <!-- car -->
    <g transform="translate(10 6)">
      <path d="M-8 2 L -6 -1 L -4 -2 L 4 -2 L 6 -1 L 8 2 L 8 3 L -8 3 Z"/>
      <circle cx="-5" cy="3.5" r="1"/><circle cx="5" cy="3.5" r="1"/>
    </g>
    <!-- plane -->
    <g transform="translate(50 6)">
      <path d="M-10 0 L 6 0 L 10 -1 L 10 1 L 6 1 L 2 3 L 0 1 L -10 1 Z"/>
      <path d="M4 -4 L 8 -4 L 10 0 L 4 0 Z"/>
    </g>
    <!-- bus -->
    <g transform="translate(92 6)">
      <path d="M-8 -3 L 8 -3 L 8 3 L -8 3 Z"/>
      <circle cx="-5" cy="3.5" r="1"/><circle cx="5" cy="3.5" r="1"/>
    </g>
    <!-- sailboat -->
    <g transform="translate(132 6)">
      <path d="M-7 3 L 7 3 L 5 5 L -5 5 Z"/>
      <path d="M-0.5 -5 L 0.5 -5 L 0.5 3 L -0.5 3 Z"/>
      <path d="M0.5 -4 L 5 3 L 0.5 3 Z"/>
    </g>
    <!-- train -->
    <g transform="translate(172 6)">
      <path d="M-10 -2 L 10 -2 L 10 3 L -10 3 Z"/>
      <path d="M-9 -4 L -6 -4 L -6 -2 L -9 -2 Z"/>
      <circle cx="-6" cy="3.5" r="1"/><circle cx="0" cy="3.5" r="1"/><circle cx="6" cy="3.5" r="1"/>
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
  vehicles: {
    palette: {
      ruleColor: "#8aa6c7",     // soft slate-blue
      primary: "#2b6fb4",       // strong blue for big vehicles
      accent: "#e2622e",         // warm orange for cones / fire trucks / accents
    },
    motifs: [
      { name: "car",           svg: CAR,           scale: 1.2, tint: "primary" },
      { name: "bus",           svg: BUS,           scale: 1.2, tint: "primary" },
      { name: "train",         svg: TRAIN,         scale: 1.3, tint: "primary" },
      { name: "airplane",      svg: AIRPLANE,      scale: 1.2, tint: "primary" },
      { name: "helicopter",    svg: HELICOPTER,    scale: 1.1, tint: "primary" },
      { name: "sailboat",      svg: SAILBOAT,      scale: 1.0, tint: "primary" },
      { name: "race-car",      svg: RACE_CAR,      scale: 1.0, tint: "accent" },
      { name: "fire-truck",    svg: FIRE_TRUCK,    scale: 1.0, tint: "accent" },
      { name: "truck",         svg: TRUCK,         scale: 0.9, tint: "primary" },
      { name: "traffic-light", svg: TRAFFIC_LIGHT, scale: 0.75, tint: "accent" },
      { name: "cone",          svg: CONE,          scale: 0.7, tint: "accent" },
    ],
    headerDecoration: VEHICLE_TRAIL,
  },
};
