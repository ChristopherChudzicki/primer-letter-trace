import { defineConfig } from "vite";

export default defineConfig({
  // Project Pages are served at https://<user>.github.io/<repo>/, so assets
  // need to resolve relative to that path when built. Relative base (`./`)
  // works for both local preview and GitHub Pages.
  base: "./",
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
