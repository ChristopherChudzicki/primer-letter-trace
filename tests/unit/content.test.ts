import { describe, test, expect } from "vitest";
import { parseContent, PRESETS, presetToText } from "../../src/config/content";

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

describe("presets", () => {
  test("uppercase is A-Z", () => {
    expect(PRESETS.uppercase.join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });

  test("lowercase is a-z", () => {
    expect(PRESETS.lowercase.join("")).toBe("abcdefghijklmnopqrstuvwxyz");
  });

  test("pairs alternate uppercase and lowercase one per item", () => {
    expect(PRESETS.pairs.slice(0, 4)).toEqual(["A", "a", "B", "b"]);
    expect(PRESETS.pairs).toHaveLength(52);
  });

  test("digits are 0-9", () => {
    expect(PRESETS.digits).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  test("presetToText joins with newlines", () => {
    expect(presetToText("digits")).toBe("0\n1\n2\n3\n4\n5\n6\n7\n8\n9");
  });
});
