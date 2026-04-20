import { describe, test, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { extractAsset, FontAsset } from "../../src/rendering/font";

let asset: FontAsset;

beforeAll(() => {
  const buf = readFileSync("public/andika.ttf");
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const font = opentype.parse(ab);
  asset = extractAsset(font);
});

describe("extractAsset", () => {
  test("exposes unitsPerEm", () => {
    expect(asset.unitsPerEm).toBeGreaterThan(0);
  });

  test("ascender >= capHeight", () => {
    expect(asset.ascender).toBeGreaterThanOrEqual(asset.capHeight);
  });

  test("xHeight < capHeight", () => {
    expect(asset.xHeight).toBeLessThan(asset.capHeight);
  });

  test("descender is positive (absolute value)", () => {
    expect(asset.descender).toBeGreaterThan(0);
  });

  test("capHeight is positive", () => {
    expect(asset.capHeight).toBeGreaterThan(0);
  });
});
