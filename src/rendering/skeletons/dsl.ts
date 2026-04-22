import type { GlyphSkeleton, Stroke } from "./types";

/** Compile a hand-authored DSL skeleton to the runtime SVG `d` string. */
export function dslToD(skeleton: GlyphSkeleton): string {
  return skeleton.strokes.map(strokeToD).join(" ");
}

function strokeToD(stroke: Stroke): string {
  if (stroke.segments.length === 0) {
    throw new Error("empty stroke (no segments)");
  }
  const parts: string[] = [`M ${num(stroke.start[0])} ${num(stroke.start[1])}`];
  for (const seg of stroke.segments) {
    if (seg.type === "line") {
      parts.push(`L ${num(seg.to[0])} ${num(seg.to[1])}`);
    } else {
      parts.push(
        `Q ${num(seg.control[0])} ${num(seg.control[1])} ${num(seg.to[0])} ${num(seg.to[1])}`,
      );
    }
  }
  return parts.join(" ");
}

/** Format a number for the d string. Currently identity — exists as a single
 *  point of change if we want to round/normalize later (e.g., to 1 decimal). */
function num(n: number): string {
  return `${n}`;
}
