export function parseContent(text: string): string[] {
  return text.trim().split(/\s+/).filter((s) => s.length > 0);
}

const UPPERCASE = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const LOWERCASE = Array.from("abcdefghijklmnopqrstuvwxyz");

export const PRESETS = {
  uppercase: UPPERCASE,
  lowercase: LOWERCASE,
  pairs: UPPERCASE.map((u, i) => u + LOWERCASE[i]),
  digits: Array.from("0123456789"),
} as const;

export type PresetKey = keyof typeof PRESETS;

export function presetToText(key: PresetKey): string {
  return PRESETS[key].join(" ");
}
