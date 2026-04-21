// Generates public/og.png from the rendered app. Run `npm run dev` in one
// terminal, then `npm run generate:og` in another. The script opens the
// Aa-Zz one-per-row starter and clips the first ~3 rows of the sheet to a
// 1200×630 image (standard OG dimensions).
import { chromium, type ViewportSize } from "@playwright/test";
import { resolve } from "node:path";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const SHEET_PX_PER_IN = 96;

// Build the starter URL inline so the script doesn't depend on the build.
const content = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  .map((u) => `${u} ${u.toLowerCase()}`)
  .join("\n");

const params = new URLSearchParams({
  content,
  layout: "multi",
  demo: "1",
  trace: "2",
  size: "medium",
  theme: "none",
  paper: "letter",
});

const base = process.env.OG_BASE_URL ?? "http://localhost:5174/";
const url = `${base}?${params.toString()}`;

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    // Sheet content width in CSS px: 8.5in - 2×0.5in = 7.5in → but we'll
    // crop the full sheet width (includes margins) so the image feels like
    // a real page snippet. Then scale so the crop becomes exactly 1200 px.
    const sheetCssWidth = 8.5 * SHEET_PX_PER_IN; // 816
    const dpr = OG_WIDTH / sheetCssWidth;
    const cropHeightCss = OG_HEIGHT / dpr;

    const viewport: ViewportSize = { width: 1500, height: 1400 };
    const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
    const page = await context.newPage();

    await page.goto(url);
    await page.waitForFunction(() => document.querySelectorAll(".sheet").length > 0);
    await page.waitForFunction(
      () => document.querySelector(".sheet svg.row path") !== null,
    );

    const box = await page.locator(".sheet").first().boundingBox();
    if (!box) throw new Error("could not locate first .sheet element");

    const outPath = resolve("public/og.png");
    await page.screenshot({
      path: outPath,
      clip: {
        x: box.x,
        y: box.y,
        width: sheetCssWidth,
        height: cropHeightCss,
      },
    });

    console.log(`Wrote ${outPath} (${OG_WIDTH}×${OG_HEIGHT})`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
