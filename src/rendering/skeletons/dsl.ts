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

/** Parse an SVG `d` string in the subset emitted by `dslToD` back into the DSL. */
export function dToDsl(d: string): GlyphSkeleton {
  const tokens = d.trim().split(/\s+/);
  if (tokens.length === 0 || tokens[0] !== "M") {
    throw new Error(`d string must start with M, got: ${d.slice(0, 20)}`);
  }

  const strokes: Stroke[] = [];
  let current: Stroke | null = null;
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i]!;
    if (cmd === "M") {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      if (current) strokes.push(current);
      current = { start: [x, y], segments: [] };
      i += 3;
    } else if (cmd === "L") {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      current!.segments.push({ type: "line", to: [x, y] });
      i += 3;
    } else if (cmd === "Q") {
      const cx = Number(tokens[i + 1]);
      const cy = Number(tokens[i + 2]);
      const x = Number(tokens[i + 3]);
      const y = Number(tokens[i + 4]);
      current!.segments.push({ type: "qcurve", control: [cx, cy], to: [x, y] });
      i += 5;
    } else {
      throw new Error(`unsupported command "${cmd}" in: ${d}`);
    }
  }
  if (current) strokes.push(current);
  return { strokes };
}
