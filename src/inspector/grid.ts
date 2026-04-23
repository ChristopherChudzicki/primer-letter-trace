import type { FontAsset } from "../rendering/font";
import ANDIKA_BASELINE from "../rendering/skeletons/andika-baseline";
import ANDIKA_OVERRIDES from "../rendering/skeletons/andika-overrides";
import { dslToD } from "../rendering/skeletons/dsl";
import { CHARS } from "./chars";
import { renderGlyph } from "./render";
import { renderNav } from "./nav";

export function renderGridView(root: HTMLElement, asset: FontAsset, chars: readonly string[] = CHARS): void {
  root.replaceChildren();
  root.appendChild(renderNav(null));

  const cols = Math.min(8, chars.length);

  const grid = document.createElement("div");
  grid.classList.add("inspector-grid-view");
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  root.appendChild(grid);

  for (const char of chars) {
    const cell = document.createElement("a");
    cell.href = `?inspect=${encodeURIComponent(char)}`;
    cell.classList.add("inspector-cell");
    const hasOverride = ANDIKA_OVERRIDES[char] !== undefined;
    if (hasOverride) cell.classList.add("inspector-cell-override");

    const skeleton = hasOverride
      ? dslToD(ANDIKA_OVERRIDES[char]!)
      : (ANDIKA_BASELINE.skeletons[char] ?? "");
    const dots = ANDIKA_OVERRIDES[char]?.dots ?? ANDIKA_BASELINE.dots[char] ?? [];

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
