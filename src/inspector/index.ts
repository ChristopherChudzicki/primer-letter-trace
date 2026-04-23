import type { FontAsset } from "../rendering/font";
import { CHARS } from "./chars";
import { renderGridView } from "./grid";
import { renderSingle } from "./single";

export interface InspectorOptions {
  target: string;
  root: HTMLElement;
  asset: FontAsset;
}

export function renderInspector(opts: InspectorOptions): void {
  if (opts.target === "*") {
    renderGridView(opts.root, opts.asset);
    return;
  }

  // Parse comma-separated list (trim whitespace from each entry).
  const parts = opts.target.split(",").map((s) => s.trim());

  if (parts.length === 1) {
    // Single-glyph mode. Target must be one of the in-scope chars.
    const char = parts[0]!;
    if (!CHARS.includes(char)) {
      opts.root.replaceChildren();
      const p = document.createElement("p");
      p.textContent = `inspect target "${char}" is not in the in-scope set (A-Z, a-z, 0-9)`;
      opts.root.appendChild(p);
      return;
    }
    renderSingle(opts.root, opts.asset, char);
    return;
  }

  // Multi-glyph mode: validate every entry.
  const invalid = parts.filter((c) => !CHARS.includes(c));
  if (invalid.length > 0) {
    opts.root.replaceChildren();
    const p = document.createElement("p");
    p.textContent = `inspect target "${opts.target}" is not in the in-scope set — invalid: ${invalid.join(", ")}`;
    opts.root.appendChild(p);
    return;
  }
  renderGridView(opts.root, opts.asset, parts);
}
