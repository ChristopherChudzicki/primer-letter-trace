/**
 * Parse the content textarea into an array of lines.
 *
 * Each line becomes one item (one row in multi-layout, one page in single).
 * Rules:
 * - Split on newlines
 * - Trim each line individually (leading/trailing whitespace per line)
 * - Preserve all empty lines, including trailing ones (they become blank rows)
 * - Completely-empty input (nothing but whitespace/newlines) returns []
 */
export function parseContent(text: string): string[] {
  if (text.trim() === "") return [];
  return text.split("\n").map((s) => s.trim());
}
