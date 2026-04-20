import type { FontAsset } from "../rendering/font";
import type { SheetConfig } from "../config/types";
import { buildSheets } from "../layout/sheet";

export function renderPreview(root: HTMLElement, asset: FontAsset, config: SheetConfig): void {
  root.replaceChildren(...buildSheets(asset, config));
}
