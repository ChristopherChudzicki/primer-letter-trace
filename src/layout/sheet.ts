import type { FontAsset } from "../rendering/font";
import type { SheetConfig, PaperSize } from "../config/types";
import { renderRow } from "./row";
import { computeLines, CAP_HEIGHT_PX } from "../rendering/ruled-lines";
import { THEMES, ThemeDef } from "../theming/themes";
import { placeMotifs } from "../theming/placement";

// CSS pixels per inch. Browsers treat `1in` as exactly 96 CSS px regardless of
// device pixel density, so anchoring all physical measurements on this
// constant keeps print output deterministic (8.5 × 96 = one actual inch on paper).
const PX_PER_IN = 96;

const PAPER_DIMENSIONS: Record<PaperSize, { widthPx: number; heightPx: number }> = {
  letter: { widthPx: 8.5 * PX_PER_IN, heightPx: 11 * PX_PER_IN },
  a4: { widthPx: (210 / 25.4) * PX_PER_IN, heightPx: (297 / 25.4) * PX_PER_IN },
};
const MARGIN_PX = 0.5 * PX_PER_IN;
// 1/8in between rows — tight but still leaves room for ascenders and
// descenders without the next row's headline intruding.
const ROW_SPACING_PX = PX_PER_IN / 8;

export function buildSheets(asset: FontAsset, config: SheetConfig): HTMLElement[] {
  const theme = THEMES[config.theme];
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const printableWidth = paper.widthPx - 2 * MARGIN_PX;
  const printableHeight = paper.heightPx - 2 * MARGIN_PX;

  if (config.content.length === 0) return [];

  const rowHeight = singleRowHeight(asset, config.size);
  const rowStride = rowHeight + ROW_SPACING_PX;
  const rowsPerPage = Math.max(1, Math.floor(printableHeight / rowStride));

  const pages: HTMLElement[] = [];
  let pageIndex = 0;
  for (let i = 0; i < config.content.length; i += rowsPerPage) {
    const chunk = config.content.slice(i, i + rowsPerPage);
    const page = createPage(config.paperSize);
    const content = pageContentArea(page);
    for (const line of chunk) {
      const row = renderRow({
        asset, line, showDemo: config.showDemo, traceCount: config.traceCount,
        size: config.size, widthPx: printableWidth,
        ruleColor: theme.palette.ruleColor,
      });
      row.style.marginBottom = `${ROW_SPACING_PX}px`;
      content.appendChild(row);
    }
    applyThemeChrome(page, theme, config, pageIndex);
    pages.push(page);
    pageIndex++;
  }
  return pages;
}

function singleRowHeight(asset: FontAsset, size: SheetConfig["size"]): number {
  const geom = computeLines(asset, CAP_HEIGHT_PX[size]);
  return geom.descenderLine;
}

function createPage(paperSize: PaperSize): HTMLElement {
  const paper = PAPER_DIMENSIONS[paperSize];
  const page = document.createElement("section");
  page.classList.add("sheet");
  page.dataset.paper = paperSize;
  page.style.width = `${paper.widthPx}px`;
  page.style.height = `${paper.heightPx}px`;
  return page;
}

function pageContentArea(page: HTMLElement): HTMLElement {
  const content = document.createElement("div");
  content.classList.add("sheet__content");
  content.style.position = "absolute";
  content.style.top = `${MARGIN_PX}px`;
  content.style.left = `${MARGIN_PX}px`;
  content.style.right = `${MARGIN_PX}px`;
  content.style.bottom = `${MARGIN_PX}px`;
  page.appendChild(content);
  return content;
}

function applyThemeChrome(
  page: HTMLElement,
  theme: ThemeDef,
  config: SheetConfig,
  pageIndex: number,
): void {
  if (theme.motifs.length === 0) return;
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const placements = placeMotifs({
    theme,
    pageWidthPx: paper.widthPx,
    pageHeightPx: paper.heightPx,
    marginPx: MARGIN_PX,
    letterSize: config.size,
    seedKey: seedKeyFor(config),
    pageIndex,
  });
  for (const p of placements) {
    const el = document.createElement("div");
    el.classList.add("sheet__motif");
    el.style.position = "absolute";
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    el.style.width = `${p.size}px`;
    el.style.height = `${p.size}px`;
    el.style.color = p.color;
    el.style.transform = `rotate(${p.rotation}deg)`;
    el.style.transformOrigin = "center";
    el.innerHTML = p.svg;
    page.appendChild(el);
  }
}

/** Content + theme form a stable seed so the same sheet always looks the same. */
function seedKeyFor(config: SheetConfig): string {
  return `${config.theme}|${config.content.join("\u2028")}`;
}
