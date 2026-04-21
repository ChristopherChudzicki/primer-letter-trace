import type { SheetConfig } from "./types";

/**
 * Named "starter" configurations — pick one to load a full SheetConfig,
 * then tweak individual controls if needed. Presets are not a persistent
 * state; after loading, the form shows whatever the user changes and the
 * dropdown stays pinned to the last chosen starter (or "" for custom).
 */
export interface Preset {
  key: string;
  label: string;
  config: SheetConfig;
}

const UPPERCASE = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const LOWERCASE = Array.from("abcdefghijklmnopqrstuvwxyz");

// 6 rows of 6 items — A–Z plus digits 0–9, fits one page at "large" tracing.
const AZ_SINGLE_PAGE: string[] = [
  "A B C D E F",
  "G H I J K L",
  "M N O P Q R",
  "S T U V W X",
  "Y Z 0 1 2 3",
  "4 5 6 7 8 9",
];

// 7 rows, Aa–Zz split into groups of 4 pairs per row (last row has 1 pair).
const AA_ZZ_SINGLE_PAGE: string[] = [
  "A a B b C c D d",
  "E e F f G g H h",
  "I i J j K k L l",
  "M m N n O o P p",
  "Q q R r S s T t",
  "U u V v W w X x",
  "Y y Z z",
];

// 26 rows — one letter pair per row. Spans multiple pages.
const AA_ZZ_ONE_PER_ROW: string[] = UPPERCASE.map(
  (u, i) => `${u} ${LOWERCASE[i]}`,
);

export const PRESETS: readonly Preset[] = [
  {
    key: "az-tracing-single",
    label: "A–Z tracing (single page)",
    config: {
      content: AZ_SINGLE_PAGE,
      layout: "multi",
      showDemo: false,
      traceCount: 1,
      size: "large",
      theme: "vehicles",
      paperSize: "letter",
    },
  },
  {
    key: "aa-zz-tracing-single",
    label: "Aa–Zz tracing (single page)",
    config: {
      content: AA_ZZ_SINGLE_PAGE,
      layout: "multi",
      showDemo: false,
      traceCount: 1,
      size: "medium",
      theme: "vehicles",
      paperSize: "letter",
    },
  },
  {
    key: "aa-zz-one-per-row",
    label: "Aa–Zz (one pair per row)",
    config: {
      content: AA_ZZ_ONE_PER_ROW,
      layout: "multi",
      showDemo: true,
      traceCount: 2,
      size: "medium",
      theme: "none",
      paperSize: "letter",
    },
  },
];

export function presetByKey(key: string): Preset | undefined {
  return PRESETS.find((p) => p.key === key);
}
