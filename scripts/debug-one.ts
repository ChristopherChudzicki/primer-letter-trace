// Render a single letter large, with filled glyph + skeleton overlay.
import { readFileSync, writeFileSync } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";
import opentype from "opentype.js";
import SET from "../src/rendering/skeletons/andika.ts";

const CHAR = process.argv[2] ?? "A";

const buf = readFileSync("public/andika.ttf");
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const font = opentype.parse(ab);

const size = 600;
const fontSize = 420;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, size, size);

const baselineY = size * 0.8;
const scale = fontSize / font.unitsPerEm;
const glyph = font.charToGlyph(CHAR);
const advance = (glyph.advanceWidth ?? font.unitsPerEm * 0.5) * scale;
const originX = (size - advance) / 2;

// Reference guides
ctx.strokeStyle = "#fcd";
ctx.beginPath();
ctx.moveTo(0, baselineY);
ctx.lineTo(size, baselineY);
ctx.stroke();

// Filled glyph, very pale
const gp = font.getPath(CHAR, originX, baselineY, fontSize);
gp.fill = "rgba(0,0,0,0.10)";
gp.stroke = null;
gp.draw(ctx as unknown as CanvasRenderingContext2D);

// Skeleton
const skel = SET.skeletons[CHAR];
if (!skel) {
  console.log("No skeleton for", CHAR);
  process.exit(1);
}
ctx.strokeStyle = "#d30";
ctx.lineWidth = 4;
ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.beginPath();
let strokes = 0;
for (const match of skel.matchAll(/([ML])\s*([-\d.]+)\s+([-\d.]+)/g)) {
  const cmd = match[1]!;
  const x = Number(match[2]);
  const y = Number(match[3]);
  const sx = originX + x * scale;
  const sy = baselineY - y * scale;
  if (cmd === "M") { ctx.moveTo(sx, sy); strokes++; }
  else ctx.lineTo(sx, sy);
}
ctx.stroke();

// Label
ctx.fillStyle = "#000";
ctx.font = "14px sans-serif";
ctx.fillText(`char=${JSON.stringify(CHAR)}  strokes=${strokes}`, 10, 20);

writeFileSync(`/tmp/skel-${CHAR}.png`, canvas.toBuffer("image/png"));
console.log(`Wrote /tmp/skel-${CHAR}.png  (${strokes} strokes)`);
