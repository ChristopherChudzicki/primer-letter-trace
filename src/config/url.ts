import {
  SheetConfig, Layout, Size, Theme, PaperSize, TraceCount, TRACE_COUNTS,
  DEFAULT_CONFIG,
} from "./types";
import { parseContent } from "./content";

const LAYOUTS: readonly Layout[] = ["single", "multi"] as const;
const SIZES: readonly Size[] = ["small", "medium", "large"] as const;
const THEMES: readonly Theme[] = ["none", "enchanted"] as const;
const PAPER_SIZES: readonly PaperSize[] = ["letter", "a4"] as const;

function coerce<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function coerceBool(value: string | null, fallback: boolean): boolean {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

function coerceTraceCount(value: string | null, fallback: TraceCount): TraceCount {
  const n = value === null ? NaN : Number(value);
  return (TRACE_COUNTS as readonly number[]).includes(n) ? (n as TraceCount) : fallback;
}

export function configFromURL(url: URL): SheetConfig {
  const p = url.searchParams;
  const parsed = parseContent(p.get("content") ?? "");
  return {
    content: parsed.length > 0 ? parsed : DEFAULT_CONFIG.content,
    layout: coerce(p.get("layout"), LAYOUTS, DEFAULT_CONFIG.layout),
    showDemo: coerceBool(p.get("demo"), DEFAULT_CONFIG.showDemo),
    traceCount: coerceTraceCount(p.get("trace"), DEFAULT_CONFIG.traceCount),
    size: coerce(p.get("size"), SIZES, DEFAULT_CONFIG.size),
    theme: coerce(p.get("theme"), THEMES, DEFAULT_CONFIG.theme),
    paperSize: coerce(p.get("paper"), PAPER_SIZES, DEFAULT_CONFIG.paperSize),
  };
}

export function configToURLParams(config: SheetConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("content", config.content.join("\n"));
  p.set("layout", config.layout);
  p.set("demo", config.showDemo ? "1" : "0");
  p.set("trace", String(config.traceCount));
  p.set("size", config.size);
  p.set("theme", config.theme);
  p.set("paper", config.paperSize);
  return p;
}
