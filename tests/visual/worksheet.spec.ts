import { test, expect } from "@playwright/test";
import type { SheetConfig } from "../../src/config/types";

const SAMPLE_CONTENT = "Aa Bb Cc";

function urlFor(partial: Partial<SheetConfig>): string {
  const params = new URLSearchParams();
  params.set("content", partial.content?.join(" ") ?? SAMPLE_CONTENT);
  params.set("layout", partial.layout ?? "multi");
  params.set("row", partial.rowStyle ?? "combo");
  params.set("size", partial.size ?? "medium");
  params.set("theme", partial.theme ?? "none");
  params.set("paper", partial.paperSize ?? "letter");
  return `/?${params.toString()}`;
}

const layouts: SheetConfig["layout"][] = ["multi", "single"];
const rowStyles: SheetConfig["rowStyle"][] = ["combo", "all-trace", "demo-blank"];
const themes: SheetConfig["theme"][] = ["none", "fairy", "unicorn", "princess"];
const sizes: SheetConfig["size"][] = ["small", "medium", "large"];

for (const layout of layouts) {
  for (const rowStyle of rowStyles) {
    for (const theme of themes) {
      const name = `${layout}-${rowStyle}-${theme}`;
      test(`renders ${name}`, async ({ page }) => {
        await page.goto(urlFor({ layout, rowStyle, theme }));
        await page.waitForFunction(() => document.querySelectorAll(".sheet").length > 0);
        await page.waitForFunction(
          () => document.querySelector(".sheet svg.row path, .sheet svg.header path") !== null,
        );
        const preview = page.locator("#preview");
        await expect(preview).toHaveScreenshot(`${name}.png`);
      });
    }
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
