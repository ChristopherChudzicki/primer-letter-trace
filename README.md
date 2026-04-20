# Worksheets

A static web app that generates printable letter, number, and handwriting practice sheets for young learners.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints. The form on the left controls the sheet; the preview on the right updates live. Click **Print** (or Cmd-P / Ctrl-P) to open the browser print dialog.

## Printing tips

For cleanest output in Chrome:
1. In the print dialog, open **More settings**.
2. Under **Margins**, choose **Default** (or **None**).
3. Uncheck **Headers and footers**.
4. Check **Background graphics** if you want theme colors to print.

The app uses physical CSS units (inches, mm) so printed letter sizes match the Small/Medium/Large presets.

## Configuration via URL

Every control is reflected in the URL, so any sheet is shareable. Example:

```
?content=Aa+Bb+Cc&layout=multi&row=combo&size=medium&theme=fairy&paper=letter
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — serve the production build
- `npm test` — unit tests (Vitest)
- `npm run test:e2e` — visual regression tests (Playwright)
- `npm run test:e2e:update` — regenerate Playwright snapshots

## Font credit

This app bundles **Andika** by SIL International, licensed under the **SIL Open Font License, Version 1.1**. See `public/OFL.txt` for the full license.
