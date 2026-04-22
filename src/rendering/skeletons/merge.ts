import { dslToD } from "./dsl";
import type {
  SkeletonDot,
  SkeletonOverrides,
  SkeletonPath,
  SkeletonSet,
} from "./types";

/**
 * Merge hand-authored overrides into the baseline. Per glyph: if an override
 * exists, its compiled `d` string replaces the baseline skeleton; if the
 * override also specifies dots, they replace baseline dots; otherwise baseline
 * dots are preserved.
 */
export function mergeSkeletons(
  baseline: SkeletonSet,
  overrides: SkeletonOverrides,
): SkeletonSet {
  const skeletons: Record<string, SkeletonPath> = { ...baseline.skeletons };
  const dots: Record<string, SkeletonDot[]> = { ...baseline.dots };

  for (const [char, glyph] of Object.entries(overrides)) {
    skeletons[char] = dslToD(glyph);
    if (glyph.dots !== undefined) {
      dots[char] = glyph.dots;
    }
  }

  return { meta: baseline.meta, skeletons, dots };
}
