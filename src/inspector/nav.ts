import { CHARS } from "./chars";

export function renderNav(currentChar: string | null): HTMLElement {
  const nav = document.createElement("nav");
  nav.classList.add("inspector-nav");

  const grid = document.createElement("a");
  grid.href = "?inspect=*";
  grid.textContent = "grid";
  grid.classList.add("inspector-nav-link");
  if (currentChar === null) grid.classList.add("inspector-nav-current");
  nav.appendChild(grid);

  for (const c of CHARS) {
    const link = document.createElement("a");
    link.href = `?inspect=${encodeURIComponent(c)}`;
    link.textContent = c;
    link.classList.add("inspector-nav-link");
    if (c === currentChar) link.classList.add("inspector-nav-current");
    nav.appendChild(link);
  }
  return nav;
}
