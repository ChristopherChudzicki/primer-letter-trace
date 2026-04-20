// Render a preview grid as a PNG: filled glyph + centerline skeleton.
import { readFileSync, writeFileSync } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";
import opentype from "opentype.js";
import SET from "../src/rendering/skeletons/andika.ts";

const buf = readFileSync("public/andika.ttf");
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const font = opentype.parse(ab);

const chars = Object.keys(SET.skeletons);
const fontSize = 120;
const cellW = 140;
const cellH = 180;
const cols = 10;
const rows = Math.ceil(chars.length / cols);

const canvas = createCanvas(cellW * cols, cellH * rows);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

chars.forEach((char, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const cx = col * cellW;
  const cy = row * cellH;

  const baselineY = cy + cellH * 0.8;
  const scale = fontSize / font.unitsPerEm;
  const glyph = font.charToGlyph(char);
  const advance = (glyph.advanceWidth ?? font.unitsPerEm * 0.5) * scale;
  const originX = cx + (cellW - advance) / 2;

  ctx.strokeStyle = "#eee";
  ctx.strokeRect(cx, cy, cellW, cellH);
  ctx.strokeStyle = "#fcd";
  ctx.beginPath();
  ctx.moveTo(cx, baselineY);
  ctx.lineTo(cx + cellW, baselineY);
  ctx.stroke();

  // Filled glyph in pale gray
  const glyphPath = font.getPath(char, originX, baselineY, fontSize);
  glyphPath.fill = "rgba(0,0,0,0.13)";
  glyphPath.stroke = null;
  glyphPath.draw(ctx as unknown as CanvasRenderingContext2D);

  // Skeleton as red stroke. Skeleton is in font units with y-up convention.
  const skel = SET.skeletons[char];
  if (skel) {
    ctx.strokeStyle = "#d30";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const match of skel.matchAll(/([ML])\s*([-\d.]+)\s+([-\d.]+)/g)) {
      const cmd = match[1]!;
      const x = Number(match[2]);
      const y = Number(match[3]);
      const sx = originX + x * scale;
      const sy = baselineY - y * scale;
      if (cmd === "M") ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  ctx.fillStyle = "#888";
  ctx.font = "10px sans-serif";
  ctx.fillText(char, cx + 4, cy + 14);
});

writeFileSync("/tmp/skeleton-preview.png", canvas.toBuffer("image/png"));
console.log(`Wrote /tmp/skeleton-preview.png (${canvas.width}x${canvas.height})`);
