import { CHARS } from "./chars";
import { FONT_REGISTRY, inspectHref, type FontKey } from "./fonts";

export function renderNav(currentChar: string | null, font: FontKey): HTMLElement {
  const nav = document.createElement("nav");
  nav.classList.add("inspector-nav");

  // Font toggle: a small radio group that navigates to the same inspect
  // target under a different font. Full navigation (not in-page swap) keeps
  // state and the URL in sync.
  const fontWrap = document.createElement("div");
  fontWrap.classList.add("inspector-nav-fonts");
  for (const [key, entry] of Object.entries(FONT_REGISTRY)) {
    const label = document.createElement("label");
    label.classList.add("inspector-nav-font");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "font";
    radio.value = key;
    radio.checked = key === font;
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      const target = currentChar ?? "*";
      window.location.href = inspectHref(target, key as FontKey);
    });
    label.appendChild(radio);
    label.append(` ${entry.label}`);
    fontWrap.appendChild(label);
  }
  nav.appendChild(fontWrap);

  const grid = document.createElement("a");
  grid.href = inspectHref("*", font);
  grid.textContent = "grid";
  grid.classList.add("inspector-nav-link");
  if (currentChar === null) grid.classList.add("inspector-nav-current");
  nav.appendChild(grid);

  for (const c of CHARS) {
    const link = document.createElement("a");
    link.href = inspectHref(c, font);
    link.textContent = c;
    link.classList.add("inspector-nav-link");
    if (c === currentChar) link.classList.add("inspector-nav-current");
    nav.appendChild(link);
  }
  return nav;
}
