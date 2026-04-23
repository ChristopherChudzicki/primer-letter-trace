import type { FontAsset } from "../rendering/font";
import { CHARS } from "./chars";
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
  // Single-glyph mode. Target must be one of the in-scope chars.
  const char = opts.target;
  if (!CHARS.includes(char)) {
    opts.root.replaceChildren();
    const p = document.createElement("p");
    p.textContent = `inspect target "${char}" is not in the in-scope set (A-Z, a-z, 0-9)`;
    opts.root.appendChild(p);
    return;
  }
  renderSingle(opts.root, opts.asset, char);
}
