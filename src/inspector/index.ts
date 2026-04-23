import type { FontAsset } from "../rendering/font";
import { renderSingle } from "./single";

export interface InspectorOptions {
  target: string;
  root: HTMLElement;
  asset: FontAsset;
}

export function renderInspector(opts: InspectorOptions): void {
  if (opts.target === "*") {
    opts.root.replaceChildren();
    const p = document.createElement("p");
    p.textContent = "grid mode coming in next task";
    opts.root.appendChild(p);
    return;
  }
  // Single-glyph mode. Treat the target as a single character.
  const char = opts.target;
  if (char.length !== 1) {
    opts.root.replaceChildren();
    const p = document.createElement("p");
    p.textContent = `invalid inspect target: ${char}`;
    opts.root.appendChild(p);
    return;
  }
  renderSingle(opts.root, opts.asset, char);
}
