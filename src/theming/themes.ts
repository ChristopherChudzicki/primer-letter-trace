import type { Theme } from "../config/types";

export interface ThemeDef {
  ruleColor: string;
  accentColor: string;
  cornerSvg: string;
}

const STAR = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path fill="currentColor" d="M24 4l5.6 11.4 12.6 1.8-9.1 8.9 2.2 12.5L24 32.7l-11.3 5.9 2.2-12.5-9.1-8.9 12.6-1.8z" />
</svg>`;

const UNICORN_HORN = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path fill="currentColor" d="M24 4L18 44h12z"/>
  <path fill="#fff" opacity="0.5" d="M24 8l-3 18h6z"/>
</svg>`;

const CROWN = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <path fill="currentColor" d="M4 18l8 6 6-14 6 14 6-14 6 14 8-6-4 22H8z"/>
  <circle fill="currentColor" cx="24" cy="10" r="3"/>
</svg>`;

export const THEMES: Record<Theme, ThemeDef> = {
  none: {
    ruleColor: "#b8b8b8",
    accentColor: "#b8b8b8",
    cornerSvg: "",
  },
  fairy: {
    ruleColor: "#c48cc9",
    accentColor: "#e6a5ea",
    cornerSvg: STAR,
  },
  unicorn: {
    ruleColor: "#8aa8d0",
    accentColor: "#f4b5c7",
    cornerSvg: UNICORN_HORN,
  },
  princess: {
    ruleColor: "#d46f87",
    accentColor: "#f4c56e",
    cornerSvg: CROWN,
  },
};
