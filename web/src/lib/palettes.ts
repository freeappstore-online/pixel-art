import type { PalettePreset } from "./types";

export const DEFAULT_PALETTE: string[] = [
  "#000000", // black
  "#ffffff", // white
  "#dc2626", // red
  "#16a34a", // green
  "#2563eb", // blue
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#d946ef", // magenta
  "#f97316", // orange
  "#92400e", // brown
  "#f472b6", // pink
  "#d1d5db", // light gray
  "#4b5563", // dark gray
  "#84cc16", // lime
  "#1e3a5f", // navy
  "#7f1d1d", // maroon
];

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    name: "NES",
    colors: [
      "#000000", "#fcfcfc", "#f83800", "#0058f8",
      "#00a800", "#e45c10", "#58d854", "#a4e4fc",
      "#3cbcfc", "#6844fc", "#d800cc", "#f8b800",
      "#b8f818", "#787878", "#bce0bc", "#f0d0b0",
    ],
  },
  {
    name: "Game Boy",
    colors: [
      "#0f380f", "#306230", "#8bac0f", "#9bbc0f",
    ],
  },
  {
    name: "PICO-8",
    colors: [
      "#000000", "#1d2b53", "#7e2553", "#008751",
      "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
      "#ff004d", "#ffa300", "#ffec27", "#00e436",
      "#29adff", "#83769c", "#ff77a8", "#ffccaa",
    ],
  },
  {
    name: "Sweetie-16",
    colors: [
      "#1a1c2c", "#5d275d", "#b13e53", "#ef7d57",
      "#ffcd75", "#a7f070", "#38b764", "#257179",
      "#29366f", "#3b5dc9", "#41a6f6", "#73eff7",
      "#f4f4f4", "#94b0c2", "#566c86", "#333c57",
    ],
  },
];
