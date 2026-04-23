import type { FontAsset } from "../rendering/font";

export interface InspectorOptions {
  /** The value of the `inspect` query param. "*" → grid mode; single char → single-glyph mode. */
  target: string;
  /** Where to render the inspector UI (replaces page contents). */
  root: HTMLElement;
  /** Loaded font for outline drawing. */
  asset: FontAsset;
}

export function renderInspector(opts: InspectorOptions): void {
  opts.root.replaceChildren();
  const p = document.createElement("p");
  p.textContent = `inspector stub: target=${opts.target}`;
  opts.root.appendChild(p);
}
