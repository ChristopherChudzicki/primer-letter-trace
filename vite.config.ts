import { defineConfig, type Plugin } from "vite";
import { PRESETS } from "./src/config/presets";
import { configToURLParams } from "./src/config/url";

const SITE_URL = "https://christopherchudzicki.github.io/primer-letter-trace/";
const OG_PRESET_KEY = "aa-zz-one-per-row";

/**
 * Builds the OG URL from a named starter preset at build time and injects it
 * into index.html. Runs during both `dev` and `build`, so local previews see
 * the same thing crawlers would. Using a plugin instead of runtime JS because
 * most OG scrapers do not execute JavaScript.
 */
function ogUrlPlugin(): Plugin {
  return {
    name: "og-url",
    transformIndexHtml(html) {
      const preset = PRESETS.find((p) => p.key === OG_PRESET_KEY);
      if (!preset) throw new Error(`og-url plugin: preset "${OG_PRESET_KEY}" not found`);
      const params = configToURLParams(preset.config);
      // HTML-escape ampersands so the attribute value is valid HTML.
      const ogUrl = `${SITE_URL}?${params.toString()}`.replace(/&/g, "&amp;");
      return html.replace(/%OG_URL%/g, ogUrl);
    },
  };
}

export default defineConfig({
  // Project Pages are served at https://<user>.github.io/<repo>/, so assets
  // need to resolve relative to that path when built. Relative base (`./`)
  // works for both local preview and GitHub Pages.
  base: "./",
  plugins: [ogUrlPlugin()],
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
