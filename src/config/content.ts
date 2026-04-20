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

const UPPERCASE = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const LOWERCASE = Array.from("abcdefghijklmnopqrstuvwxyz");

export const PRESETS = {
  uppercase: UPPERCASE,
  lowercase: LOWERCASE,
  // Pairs preset: uppercase immediately followed by its lowercase, each on
  // its own line — ["A","a","B","b",...,"Z","z"].
  pairs: UPPERCASE.flatMap((u, i) => [u, LOWERCASE[i] ?? ""]),
  digits: Array.from("0123456789"),
} as const;

export type PresetKey = keyof typeof PRESETS;

export function presetToText(key: PresetKey): string {
  return PRESETS[key].join("\n");
}
