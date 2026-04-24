import type { FontAsset } from "../rendering/font";
import { dslToD } from "../rendering/skeletons/dsl";
import type { SkeletonDot, SkeletonPath } from "../rendering/skeletons/types";
import { FONT_REGISTRY, type FontKey } from "./fonts";
import { renderGlyph } from "./render";
import { renderNav } from "./nav";

type Source = "baseline" | "override" | "both";

export function renderSingle(
  root: HTMLElement,
  asset: FontAsset,
  char: string,
  font: FontKey,
): void {
  const { baseline, overrides, label: fontLabel } = FONT_REGISTRY[font];

  root.innerHTML = "";
  root.appendChild(renderNav(char, font));

  const wrap = document.createElement("div");
  wrap.classList.add("inspector-single");
  root.appendChild(wrap);

  const stage = document.createElement("div");
  stage.classList.add("inspector-stage");
  wrap.appendChild(stage);

  const sidebar = document.createElement("aside");
  sidebar.classList.add("inspector-sidebar");
  wrap.appendChild(sidebar);

  // Build the source toggle once. Its event handler mutates `source` and
  // triggers a redraw of the stage + the sidebar's data block.
  let source: Source = overrides[char] ? "both" : "baseline";

  const toggle = buildToggle(char, source, overrides, (next) => {
    source = next;
    drawStage();
    drawSidebarData();
  });
  sidebar.appendChild(toggle);

  // Sidebar data (metadata + DSL/d-string) lives in its own container so the
  // redraw can swap it without destroying the toggle that sits above it.
  const sidebarData = document.createElement("div");
  sidebar.appendChild(sidebarData);

  const drawStage = () => {
    stage.replaceChildren();
    if (source === "both") {
      // Render baseline + override overlaid; baseline at lower opacity.
      const both = document.createElement("div");
      both.classList.add("inspector-both");
      const baseEl = renderGlyph({
        char, asset, skeleton: baseline.skeletons[char] ?? "",
        dots: baseline.dots[char] ?? [], sizePx: SIZE_PX,
      });
      baseEl.classList.add("inspector-glyph-baseline");
      both.appendChild(baseEl);
      if (overrides[char]) {
        const overrideEl = renderGlyph({
          char, asset, skeleton: dslToD(overrides[char]!),
          dots: overrides[char]!.dots ?? baseline.dots[char] ?? [], sizePx: SIZE_PX,
        });
        overrideEl.classList.add("inspector-glyph-override");
        // The two SVGs share viewBox + sizePx so absolute-positioning the
        // override layer with inset: 0 makes its coords align with the baseline.
        overrideEl.style.position = "absolute";
        overrideEl.style.inset = "0";
        both.appendChild(overrideEl);
      }
      stage.appendChild(both);
      return;
    }
    const { skeleton, dots } = resolveSkeleton(char, source, baseline, overrides);
    stage.appendChild(renderGlyph({ char, asset, skeleton, dots, sizePx: SIZE_PX }));
  };

  const drawSidebarData = () => {
    sidebarData.replaceChildren(
      renderSidebar(char, source, asset, fontLabel, baseline, overrides),
    );
  };

  drawStage();
  drawSidebarData();
}

const SIZE_PX = 600;

function buildToggle(
  char: string,
  initial: Source,
  overrides: typeof FONT_REGISTRY[FontKey]["overrides"],
  onChange: (next: Source) => void,
): HTMLElement {
  const toggle = document.createElement("div");
  toggle.classList.add("inspector-toggle");
  for (const opt of ["baseline", "override", "both"] as const) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "source";
    radio.value = opt;
    radio.checked = opt === initial;
    radio.disabled = opt === "override" && !overrides[char];
    radio.addEventListener("change", () => {
      if (radio.checked) onChange(opt);
    });
    label.appendChild(radio);
    label.append(` ${opt}`);
    toggle.appendChild(label);
  }
  return toggle;
}

function resolveSkeleton(
  char: string,
  source: Source,
  baseline: typeof FONT_REGISTRY[FontKey]["baseline"],
  overrides: typeof FONT_REGISTRY[FontKey]["overrides"],
): { skeleton: SkeletonPath; dots: SkeletonDot[] } {
  if (source === "override" && overrides[char]) {
    const o = overrides[char]!;
    return { skeleton: dslToD(o), dots: o.dots ?? baseline.dots[char] ?? [] };
  }
  return {
    skeleton: baseline.skeletons[char] ?? "",
    dots: baseline.dots[char] ?? [],
  };
}

function renderSidebar(
  char: string,
  source: Source,
  asset: FontAsset,
  fontLabel: string,
  baseline: typeof FONT_REGISTRY[FontKey]["baseline"],
  overrides: typeof FONT_REGISTRY[FontKey]["overrides"],
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.classList.add("inspector-sidebar-content");

  const title = document.createElement("h2");
  title.textContent = `Glyph: ${char}`;
  wrap.appendChild(title);

  const meta = document.createElement("dl");
  meta.classList.add("inspector-meta");
  const advance = asset.font.charToGlyph(char).advanceWidth ?? 0;
  const hasOverride = overrides[char] !== undefined;
  appendDef(meta, "Font", fontLabel);
  appendDef(meta, "Advance width", `${advance.toFixed(1)} font units`);
  appendDef(meta, "Override?", hasOverride ? "yes" : "no (baseline only)");
  appendDef(meta, "Source shown", source);
  wrap.appendChild(meta);

  const dslHeader = document.createElement("h3");
  dslHeader.textContent = "Current DSL (override) or baseline d string";
  wrap.appendChild(dslHeader);

  const dsl = document.createElement("pre");
  dsl.classList.add("inspector-dsl");
  if (hasOverride) {
    dsl.textContent = JSON.stringify(overrides[char], null, 2);
  } else {
    dsl.textContent = baseline.skeletons[char] ?? "(no baseline)";
  }
  wrap.appendChild(dsl);

  return wrap;
}

function appendDef(dl: HTMLDListElement, term: string, def: string) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  dd.textContent = def;
  dl.appendChild(dt);
  dl.appendChild(dd);
}
