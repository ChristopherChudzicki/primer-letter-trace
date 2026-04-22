import { describe, it, expect } from "vitest";
import { dslToD } from "../../src/rendering/skeletons/dsl";
import type { GlyphSkeleton } from "../../src/rendering/skeletons/types";

describe("dslToD", () => {
  it("emits M+L for a single line stroke", () => {
    const g: GlyphSkeleton = {
      strokes: [{ start: [10, 20], segments: [{ type: "line", to: [30, 40] }] }],
    };
    expect(dslToD(g)).toBe("M 10 20 L 30 40");
  });

  it("emits M+L+L for a multi-segment stroke", () => {
    const g: GlyphSkeleton = {
      strokes: [
        {
          start: [0, 0],
          segments: [
            { type: "line", to: [10, 0] },
            { type: "line", to: [10, 10] },
          ],
        },
      ],
    };
    expect(dslToD(g)).toBe("M 0 0 L 10 0 L 10 10");
  });

  it("emits Q for quadratic Bezier segments", () => {
    const g: GlyphSkeleton = {
      strokes: [
        {
          start: [0, 0],
          segments: [{ type: "qcurve", control: [50, 100], to: [100, 0] }],
        },
      ],
    };
    expect(dslToD(g)).toBe("M 0 0 Q 50 100 100 0");
  });

  it("emits separate M for each stroke", () => {
    const g: GlyphSkeleton = {
      strokes: [
        { start: [0, 0], segments: [{ type: "line", to: [10, 10] }] },
        { start: [20, 20], segments: [{ type: "line", to: [30, 30] }] },
      ],
    };
    expect(dslToD(g)).toBe("M 0 0 L 10 10 M 20 20 L 30 30");
  });

  it("preserves fractional coordinates", () => {
    const g: GlyphSkeleton = {
      strokes: [{ start: [12.5, 33.7], segments: [{ type: "line", to: [99.1, 0] }] }],
    };
    expect(dslToD(g)).toBe("M 12.5 33.7 L 99.1 0");
  });

  it("throws on a stroke with no segments", () => {
    const g: GlyphSkeleton = {
      strokes: [{ start: [0, 0], segments: [] }],
    };
    expect(() => dslToD(g)).toThrow(/empty stroke/);
  });
});
