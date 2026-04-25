// Registry of fonts available in the inspector. The worksheet uses Andika
// exclusively; Comic Relief is inspector-only, for comparing algorithmic
// baseline quality between the two typefaces.
import ANDIKA_BASELINE from "../rendering/skeletons/andika-baseline";
import ANDIKA_OVERRIDES from "../rendering/skeletons/andika-overrides";
import COMIC_RELIEF_BASELINE from "../rendering/skeletons/comic-relief-baseline";
import COMIC_RELIEF_OVERRIDES from "../rendering/skeletons/comic-relief-overrides";
import type {
  SkeletonOverrides,
  SkeletonSet,
} from "../rendering/skeletons/types";

export interface FontRegistryEntry {
  label: string;
  /** TTF filename in `public/` (joined with BASE_URL at load time). */
  ttf: string;
  baseline: SkeletonSet;
  overrides: SkeletonOverrides;
}

export const FONT_REGISTRY = {
  andika: {
    label: "Andika",
    ttf: "andika.ttf",
    baseline: ANDIKA_BASELINE,
    overrides: ANDIKA_OVERRIDES,
  },
  "comic-relief": {
    label: "Comic Relief",
    ttf: "comic-relief.ttf",
    baseline: COMIC_RELIEF_BASELINE,
    overrides: COMIC_RELIEF_OVERRIDES,
  },
} as const satisfies Record<string, FontRegistryEntry>;

export type FontKey = keyof typeof FONT_REGISTRY;

export const DEFAULT_FONT: FontKey = "andika";

export function isFontKey(s: string): s is FontKey {
  return Object.prototype.hasOwnProperty.call(FONT_REGISTRY, s);
}

/** Build a URL query string for a given inspect target + font key. */
export function inspectHref(target: string, font: FontKey): string {
  const params = new URLSearchParams({ inspect: target });
  if (font !== DEFAULT_FONT) params.set("font", font);
  return `?${params.toString()}`;
}
