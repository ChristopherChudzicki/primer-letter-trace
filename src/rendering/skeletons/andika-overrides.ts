import type { SkeletonOverrides } from "./types";

/**
 * Per-glyph skeleton overrides. Each entry replaces the corresponding baseline
 * entry at module-load time (see ./andika.ts for the merge logic). Currently
 * empty — the algorithmic baseline is used for every glyph.
 */
const OVERRIDES: SkeletonOverrides = {};

export default OVERRIDES;
