import { describe, test, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { extractAsset, FontAsset } from "../../src/rendering/font";
import { glyphPath } from "../../src/rendering/glyph";

let asset: FontAsset;

beforeAll(() => {
  const buf = readFileSync("public/andika.ttf");
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  asset = extractAsset(opentype.parse(ab));
});

describe("glyphPath", () => {
  test("returns a non-empty SVG path for a capital letter", () => {
    const g = glyphPath(asset, "A", 100);
    expect(g.pathD.length).toBeGreaterThan(0);
    expect(g.pathD).toMatch(/^[MmLlCcZz]/);
  });

  test("returns a positive advance width", () => {
    const g = glyphPath(asset, "A", 100);
    expect(g.width).toBeGreaterThan(0);
  });

  test("covers A-Z, a-z, 0-9", () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
    for (const c of chars) {
      const g = glyphPath(asset, c, 100);
      expect(g.pathD.length, `missing glyph for ${c}`).toBeGreaterThan(0);
    }
  });

  test("scales with sizePx", () => {
    const small = glyphPath(asset, "A", 50);
    const large = glyphPath(asset, "A", 100);
    expect(large.width).toBeCloseTo(small.width * 2, 0);
  });
});
