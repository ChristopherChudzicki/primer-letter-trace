import { describe, test, expect } from "vitest";
import { parseContent, PRESETS, presetToText } from "../../src/config/content";

describe("parseContent", () => {
  test("splits single-space-separated items", () => {
    expect(parseContent("A B C")).toEqual(["A", "B", "C"]);
  });

  test("collapses runs of whitespace", () => {
    expect(parseContent("A  B\tC\n D")).toEqual(["A", "B", "C", "D"]);
  });

  test("trims leading and trailing whitespace", () => {
    expect(parseContent("  A B  ")).toEqual(["A", "B"]);
  });

  test("keeps multi-character items intact", () => {
    expect(parseContent("Aa Bb Cc")).toEqual(["Aa", "Bb", "Cc"]);
  });

  test("returns empty array for empty or whitespace-only input", () => {
    expect(parseContent("")).toEqual([]);
    expect(parseContent("   \t  ")).toEqual([]);
  });
});

describe("presets", () => {
  test("uppercase is A-Z", () => {
    expect(PRESETS.uppercase.join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });

  test("lowercase is a-z", () => {
    expect(PRESETS.lowercase.join("")).toBe("abcdefghijklmnopqrstuvwxyz");
  });

  test("pairs are Aa through Zz", () => {
    expect(PRESETS.pairs[0]).toBe("Aa");
    expect(PRESETS.pairs[25]).toBe("Zz");
    expect(PRESETS.pairs).toHaveLength(26);
  });

  test("digits are 0-9", () => {
    expect(PRESETS.digits).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  test("presetToText joins with single spaces", () => {
    expect(presetToText("digits")).toBe("0 1 2 3 4 5 6 7 8 9");
  });
});
