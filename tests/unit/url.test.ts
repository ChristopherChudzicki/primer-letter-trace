import { describe, test, expect } from "vitest";
import { configFromURL, configToURLParams } from "../../src/config/url";
import { DEFAULT_CONFIG, SheetConfig } from "../../src/config/types";

describe("configFromURL", () => {
  test("returns defaults for a bare URL", () => {
    expect(configFromURL(new URL("http://x/"))).toEqual(DEFAULT_CONFIG);
  });

  test("parses all fields from query string (newline-separated content)", () => {
    // Content encoded with newlines — URLSearchParams uses %0A for '\n'.
    const url = new URL(
      "http://x/?content=A%0AB%0AC&layout=single&demo=0&trace=1&size=large&theme=enchanted&paper=a4",
    );
    expect(configFromURL(url)).toEqual({
      content: ["A", "B", "C"],
      layout: "single",
      showDemo: false,
      traceCount: 1,
      size: "large",
      theme: "enchanted",
      paperSize: "a4",
    });
  });

  test("rejects out-of-range traceCount, falls back to default", () => {
    const url = new URL("http://x/?trace=5");
    expect(configFromURL(url).traceCount).toBe(DEFAULT_CONFIG.traceCount);
  });

  test("ignores invalid enum values and uses defaults", () => {
    const url = new URL("http://x/?layout=banana&size=enormous");
    const config = configFromURL(url);
    expect(config.layout).toBe(DEFAULT_CONFIG.layout);
    expect(config.size).toBe(DEFAULT_CONFIG.size);
  });

  test("empty content falls back to default", () => {
    const url = new URL("http://x/?content=");
    expect(configFromURL(url).content).toEqual(DEFAULT_CONFIG.content);
  });
});

describe("configToURLParams", () => {
  test("round-trips a non-default config", () => {
    const original: SheetConfig = {
      content: ["CAT", "", "BAT"],
      layout: "single",
      showDemo: true,
      traceCount: 0,
      size: "large",
      theme: "enchanted",
      paperSize: "a4",
    };
    const params = configToURLParams(original);
    const url = new URL("http://x/?" + params.toString());
    expect(configFromURL(url)).toEqual(original);
  });

  test("round-trips the default config", () => {
    const params = configToURLParams(DEFAULT_CONFIG);
    const url = new URL("http://x/?" + params.toString());
    expect(configFromURL(url)).toEqual(DEFAULT_CONFIG);
  });
});
