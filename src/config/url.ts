import {
  SheetConfig, Layout, RowStyle, Size, Theme, PaperSize, DEFAULT_CONFIG,
} from "./types";
import { parseContent } from "./content";

const LAYOUTS: readonly Layout[] = ["single", "multi"] as const;
const ROW_STYLES: readonly RowStyle[] = ["combo", "all-trace", "demo-blank"] as const;
const SIZES: readonly Size[] = ["small", "medium", "large"] as const;
const THEMES: readonly Theme[] = ["none", "fairy", "unicorn", "princess"] as const;
const PAPER_SIZES: readonly PaperSize[] = ["letter", "a4"] as const;

function coerce<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function configFromURL(url: URL): SheetConfig {
  const p = url.searchParams;
  const parsed = parseContent(p.get("content") ?? "");
  return {
    content: parsed.length > 0 ? parsed : DEFAULT_CONFIG.content,
    layout: coerce(p.get("layout"), LAYOUTS, DEFAULT_CONFIG.layout),
    rowStyle: coerce(p.get("row"), ROW_STYLES, DEFAULT_CONFIG.rowStyle),
    size: coerce(p.get("size"), SIZES, DEFAULT_CONFIG.size),
    theme: coerce(p.get("theme"), THEMES, DEFAULT_CONFIG.theme),
    paperSize: coerce(p.get("paper"), PAPER_SIZES, DEFAULT_CONFIG.paperSize),
  };
}

export function configToURLParams(config: SheetConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("content", config.content.join(" "));
  p.set("layout", config.layout);
  p.set("row", config.rowStyle);
  p.set("size", config.size);
  p.set("theme", config.theme);
  p.set("paper", config.paperSize);
  return p;
}
