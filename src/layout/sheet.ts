import type { FontAsset } from "../rendering/font";
import type { SheetConfig, PaperSize } from "../config/types";
import { renderRow } from "./row";
import { computeLines, CAP_HEIGHT_PX } from "../rendering/ruled-lines";
import { glyphPath } from "../rendering/glyph";
import { THEMES, ThemeDef } from "../theming/themes";
import { placeMotifs } from "../theming/placement";

const PAPER_DIMENSIONS: Record<PaperSize, { widthPx: number; heightPx: number }> = {
  letter: { widthPx: 8.5 * 96, heightPx: 11 * 96 },
  a4: { widthPx: (210 / 25.4) * 96, heightPx: (297 / 25.4) * 96 },
};
const MARGIN_PX = 0.5 * 96;
const ROW_SPACING_PX = 0.25 * 96;
// Cap-height for the large word shown at the top of each single-item page.
const HEADER_CAP_PX = 80;

const SVG_NS = "http://www.w3.org/2000/svg";

export function buildSheets(asset: FontAsset, config: SheetConfig): HTMLElement[] {
  const theme = THEMES[config.theme];
  const paper = PAPER_DIMENSIONS[config.paperSize];
  const printableWidth = paper.widthPx - 2 * MARGIN_PX;
  const printableHeight = paper.heightPx - 2 * MARGIN_PX;

  if (config.content.length === 0) return [];

  if (config.layout === "multi") {
    return buildMultiLayout(asset, config, theme, config.content, printableWidth, printableHeight);
  }
  return buildSingleLayout(asset, config, theme, printableWidth, printableHeight);
}

function buildMultiLayout(
  asset: FontAsset,
  config: SheetConfig,
  theme: ThemeDef,
  lines: readonly string[],
  printableWidth: number,
  printableHeight: number,
): HTMLElement[] {
  const rowHeight = singleRowHeight(asset, config.size);
  const rowStride = rowHeight + ROW_SPACING_PX;
  const rowsPerPage = Math.max(1, Math.floor(printableHeight / rowStride));

  const pages: HTMLElement[] = [];
  let pageIndex = 0;
  for (let i = 0; i < lines.length; i += rowsPerPage) {
    const chunk = lines.slice(i, i + rowsPerPage);
    const page = createPage(config.paperSize);
    const content = pageContentArea(page);
    for (const line of chunk) {
      const row = renderRow({
        asset, line, rowStyle: config.rowStyle, size: config.size,
        widthPx: printableWidth, ruleColor: theme.palette.ruleColor,
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

function buildSingleLayout(
  asset: FontAsset,
  config: SheetConfig,
  theme: ThemeDef,
  printableWidth: number,
  printableHeight: number,
): HTMLElement[] {
  const rowHeight = singleRowHeight(asset, config.size);
  const rowStride = rowHeight + ROW_SPACING_PX;
  // Base header height (just the big word). Decoration strip adds 14px when
  // the theme specifies one; accounted for below to not drop a row count.
  const baseHeaderHeight = computeLines(asset, HEADER_CAP_PX).descenderLine;
  const decoHeight = theme.headerDecoration ? 14 : 0;
  const rowsPerPage = Math.max(
    1,
    Math.floor((printableHeight - baseHeaderHeight - decoHeight - ROW_SPACING_PX) / rowStride),
  );

  const pages: HTMLElement[] = [];
  let pageIndex = 0;
  for (const line of config.content) {
    // Single-layout treats each non-empty line as its own page. Blank lines
    // are meaningful as row separators in multi-layout, but as pages they'd
    // be empty pages — skip them.
    if (line === "") continue;
    const page = createPage(config.paperSize);
    const content = pageContentArea(page);

    const { element: headerEl } = renderHeader(asset, line, printableWidth, theme);
    headerEl.style.marginBottom = `${ROW_SPACING_PX}px`;
    content.appendChild(headerEl);

    for (let r = 0; r < rowsPerPage; r++) {
      const row = renderRow({
        asset, line, rowStyle: config.rowStyle, size: config.size,
        widthPx: printableWidth, ruleColor: theme.palette.ruleColor,
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

function renderHeader(
  asset: FontAsset,
  item: string,
  widthPx: number,
  theme: ThemeDef,
): { element: HTMLElement; height: number } {
  // computeLines gives us ascender room above and descender room below, so
  // letters with ascenders (b, d, f, h) or descenders (g, j, p, q, y) aren't clipped.
  const geom = computeLines(asset, HEADER_CAP_PX);
  const wrapper = document.createElement("div");
  wrapper.classList.add("header-wrap");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${widthPx} ${geom.descenderLine}`);
  svg.setAttribute("width", `${widthPx}`);
  svg.setAttribute("height", `${geom.descenderLine}`);
  svg.classList.add("header");

  const widths = Array.from(item).map((c) => glyphPath(asset, c, geom.fontSizePx).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  let cursorX = (widthPx - totalWidth) / 2;

  Array.from(item).forEach((c, idx) => {
    const g = glyphPath(asset, c, geom.fontSizePx, cursorX, geom.baseline);
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", g.pathD);
    p.setAttribute("fill", "currentColor");
    svg.appendChild(p);
    cursorX += widths[idx] ?? 0;
  });
  wrapper.appendChild(svg);

  let totalHeight = geom.descenderLine;
  if (theme.headerDecoration) {
    const deco = document.createElement("div");
    deco.classList.add("header-deco");
    deco.style.width = `${widthPx}px`;
    deco.style.height = "14px";
    deco.style.color = theme.palette.accent;
    deco.innerHTML = theme.headerDecoration;
    wrapper.appendChild(deco);
    totalHeight += 14;
  }

  return { element: wrapper, height: totalHeight };
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
