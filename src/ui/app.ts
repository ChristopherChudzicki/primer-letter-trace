import { loadFont } from "../rendering/font";
import { bindForm } from "./form";
import { renderPreview } from "./preview";
import { configFromURL, configToURLParams } from "../config/url";
import { presetByKey } from "../config/presets";
import type { SheetConfig } from "../config/types";
import { Store } from "../state/store";

// Which starter preset to show on a bare visit (no query string). Once the
// URL has any params, configFromURL takes over and this is ignored.
const LANDING_PRESET_KEY = "aa-zz-one-per-row";

export async function startApp(): Promise<void> {
  const url = new URL(window.location.href);
  const inspectTarget = url.searchParams.get("inspect");

  if (inspectTarget !== null) {
    document.body.innerHTML = "";
    document.body.dataset.mode = "inspector";
    const status = document.createElement("p");
    status.textContent = "Loading font…";
    document.body.appendChild(status);
    const asset = await loadFont(`${import.meta.env.BASE_URL}andika.ttf`);
    status.remove();
    const { renderInspector } = await import("../inspector");
    renderInspector({ target: inspectTarget, root: document.body, asset });
    return;
  }

  const controls = document.getElementById("controls");
  const preview = document.getElementById("preview");
  if (!controls || !preview) throw new Error("DOM roots missing");

  preview.textContent = "Loading font…";
  // BASE_URL is "/" in dev and whatever `base` is set to in production
  // (currently "./" — works when the app is served from any subpath like
  // /primer-letter-trace/).
  const asset = await loadFont(`${import.meta.env.BASE_URL}andika.ttf`);

  const store = new Store<SheetConfig>(initialConfig());

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

/** Bare visit → load the landing preset; otherwise parse the URL. */
function initialConfig(): SheetConfig {
  const url = new URL(window.location.href);
  if (url.search === "") {
    const preset = presetByKey(LANDING_PRESET_KEY);
    if (preset) return preset.config;
  }
  return configFromURL(url);
}
