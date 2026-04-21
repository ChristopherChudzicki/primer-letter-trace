import { test, expect } from "@playwright/test";
import type { SheetConfig } from "../../src/config/types";

// Six lines — gives a comparable visual to the previous "Aa Bb Cc" flat-mapped
// to six rows, but under the newline-per-line semantic.
const SAMPLE_CONTENT = "A\na\nB\nb\nC\nc";

function urlFor(partial: Partial<SheetConfig>): string {
  const params = new URLSearchParams();
  params.set("content", partial.content?.join("\n") ?? SAMPLE_CONTENT);
  params.set("demo", (partial.showDemo ?? true) ? "1" : "0");
  params.set("trace", String(partial.traceCount ?? 2));
  params.set("size", partial.size ?? "medium");
  params.set("theme", partial.theme ?? "none");
  params.set("paper", partial.paperSize ?? "letter");
  return `/?${params.toString()}`;
}

interface RowVariant {
  /** Short slug for the snapshot filename. */
  slug: string;
  showDemo: boolean;
  traceCount: SheetConfig["traceCount"];
}

// Representative row variants covering: default (demo + 2 trace), demo-only,
// trace-only. Extra traceCount levels (0, 3) are exercised by the unit test.
const rowVariants: RowVariant[] = [
  { slug: "demo-trace2", showDemo: true, traceCount: 2 },
  { slug: "demo-only", showDemo: true, traceCount: 0 },
  { slug: "trace1", showDemo: false, traceCount: 1 },
];
const themes: SheetConfig["theme"][] = ["none", "enchanted", "dinosaurs", "vehicles"];
const sizes: SheetConfig["size"][] = ["small", "medium", "large"];

for (const variant of rowVariants) {
  for (const theme of themes) {
    const name = `${variant.slug}-${theme}`;
    test(`renders ${name}`, async ({ page }) => {
      await page.goto(urlFor({
        showDemo: variant.showDemo, traceCount: variant.traceCount, theme,
      }));
      await page.waitForFunction(() => document.querySelectorAll(".sheet").length > 0);
      await page.waitForFunction(
        () => document.querySelector(".sheet svg.row path") !== null,
      );
      const preview = page.locator("#preview");
      await expect(preview).toHaveScreenshot(`${name}.png`);
    });
  }
}

for (const size of sizes) {
  test(`size sweep: ${size}`, async ({ page }) => {
    await page.goto(urlFor({ size }));
    await page.waitForFunction(() => document.querySelector(".sheet svg.row path") !== null);
    const preview = page.locator("#preview");
    await expect(preview).toHaveScreenshot(`size-${size}.png`);
  });
}
