import { describe, test, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { extractAsset, FontAsset } from "../../src/rendering/font";
import { computeLines, CAP_HEIGHT_PX } from "../../src/rendering/ruled-lines";

let asset: FontAsset;
beforeAll(() => {
  const buf = readFileSync("public/andika.ttf");
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  asset = extractAsset(opentype.parse(ab));
});

describe("CAP_HEIGHT_PX presets", () => {
  test("small < medium < large", () => {
    expect(CAP_HEIGHT_PX.small).toBeLessThan(CAP_HEIGHT_PX.medium);
    expect(CAP_HEIGHT_PX.medium).toBeLessThan(CAP_HEIGHT_PX.large);
  });

  test("medium is 72px (0.75 inch at 96dpi)", () => {
    expect(CAP_HEIGHT_PX.medium).toBe(72);
  });
});

describe("computeLines", () => {
  test("headline at y=0, baseline at requested cap-height", () => {
    const geom = computeLines(asset, 72);
    expect(geom.headline).toBe(0);
    expect(geom.baseline).toBeCloseTo(72, 1);
  });

  test("midline sits between headline and baseline", () => {
    const geom = computeLines(asset, 72);
    expect(geom.midline).toBeGreaterThan(geom.headline);
    expect(geom.midline).toBeLessThan(geom.baseline);
  });

  test("descender line is below baseline", () => {
    const geom = computeLines(asset, 72);
    expect(geom.descenderLine).toBeGreaterThan(geom.baseline);
  });

  test("fontSizePx produces the requested rendered cap-height", () => {
    const geom = computeLines(asset, 72);
    const renderedCap = geom.fontSizePx * (asset.capHeight / asset.unitsPerEm);
    expect(renderedCap).toBeCloseTo(72, 1);
  });
});
