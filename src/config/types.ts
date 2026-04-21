export type Size = "small" | "medium" | "large";
export type Theme = "none" | "enchanted" | "dinosaurs" | "vehicles";
export type PaperSize = "letter" | "a4";
/** Number of dashed trace copies rendered per row, after the optional demo. */
export type TraceCount = 0 | 1 | 2 | 3;
export const TRACE_COUNTS: readonly TraceCount[] = [0, 1, 2, 3] as const;

export interface SheetConfig {
  content: string[];
  /** If true, a solid demo glyph is rendered at the start of each row. */
  showDemo: boolean;
  traceCount: TraceCount;
  size: Size;
  theme: Theme;
  paperSize: PaperSize;
}

export const DEFAULT_CONFIG: SheetConfig = {
  content: ["A", "B", "C"],
  showDemo: true,
  traceCount: 2,
  size: "medium",
  theme: "none",
  paperSize: "letter",
};
