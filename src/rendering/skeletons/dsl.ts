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

/** Parse a coordinate token, throwing if missing or non-numeric. */
function parseCoord(tokens: string[], idx: number, cmd: string): number {
  const tok = tokens[idx];
  if (tok === undefined) {
    throw new Error(`d string ended mid-${cmd} command (missing coordinate at token ${idx})`);
  }
  const n = Number(tok);
  if (!Number.isFinite(n)) {
    throw new Error(`d string has non-numeric coordinate "${tok}" in ${cmd} command at token ${idx}`);
  }
  return n;
}

/** Parse an SVG `d` string in the subset emitted by `dslToD` back into the DSL. */
export function dToDsl(d: string): GlyphSkeleton {
  const tokens = d.trim().split(/\s+/);
  if (tokens.length === 0 || tokens[0] !== "M") {
    throw new Error(`d string must start with M, got: ${d.slice(0, 20)}`);
  }

  const strokes: Stroke[] = [];
  // Non-null after the first iteration: the start-with-M check above guarantees
  // the first token is M, which assigns `current` before any L/Q is processed.
  let current: Stroke | null = null;
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i]!;
    if (cmd === "M") {
      const x = parseCoord(tokens, i + 1, cmd);
      const y = parseCoord(tokens, i + 2, cmd);
      if (current) strokes.push(current);
      current = { start: [x, y], segments: [] };
      i += 3;
    } else if (cmd === "L") {
      const x = parseCoord(tokens, i + 1, cmd);
      const y = parseCoord(tokens, i + 2, cmd);
      current!.segments.push({ type: "line", to: [x, y] });
      i += 3;
    } else if (cmd === "Q") {
      const cx = parseCoord(tokens, i + 1, cmd);
      const cy = parseCoord(tokens, i + 2, cmd);
      const x = parseCoord(tokens, i + 3, cmd);
      const y = parseCoord(tokens, i + 4, cmd);
      current!.segments.push({ type: "qcurve", control: [cx, cy], to: [x, y] });
      i += 5;
    } else {
      throw new Error(`unsupported command "${cmd}" in: ${d}`);
    }
  }
  if (current) strokes.push(current);
  return { strokes };
}
