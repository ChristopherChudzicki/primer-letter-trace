export type Layout = "single" | "multi";
export type RowStyle = "combo" | "all-trace" | "demo-blank";
export type Size = "small" | "medium" | "large";
export type Theme = "none" | "enchanted";
// dinosaurs, vehicles planned as future themes — see AGENTS.md for how to add.
export type PaperSize = "letter" | "a4";

export interface SheetConfig {
  content: string[];
  layout: Layout;
  rowStyle: RowStyle;
  size: Size;
  theme: Theme;
  paperSize: PaperSize;
}

export const DEFAULT_CONFIG: SheetConfig = {
  content: ["A", "B", "C"],
  layout: "multi",
  rowStyle: "combo",
  size: "medium",
  theme: "none",
  paperSize: "letter",
};
