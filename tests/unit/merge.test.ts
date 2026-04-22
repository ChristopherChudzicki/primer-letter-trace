import { describe, it, expect } from "vitest";
import { mergeSkeletons } from "../../src/rendering/skeletons/merge";
import type { SkeletonSet, SkeletonOverrides } from "../../src/rendering/skeletons/types";

const baseline: SkeletonSet = {
  meta: {
    sourceFont: "test.ttf",
    unitsPerEm: 1000,
    capHeight: 700,
    xHeight: 500,
    ascender: 800,
    descender: -200,
    generatedAt: "2026-04-22T00:00:00Z",
  },
  skeletons: {
    A: "M 0 0 L 100 100",
    B: "M 0 0 L 50 50",
    i: "M 10 10 L 10 200",
  },
  dots: {
    i: [{ cx: 10, cy: 250, r: 5 }],
  },
};

describe("mergeSkeletons", () => {
  it("returns the baseline unchanged when overrides is empty", () => {
    const merged = mergeSkeletons(baseline, {});
    expect(merged.skeletons).toEqual(baseline.skeletons);
    expect(merged.dots).toEqual(baseline.dots);
    expect(merged.meta).toBe(baseline.meta);
  });

  it("replaces a baseline skeleton when an override is present", () => {
    const overrides: SkeletonOverrides = {
      A: { strokes: [{ start: [0, 0], segments: [{ type: "line", to: [200, 200] }] }] },
    };
    const merged = mergeSkeletons(baseline, overrides);
    expect(merged.skeletons.A).toBe("M 0 0 L 200 200");
    expect(merged.skeletons.B).toBe("M 0 0 L 50 50"); // untouched
  });

  it("preserves baseline dots when an override doesn't specify them", () => {
    const overrides: SkeletonOverrides = {
      i: { strokes: [{ start: [10, 10], segments: [{ type: "line", to: [10, 200] }] }] },
    };
    const merged = mergeSkeletons(baseline, overrides);
    expect(merged.dots.i).toEqual(baseline.dots.i);
  });

  it("replaces baseline dots when an override specifies them", () => {
    const overrides: SkeletonOverrides = {
      i: {
        strokes: [{ start: [10, 10], segments: [{ type: "line", to: [10, 200] }] }],
        dots: [{ cx: 10, cy: 300, r: 8 }],
      },
    };
    const merged = mergeSkeletons(baseline, overrides);
    expect(merged.dots.i).toEqual([{ cx: 10, cy: 300, r: 8 }]);
  });

  it("adds an override-only glyph that has no baseline entry", () => {
    const overrides: SkeletonOverrides = {
      Z: { strokes: [{ start: [0, 0], segments: [{ type: "line", to: [50, 50] }] }] },
    };
    const merged = mergeSkeletons(baseline, overrides);
    expect(merged.skeletons.Z).toBe("M 0 0 L 50 50");
    // baseline glyphs still present
    expect(merged.skeletons.A).toBe("M 0 0 L 100 100");
  });

  it("clears baseline dots when override specifies dots: []", () => {
    const overrides: SkeletonOverrides = {
      i: {
        strokes: [{ start: [10, 10], segments: [{ type: "line", to: [10, 200] }] }],
        dots: [],
      },
    };
    const merged = mergeSkeletons(baseline, overrides);
    expect(merged.dots.i).toEqual([]);
  });
});
