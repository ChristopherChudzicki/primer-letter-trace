import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  expect: { toHaveScreenshot: { maxDiffPixels: 100 } },
  use: {
    baseURL: "http://localhost:4173",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
