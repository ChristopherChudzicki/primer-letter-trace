import type { FontAsset } from "../rendering/font";
import { dslToD } from "../rendering/skeletons/dsl";
import { CHARS } from "./chars";
import { FONT_REGISTRY, inspectHref, type FontKey } from "./fonts";
import { renderGlyph } from "./render";
import { renderNav } from "./nav";

export function renderGridView(
  root: HTMLElement,
  asset: FontAsset,
  font: FontKey,
  chars: readonly string[] = CHARS,
): void {
  const { baseline, overrides } = FONT_REGISTRY[font];

  root.replaceChildren();
  root.appendChild(renderNav(null, font));

  const cols = Math.min(8, chars.length);

  const grid = document.createElement("div");
  grid.classList.add("inspector-grid-view");
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  root.appendChild(grid);

  for (const char of chars) {
    const cell = document.createElement("a");
    cell.href = inspectHref(char, font);
    cell.classList.add("inspector-cell");
    const hasOverride = overrides[char] !== undefined;
    if (hasOverride) cell.classList.add("inspector-cell-override");

    const skeleton = hasOverride
      ? dslToD(overrides[char]!)
      : (baseline.skeletons[char] ?? "");
    const dots = overrides[char]?.dots ?? baseline.dots[char] ?? [];

    // Scale dot radius down at small sizes so i/j tittles don't dominate
    // their cells (natural font-unit dot radius is sized for full-glyph render).
    cell.appendChild(renderGlyph({ char, asset, skeleton, dots, sizePx: 140, showGrid: false, dotScale: 0.4 }));

    const label = document.createElement("div");
    label.classList.add("inspector-cell-label");
    label.textContent = `${char}${hasOverride ? " ✱" : ""}`;
    cell.appendChild(label);

    grid.appendChild(cell);
  }
}
