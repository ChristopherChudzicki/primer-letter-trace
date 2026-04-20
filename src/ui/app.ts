import { loadFont } from "../rendering/font";
import { bindForm } from "./form";
import { renderPreview } from "./preview";
import { configFromURL, configToURLParams } from "../config/url";
import type { SheetConfig } from "../config/types";
import { Store } from "../state/store";

export async function startApp(): Promise<void> {
  const controls = document.getElementById("controls");
  const preview = document.getElementById("preview");
  if (!controls || !preview) throw new Error("DOM roots missing");

  preview.textContent = "Loading font…";
  // BASE_URL is "/" in dev and whatever `base` is set to in production
  // (currently "./" — works when the app is served from any subpath like
  // /primer-letter-trace/).
  const asset = await loadFont(`${import.meta.env.BASE_URL}andika.ttf`);

  const store = new Store<SheetConfig>(configFromURL(new URL(window.location.href)));

  // Dynamic @page size/orientation matches the user's paperSize selection,
  // so the print dialog opens with the right defaults.
  const pageStyle = document.createElement("style");
  document.head.appendChild(pageStyle);

  store.run((config) => {
    document.body.dataset.paper = config.paperSize;
    const pageSize = config.paperSize === "a4" ? "A4" : "letter";
    pageStyle.textContent = `@page { size: ${pageSize} portrait; margin: 0; }`;
    const params = configToURLParams(config);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  });

  store.run((config) => {
    renderPreview(preview, asset, config);
  });

  window.addEventListener("popstate", () => {
    store.set(configFromURL(new URL(window.location.href)));
  });

  bindForm(controls, store);
}
