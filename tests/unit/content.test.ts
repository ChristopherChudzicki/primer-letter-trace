import { describe, test, expect } from "vitest";
import { parseContent } from "../../src/config/content";
import { PRESETS, presetByKey } from "../../src/config/presets";

describe("parseContent", () => {
  test("splits newline-separated items", () => {
    expect(parseContent("A\nB\nC")).toEqual(["A", "B", "C"]);
  });

  test("keeps whole words on a single line intact", () => {
    expect(parseContent("CAT\nBAT")).toEqual(["CAT", "BAT"]);
  });

  test("trims whitespace within each line", () => {
    expect(parseContent("  A  \nB\n  C ")).toEqual(["A", "B", "C"]);
  });

  test("preserves internal empty lines as empty items", () => {
    expect(parseContent("CAT\n\nBAT")).toEqual(["CAT", "", "BAT"]);
  });

  test("preserves trailing empty lines", () => {
    expect(parseContent("CAT\n\nBAT\n")).toEqual(["CAT", "", "BAT", ""]);
    expect(parseContent("A\nB\n\n")).toEqual(["A", "B", "", ""]);
  });

  test("returns empty array for input with no non-whitespace content", () => {
    expect(parseContent("")).toEqual([]);
    expect(parseContent("\n\n\n")).toEqual([]);
    expect(parseContent("   \t  ")).toEqual([]);
  });
});

describe("starter presets", () => {
  test("every preset key is unique", () => {
    const keys = PRESETS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("presetByKey returns the matching preset", () => {
    const first = PRESETS[0]!;
    expect(presetByKey(first.key)).toBe(first);
  });

  test("presetByKey returns undefined for unknown keys", () => {
    expect(presetByKey("not-a-preset")).toBeUndefined();
  });

  test("Aa–Zz one-per-row covers the whole alphabet", () => {
    const preset = presetByKey("aa-zz-one-per-row")!;
    expect(preset.config.content).toHaveLength(26);
    expect(preset.config.content[0]).toBe("A a");
    expect(preset.config.content[25]).toBe("Z z");
  });
});
