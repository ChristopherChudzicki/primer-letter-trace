import { describe, it, expect } from "vitest";
import { dslToD, dToDsl } from "../../src/rendering/skeletons/dsl";
import type { GlyphSkeleton } from "../../src/rendering/skeletons/types";
import ANDIKA_BASELINE from "../../src/rendering/skeletons/andika";

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

  it("emits mixed L and Q segments in one stroke", () => {
    const g: GlyphSkeleton = {
      strokes: [{
        start: [0, 0],
        segments: [
          { type: "line", to: [50, 0] },
          { type: "qcurve", control: [100, 0], to: [100, 50] },
        ],
      }],
    };
    expect(dslToD(g)).toBe("M 0 0 L 50 0 Q 100 0 100 50");
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

  it("returns an empty string for an empty strokes array", () => {
    expect(dslToD({ strokes: [] })).toBe("");
  });
});

describe("dToDsl", () => {
  it("parses a simple M+L sequence", () => {
    expect(dToDsl("M 10 20 L 30 40")).toEqual({
      strokes: [
        { start: [10, 20], segments: [{ type: "line", to: [30, 40] }] },
      ],
    });
  });

  it("parses M+L+L into one stroke with two line segments", () => {
    expect(dToDsl("M 0 0 L 10 0 L 10 10")).toEqual({
      strokes: [
        {
          start: [0, 0],
          segments: [
            { type: "line", to: [10, 0] },
            { type: "line", to: [10, 10] },
          ],
        },
      ],
    });
  });

  it("parses Q into a qcurve segment", () => {
    expect(dToDsl("M 0 0 Q 50 100 100 0")).toEqual({
      strokes: [
        {
          start: [0, 0],
          segments: [{ type: "qcurve", control: [50, 100], to: [100, 0] }],
        },
      ],
    });
  });

  it("splits multiple strokes on M", () => {
    expect(dToDsl("M 0 0 L 10 10 M 20 20 L 30 30")).toEqual({
      strokes: [
        { start: [0, 0], segments: [{ type: "line", to: [10, 10] }] },
        { start: [20, 20], segments: [{ type: "line", to: [30, 30] }] },
      ],
    });
  });

  it("throws on input that doesn't start with M", () => {
    expect(() => dToDsl("L 10 10")).toThrow(/must start with M/);
  });

  it("throws when a coordinate token is missing", () => {
    expect(() => dToDsl("M 10 20 L 30")).toThrow(/missing coordinate/);
  });

  it("throws when a coordinate token is non-numeric", () => {
    expect(() => dToDsl("M 10 20 L abc 40")).toThrow(/non-numeric coordinate "abc"/);
  });

  it("throws on an unsupported command", () => {
    expect(() => dToDsl("M 10 20 C 30 40 50 60 70 80")).toThrow(/unsupported command "C"/);
  });
});

describe("dslToD ↔ dToDsl round-trip on baseline data", () => {
  it("round-trips every baseline glyph byte-identically", () => {
    for (const [char, d] of Object.entries(ANDIKA_BASELINE.skeletons)) {
      const dsl = dToDsl(d);
      const round = dslToD(dsl);
      expect(round, `round-trip mismatch for "${char}"`).toBe(d);
    }
  });
});
